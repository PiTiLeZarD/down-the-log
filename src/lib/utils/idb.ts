// Web-only IndexedDB access. Storage on web used to go through AsyncStorage, which is localStorage
// there: a ~5 MB budget for the whole origin, everything stringified, and a synchronous API. This
// has neither limit — the quota is a share of free disk, records are written one at a time, and
// values are structured-cloned rather than serialised.
//
// Every entry point resolves to `undefined`/`false` instead of throwing when there is no
// IndexedDB — node under test, a browser profile that refuses it — so callers can keep their
// AsyncStorage path as the fallback.

const DB_NAME = "down-the-log";
const DB_VERSION = 1;

// The log, one record per QSO keyed by its id.
export const QSO_STORE = "qsos";
// Everything else the store persists — settings, sessions, filters — as one record.
export const META_STORE = "meta";
// The read-through cache for reference data. See with-cache.
export const CACHE_STORE = "cache";

const STORES = [QSO_STORE, META_STORE, CACHE_STORE];

// `value: undefined` is a delete: the stores hold plain data, and nothing ever writes an undefined.
export type IdbOp = { store: string; key: IDBValidKey; value?: unknown };

const promised = <T>(request: IDBRequest<T>): Promise<T> =>
    new Promise((resolve, reject) => {
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });

const open = (): Promise<IDBDatabase | undefined> => {
    if (typeof indexedDB === "undefined") return Promise.resolve(undefined);
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () =>
        STORES.filter((store) => !request.result.objectStoreNames.contains(store)).forEach((store) =>
            request.result.createObjectStore(store),
        );
    return promised(request).catch(() => undefined);
};

// One connection for the life of the tab, opened on first use.
let database: Promise<IDBDatabase | undefined> | undefined;
const db = () => (database ??= open());

export const idbAvailable = () => typeof indexedDB !== "undefined";

/**
 * Ask for the origin's storage to be persistent. Without it the browser treats the data as best
 * effort and may evict it under disk pressure, and Safari drops an origin that goes unvisited for a
 * week. An installed PWA is normally granted this without prompting; a plain tab may be refused,
 * which is not an error — the data is still there, it is just evictable.
 */
export const requestPersistence = async (): Promise<boolean> => {
    if (typeof navigator === "undefined") return false;
    try {
        return (await navigator.storage?.persist?.()) ?? false;
    } catch {
        return false;
    }
};

export const idbGet = async <T>(store: string, key: IDBValidKey): Promise<T | undefined> => {
    const connection = await db();
    if (!connection) return undefined;
    return promised<T | undefined>(connection.transaction(store, "readonly").objectStore(store).get(key));
};

export const idbValues = async <T>(store: string): Promise<T[]> => {
    const connection = await db();
    if (!connection) return [];
    return promised<T[]>(connection.transaction(store, "readonly").objectStore(store).getAll());
};

/**
 * Every op in one transaction, so a save either lands whole or not at all: a QSO record written
 * without the session record that owns it would show up orphaned. Returns false rather than
 * throwing when the write can't happen — no IndexedDB, or the origin is out of quota — because the
 * callers use that to decide whether the old copy is still the only one there is.
 */
export const idbBatch = async (ops: IdbOp[]): Promise<boolean> => {
    const connection = await db();
    if (!connection) return false;
    if (!ops.length) return true;
    try {
        const transaction = connection.transaction([...new Set(ops.map((op) => op.store))], "readwrite");
        ops.forEach(({ store, key, value }) => {
            const objectStore = transaction.objectStore(store);
            if (value === undefined) objectStore.delete(key);
            else objectStore.put(value, key);
        });
        return await new Promise<boolean>((resolve, reject) => {
            transaction.oncomplete = () => resolve(true);
            transaction.onerror = () => reject(transaction.error);
            transaction.onabort = () => reject(transaction.error);
        });
    } catch {
        return false;
    }
};
