import AsyncStorage from "@react-native-async-storage/async-storage";
import { DateTime } from "luxon";
import { Platform } from "react-native";
import { CACHE_STORE, idbAvailable, idbBatch, idbGet } from "./idb";

type CacheEntry = { data: string; cachedAt: string; shelflife: number };

const dtFormat = "yyyyMMddHHmmss";

const parseEntry = (entry: string) => JSON.parse(entry) as CacheEntry;
const isValidEntry = ({ cachedAt, shelflife }: CacheEntry): boolean =>
    DateTime.local().diff(DateTime.fromFormat(cachedAt, dtFormat), ["seconds"]).seconds <= shelflife;

// Reference data is the other thing that used to eat the 5 MB localStorage budget on web — country
// files and the like, cached whole. It goes to IndexedDB with the log; native keeps AsyncStorage.
const indexed = Platform.OS === "web" && idbAvailable();

const readEntry = async (key: string): Promise<CacheEntry | undefined> => {
    if (indexed) return idbGet<CacheEntry>(CACHE_STORE, key);
    const raw = await AsyncStorage.getItem(key);
    return raw ? parseEntry(raw) : undefined;
};

const writeEntry = async (key: string, entry: CacheEntry) => {
    if (!indexed) return AsyncStorage.setItem(key, JSON.stringify(entry));
    // The copy this key had in localStorage is dead weight against that budget once the entry lives
    // in IndexedDB, but it is only dropped if the new write actually landed.
    if (await idbBatch([{ store: CACHE_STORE, key, value: entry }])) await AsyncStorage.removeItem(key);
};

// Not a hook despite the old name — it's a plain async read-through cache, and calling it from
// a callback tripped the rules-of-hooks lint.
export const withCache = async (key: string, fetchData: () => Promise<string>, shelflife: number) => {
    const entry = await readEntry(key);
    if (!entry || !isValidEntry(entry)) {
        const data = await fetchData();
        void writeEntry(key, { data, shelflife, cachedAt: DateTime.local().toFormat(dtFormat) });
        return data;
    }
    return entry.data;
};
