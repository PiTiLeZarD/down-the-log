import AsyncStorage from "@react-native-async-storage/async-storage";
import React from "react";
import { Platform } from "react-native";
import { useStore } from "./store";

// The web fallback budget, and only that: it is what localStorage gives an origin — ~5 MB, billed in
// UTF-16 code units, so every character costs two bytes whatever it is. Storage moved to IndexedDB,
// whose quota is a share of free disk rather than a fixed number, so this is used only where the
// Storage API can't be asked. Native AsyncStorage is SQLite-backed and has no comparable ceiling.
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

// Whatever is still in localStorage, which after the move to IndexedDB is other libraries' keys and
// any cache entry not yet re-fetched. Read directly rather than through AsyncStorage: the quota
// covers every key on the origin, so counting only ours would understate it.
const localEntries = (): StorageEntry[] => {
    const entries: StorageEntry[] = [];
    for (let i = 0; i < window.localStorage.length; i++) {
        const key = window.localStorage.key(i);
        if (key == undefined) continue;
        entries.push({ key, size: (key.length + (window.localStorage.getItem(key)?.length || 0)) * 2 });
    }
    return entries;
};

// IndexedDB's quota is not a fixed number — browsers hand out a share of free disk, and the figure
// moves as the disk fills — so the Storage API is the only thing that knows it. It also counts every
// store on the origin, which is exactly what the gauge is asking about. What it won't give is a
// per-record breakdown, and reading the whole log back to size it would cost more than the readout
// is worth, so `entries` covers only what is left in localStorage.
const measureWeb = async (): Promise<StorageUsage> => {
    const entries = bySize(localEntries());
    const estimate = await navigator.storage?.estimate?.().catch(() => undefined);
    if (!estimate?.quota) return { used: total(entries), quota: WEB_QUOTA, entries };
    return { used: estimate.usage ?? total(entries), quota: estimate.quota, entries };
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

    // Both sides are async: the web figure comes from the Storage API, the native one from walking
    // AsyncStorage. Either way the state update lands out of the effect body, where a sync setState
    // would cascade.
    const refresh = React.useCallback(() => {
        const measured = Platform.OS === "web" ? measureWeb() : measureNative();
        measured.then(setUsage);
    }, []);

    React.useEffect(() => {
        refresh();
    }, [refresh, qsos, settings]);

    return { usage, refresh };
};

// Gigabytes are on the scale now: an IndexedDB quota is a share of the free disk, so "5734.62 MB"
// is a plausible reading and not one anybody wants to parse.
export const formatBytes = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} kB`;
    if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
    return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
};
