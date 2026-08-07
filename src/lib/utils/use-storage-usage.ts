import AsyncStorage from "@react-native-async-storage/async-storage";
import React from "react";
import { Platform } from "react-native";
import { useStore } from "./store";

// Browsers bill localStorage in UTF-16 code units against a ~5 MB budget, so every stored character
// costs two bytes whatever it is. Native AsyncStorage is SQLite-backed and has no comparable
// ceiling, so a quota — and the gauge that needs one to mean anything — is web only.
export const WEB_QUOTA = 5 * 1024 * 1024;

export type StorageEntry = { key: string; size: number };
export type StorageUsage = {
    used: number;
    quota?: number;
    // Biggest first: the log dwarfs everything else, and the rest is reference-data cache.
    entries: StorageEntry[];
};

const total = (entries: StorageEntry[]) => entries.reduce((acc, e) => acc + e.size, 0);
const bySize = (entries: StorageEntry[]) => [...entries].sort((a, b) => b.size - a.size);

// Read localStorage directly rather than through AsyncStorage: the quota covers every key on the
// origin, including the ones other libraries wrote, so counting only ours would understate it.
const measureWeb = (): StorageUsage => {
    const entries: StorageEntry[] = [];
    for (let i = 0; i < window.localStorage.length; i++) {
        const key = window.localStorage.key(i);
        if (key == undefined) continue;
        entries.push({ key, size: (key.length + (window.localStorage.getItem(key)?.length || 0)) * 2 });
    }
    return { used: total(entries), quota: WEB_QUOTA, entries: bySize(entries) };
};

const measureNative = async (): Promise<StorageUsage> => {
    const keys = await AsyncStorage.getAllKeys();
    const entries = (await AsyncStorage.multiGet(keys)).map(([key, value]) => ({
        key,
        size: (key.length + (value?.length || 0)) * 2,
    }));
    return { used: total(entries), entries: bySize(entries) };
};

// Measuring means walking every key, so it's done on demand and after the log changes rather than
// on a timer. The persist middleware writes asynchronously, so the figure can trail the very last
// QSO by a tick — refresh picks it up.
export const useStorageUsage = () => {
    const qsos = useStore((state) => state.qsos);
    const settings = useStore((state) => state.settings);
    const [usage, setUsage] = React.useState<StorageUsage | undefined>(undefined);

    // Kept async on both platforms: measuring the web side is synchronous, but resolving it through
    // a promise keeps the state update out of the effect body, where a sync setState cascades.
    const refresh = React.useCallback(() => {
        const measured = Platform.OS === "web" ? Promise.resolve(measureWeb()) : measureNative();
        measured.then(setUsage);
    }, []);

    React.useEffect(() => {
        refresh();
    }, [refresh, qsos, settings]);

    return { usage, refresh };
};

export const formatBytes = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} kB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
};
