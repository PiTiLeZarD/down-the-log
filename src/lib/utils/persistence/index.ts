import { DateTime } from "luxon";
import { create } from "zustand";
import type { QSO } from "../../components/qso";
import { liftSubmode } from "../../data/modes";
import { fixSettings, useStore, type UseStorePropsType } from "../store";
import { backend as platformBackend } from "./backend";
import type { Backend, WriteBatch } from "./types";

// Saving the store, done by hand rather than by zustand's persist middleware. That middleware wrote
// on every `set` whether or not the log had been read yet, so a launch whose read failed — or a GPS
// fix that landed before it finished — wrote an empty log over the real one. It also handed storage
// the whole state on every change and never heard whether the write worked. Here the log is read
// once before anything renders, writes start only after that read succeeded, and what counts as
// saved only moves once the back end says it is.

export type PersistenceState = {
    status: "loading" | "ready" | "failed";
    // Why the log couldn't be read. Nothing is written for the rest of the run when it's set.
    error?: string;
    // Why the last save didn't land. Cleared by the next one that does.
    writeError?: string;
};

export const usePersistence = create<PersistenceState>(() => ({ status: "loading" }));

const dateKeys = ["date", "dateOff", "sessionStart", "startedAt", "endedAt"];

// Luxon's DateTime is a class instance: JSON would lose its type and a structured clone its
// prototype, so it goes to disk as an ISO string and is revived by key on the way back.
export const toStorable = (value: unknown): unknown => {
    if (DateTime.isDateTime(value)) return value.toISO();
    if (Array.isArray(value)) return value.map(toStorable);
    if (value && typeof value === "object")
        return Object.fromEntries(Object.entries(value).map(([key, entry]) => [key, toStorable(entry)]));
    return value;
};

export const fromStorable = (value: unknown, key = ""): unknown => {
    if (Array.isArray(value)) return value.map((entry) => fromStorable(entry));
    if (value && typeof value === "object")
        return Object.fromEntries(Object.entries(value).map(([field, entry]) => [field, fromStorable(entry, field)]));
    return dateKeys.includes(key) && typeof value === "string" ? DateTime.fromISO(value, { setZone: true }) : value;
};

const message = (e: unknown) => (e instanceof Error ? e.message : String(e));

// Everything but the QSOs and the actions.
const metaOf = (state: UseStorePropsType): Record<string, unknown> =>
    Object.fromEntries(Object.entries(state).filter(([key, value]) => key !== "qsos" && typeof value !== "function"));

// What was last written, by reference. The store's actions keep the object of every QSO and every
// setting they didn't touch, so identity is enough to tell what changed: logging one contact writes
// one row, not the log.
let savedQsos = new Map<string, QSO>();
let savedMeta: Record<string, unknown> = {};

const diff = (state: UseStorePropsType) => {
    const qsos = new Map(state.qsos.map((qso) => [qso.id, qso]));
    const meta = metaOf(state);
    const metaChanged = Object.keys({ ...meta, ...savedMeta }).some((key) => meta[key] !== savedMeta[key]);
    const batch: WriteBatch = {
        put: state.qsos.filter((qso) => savedQsos.get(qso.id) !== qso).map((qso) => ({ id: qso.id, value: toStorable(qso) })),
        remove: [...savedQsos.keys()].filter((id) => !qsos.has(id)),
        ...(metaChanged ? { meta: toStorable(meta) as Record<string, unknown> } : {}),
    };
    return { batch, qsos, meta };
};

let backend: Backend = platformBackend;
let saving: Promise<void> | undefined;
let again = false;

const flush = async () => {
    try {
        do {
            again = false;
            const { batch, qsos, meta } = diff(useStore.getState());
            if (!batch.put.length && !batch.remove.length && !batch.meta) continue;
            await backend.write(batch);
            savedQsos = qsos;
            savedMeta = meta;
        } while (again);
        if (usePersistence.getState().writeError) usePersistence.setState({ writeError: undefined });
    } catch (e) {
        // Nothing above moved, so the next change diffs against the last good write and sends
        // this one's QSOs again along with its own.
        usePersistence.setState({ writeError: message(e) });
    } finally {
        saving = undefined;
    }
};

// One write at a time, each diffed against what the one before it actually saved. Changes made while
// a write is out are picked up by a second pass rather than racing it to the disk. Only once the log
// has been read: before that, the store holds defaults that would overwrite it.
export const save = (): Promise<void> => {
    if (usePersistence.getState().status !== "ready") return Promise.resolve();
    if (saving) {
        again = true;
        return saving;
    }
    // Started on the next tick, not called: a pass with nothing to write finishes synchronously, and
    // its `finally` would clear `saving` before this line had set it.
    saving = Promise.resolve().then(flush);
    return saving;
};

const load = async () => {
    try {
        const stored = await backend.load();
        const meta = (stored.meta ? fromStorable(stored.meta) : {}) as Partial<UseStorePropsType>;
        // `liftSubmode` turns QSOs imported before FT4/JS8 were modes of their own into those modes.
        // Nothing is rewritten for it: the lift is cheap, and a QSO only goes back once it's edited.
        const qsos = stored.qsos.map((qso) => liftSubmode(fromStorable(qso) as QSO));
        useStore.setState({ ...meta, qsos, settings: fixSettings(meta.settings || {}) });
        // Seeded from the store as it now stands, so the first save has nothing to rewrite.
        const state = useStore.getState();
        savedQsos = new Map(state.qsos.map((qso) => [qso.id, qso]));
        savedMeta = metaOf(state);
        useStore.subscribe(() => void save());
        usePersistence.setState({ status: "ready" });
    } catch (e) {
        // No subscription, so nothing is ever written over a log this run couldn't read.
        usePersistence.setState({ status: "failed", error: message(e) });
    }
};

let loading: Promise<void> | undefined;

/** Reads the log into the store, once. Rendering waits on `usePersistence` until it's done. */
export const loadStore = (from: Backend = platformBackend): Promise<void> => {
    backend = from;
    return (loading ??= load());
};

export const storageSize = (): Promise<number | undefined> => backend.size?.() ?? Promise.resolve(undefined);
