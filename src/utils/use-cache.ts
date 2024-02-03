import AsyncStorage from "@react-native-async-storage/async-storage";
import { DateTime } from "luxon";

type CacheEntry = { data: string; cachedAt: string; shelflife: number };

const dtFormat = "yyyyMMddHHmmss";

const parseEntry = (entry: string) => JSON.parse(entry) as CacheEntry;
const isValidEntry = ({ cachedAt, shelflife }: CacheEntry): boolean =>
    DateTime.local().diff(DateTime.fromFormat(cachedAt, dtFormat), ["seconds"]).seconds <= shelflife;

export const useCache = async (key: string, fetchData: () => Promise<string>, shelflife: number) => {
    const entry = await AsyncStorage.getItem(key);
    const parsed = entry ? parseEntry(entry) : undefined;
    if (!entry || !isValidEntry(parsed as CacheEntry)) {
        const data = await fetchData();
        AsyncStorage.setItem(key, JSON.stringify({ data, shelflife, cachedAt: DateTime.local().toFormat(dtFormat) }));
        return data;
    }
    return (parsed as CacheEntry).data;
};
