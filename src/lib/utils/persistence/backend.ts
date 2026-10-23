import AsyncStorage from "@react-native-async-storage/async-storage";
import { IdbOp, META_STORE, QSO_STORE, idbBatch, idbGet, idbOpen, idbValues, requestPersistence } from "../idb";
import type { Backend, StoredState, WriteBatch } from "./types";

// Web and the Tauri shell: IndexedDB, one record per QSO plus one for everything else. Metro picks
// backend.native.ts on iOS and Android instead.

// The meta record's key and shape are the ones zustand's persist middleware wrote, so a log saved
// before it was dropped reads back as it is.
const KEY = "dtl-storage";
type MetaRecord = { state: Record<string, unknown>; version: number };

const ops = ({ put, remove, meta }: WriteBatch): IdbOp[] => [
    ...put.map(({ id, value }): IdbOp => ({ store: QSO_STORE, key: id, value })),
    ...remove.map((id): IdbOp => ({ store: QSO_STORE, key: id })),
    ...(meta ? [{ store: META_STORE, key: KEY, value: { state: meta, version: 0 } satisfies MetaRecord }] : []),
];

const write = async (batch: WriteBatch) => {
    if (!(await idbBatch(ops(batch))))
        throw new Error("the browser refused to save, most likely because its storage for this site is full");
};

// A log from before IndexedDB, still in the localStorage behind AsyncStorage. It moves over whole,
// and the old copy is only dropped once the new one is written — until then it's the only copy.
const migrateFromLocalStorage = async (): Promise<StoredState> => {
    const raw = await AsyncStorage.getItem(KEY);
    if (!raw) return { qsos: [] };
    const { qsos = [], ...meta } = (JSON.parse(raw) as MetaRecord).state;
    const list = qsos as { id: string }[];
    await write({ put: list.map((qso) => ({ id: qso.id, value: qso })), remove: [], meta });
    await AsyncStorage.removeItem(KEY);
    return { meta, qsos: list };
};

export const backend: Backend = {
    load: async () => {
        if (!(await idbOpen())) throw new Error("this browser won't give the app any storage (IndexedDB is unavailable)");
        void requestPersistence();
        const meta = await idbGet<MetaRecord>(META_STORE, KEY);
        if (!meta) return migrateFromLocalStorage();
        return { meta: meta.state, qsos: await idbValues(QSO_STORE) };
    },
    write,
};
