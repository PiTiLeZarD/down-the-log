// What a storage back end deals in: the store's data in a form that survives the trip, plain objects
// with every Luxon DateTime as its ISO string. See toStorable in ./index.

export type StoredState = {
    // Everything the store holds except the QSOs. Undefined on a first run.
    meta?: Record<string, unknown>;
    qsos: unknown[];
};

export type WriteBatch = {
    put: { id: string; value: unknown }[];
    remove: string[];
    // Only when something in it changed: logging a QSO doesn't rewrite the settings.
    meta?: Record<string, unknown>;
};

export type Backend = {
    load: () => Promise<StoredState>;
    // All of the batch or none of it. Throws when it couldn't be written, which is what keeps the
    // caller from believing a QSO is on disk when it isn't.
    write: (batch: WriteBatch) => Promise<void>;
    // Bytes on disk, where the platform can say. Read by the storage gauge in Settings.
    size?: () => Promise<number>;
};
