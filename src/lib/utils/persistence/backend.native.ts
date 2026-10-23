import AsyncStorage from "@react-native-async-storage/async-storage";
import * as SecureStore from "expo-secure-store";
import { openDatabaseAsync, type SQLiteDatabase } from "expo-sqlite";
import type { Backend, StoredState, WriteBatch } from "./types";

// iOS and Android: SQLite, one row per QSO plus one for everything else. AsyncStorage held the
// whole log as a single value, which Android caps at 6 MB for the database and can't read back
// at all once one row outgrows its 2 MB cursor window. SQLite has neither limit, and a transaction
// lands whole or not at all, the same promise IndexedDB makes on web.

let database: Promise<SQLiteDatabase> | undefined;
const db = () =>
    (database ??= openDatabaseAsync("down-the-log.db").then(async (connection) => {
        await connection.execAsync(`
            PRAGMA journal_mode = WAL;
            CREATE TABLE IF NOT EXISTS qsos (id TEXT PRIMARY KEY NOT NULL, value TEXT NOT NULL);
            CREATE TABLE IF NOT EXISTS meta (key TEXT PRIMARY KEY NOT NULL, value TEXT NOT NULL);
        `);
        return connection;
    }));

// Passwords and keys never reach the database. They're lifted out of the settings on the way in and
// kept in the Keychain/Keystore, under the keys the AsyncStorage version already used. A password
// that belongs to a service block (`hamqth.password`) is only handled while that block exists.
const SECRETS = [
    { key: "dtl-hamqth-password", field: "hamqth", nested: true },
    { key: "dtl-lotw-password", field: "lotw", nested: true },
    { key: "dtl-eqsl-password", field: "eqsl", nested: true },
    { key: "dtl-clublog-password", field: "clublog", nested: true },
    { key: "dtl-pnp-api-key", field: "pnpApiKey", nested: false },
];

type Settings = Record<string, unknown>;

// What each secret was last read or written as, so a save only touches the Keychain for one that
// changed rather than five round trips on every QSO.
const known = new Map<string, string | undefined>();

const withSecrets = async (meta: Record<string, unknown>) => {
    const settings = { ...(meta.settings as Settings | undefined) };
    for (const { key, field, nested } of SECRETS) {
        if (nested && !settings[field]) continue;
        const value = (await SecureStore.getItemAsync(key)) ?? undefined;
        known.set(key, value);
        if (value) settings[field] = nested ? { ...(settings[field] as Settings), password: value } : value;
    }
    return { ...meta, settings };
};

const withoutSecrets = async (meta: Record<string, unknown>) => {
    const settings = { ...(meta.settings as Settings | undefined) };
    for (const { key, field, nested } of SECRETS) {
        let value: string | undefined;
        if (nested) {
            if (!settings[field]) continue;
            const { password, ...rest } = settings[field] as Settings;
            value = password as string | undefined;
            settings[field] = rest;
        } else {
            value = settings[field] as string | undefined;
            delete settings[field];
        }
        if (known.has(key) && known.get(key) === value) continue;
        if (value) await SecureStore.setItemAsync(key, value);
        else await SecureStore.deleteItemAsync(key);
        known.set(key, value);
    }
    return { ...meta, settings };
};

const write = async ({ put, remove, meta }: WriteBatch) => {
    const connection = await db();
    const stored = meta && (await withoutSecrets(meta));
    await connection.withExclusiveTransactionAsync(async (txn) => {
        if (put.length) {
            const insert = await txn.prepareAsync("INSERT OR REPLACE INTO qsos (id, value) VALUES (?, ?)");
            try {
                for (const { id, value } of put) await insert.executeAsync(id, JSON.stringify(value));
            } finally {
                await insert.finalizeAsync();
            }
        }
        if (remove.length) {
            const drop = await txn.prepareAsync("DELETE FROM qsos WHERE id = ?");
            try {
                for (const id of remove) await drop.executeAsync(id);
            } finally {
                await drop.finalizeAsync();
            }
        }
        if (stored) await txn.runAsync("INSERT OR REPLACE INTO meta (key, value) VALUES ('state', ?)", JSON.stringify(stored));
    });
};

// The AsyncStorage blob from before SQLite: the whole state as JSON, passwords already in the
// Keychain. It moves over in one transaction and is only removed once that has landed. A blob too
// big for Android to read fails the load instead, and is left where it is.
const LEGACY_KEY = "dtl-storage";

const migrateFromAsyncStorage = async (): Promise<StoredState> => {
    const raw = await AsyncStorage.getItem(LEGACY_KEY);
    if (!raw) return { qsos: [] };
    const { qsos = [], ...rest } = (JSON.parse(raw) as { state: Record<string, unknown> }).state;
    const list = qsos as { id: string }[];
    const meta = await withSecrets(rest);
    await write({ put: list.map((qso) => ({ id: qso.id, value: qso })), remove: [], meta });
    await AsyncStorage.removeItem(LEGACY_KEY);
    return { meta, qsos: list };
};

export const backend: Backend = {
    load: async () => {
        const connection = await db();
        const meta = await connection.getFirstAsync<{ value: string }>("SELECT value FROM meta WHERE key = 'state'");
        if (!meta) return migrateFromAsyncStorage();
        const rows = await connection.getAllAsync<{ value: string }>("SELECT value FROM qsos");
        return { meta: await withSecrets(JSON.parse(meta.value)), qsos: rows.map((row) => JSON.parse(row.value)) };
    },
    write,
    size: async () => {
        const connection = await db();
        const pages = await connection.getFirstAsync<{ page_count: number }>("PRAGMA page_count");
        const page = await connection.getFirstAsync<{ page_size: number }>("PRAGMA page_size");
        return (pages?.page_count ?? 0) * (page?.page_size ?? 0);
    },
};
