import AsyncStorage from "@react-native-async-storage/async-storage";
import * as SecureStore from "expo-secure-store";
import { DateTime } from "luxon";
import React from "react";
import { Platform } from "react-native";
import { create } from "zustand";
import { combine, devtools, persist, PersistStorage, StorageValue } from "zustand/middleware";
import { IdbOp, META_STORE, QSO_STORE, idbAvailable, idbBatch, idbGet, idbValues, requestPersistence } from "./idb";
// Types only, and deliberately spelled `import type`: a plain import of QsoFilter drags the whole
// component tree in behind it, and the store is imported by just about everything.
import type { QsoFilter } from "../components/filters";
import type { QSO } from "../components/qso";
import type { Band } from "../data/bands";
import type { Mode } from "../data/modes";
import type { HamQTHSettingsType } from "./hamqth";
import type { Session } from "./session";
import type { TotaView } from "./tota";

// Only the operator's identity lives here. The rest of the station — rig, antenna, QTH, country —
// is per-QSO: there's rarely just one of each, so it's set on the QSO and carried over from there.
export type Settings = {
    myGridsquare?: string;
    myCallsign: string;
    showBeacons: boolean;
    showHeatmap: boolean;
    showSpots: boolean;
    showFilters: boolean;
    // Events list/map choice. It lives here rather than in the page's state so the view survives
    // navigating away; the toggle itself is only rendered on the Events page.
    eventsMap: boolean;
    // Same idea for the Tiles on the Air page, whose second view is the progress poster.
    totaView: TotaView;
    // The day the operator registered with tilesontheair.com, yyyyMMdd. Nothing in a log says it,
    // and their uploader refuses an activation more than 30 days older than it, so the Tiles page
    // asks for it once and hides what the site would never take. See utils/tota.
    totaRegistered?: string;
    imperial: boolean;
    timeoffThreshold: number;
    datemonth: boolean;
    hamqth?: HamQTHSettingsType;
    geocodeMapsCoKey?: string;
    spotsProxy?: string;
    favouriteModes: Mode[];
    favouriteBands: Band[];
    inputBarConfig: (keyof QSO)[];
    carryOver: (keyof QSO)[];
};

const defaultSettings: Settings = {
    myCallsign: "",
    showBeacons: false,
    showHeatmap: false,
    showSpots: false,
    imperial: false,
    datemonth: false,
    timeoffThreshold: 10,
    showFilters: false,
    eventsMap: false,
    totaView: "list",
    favouriteBands: [],
    favouriteModes: [],
    inputBarConfig: [],
    carryOver: [
        "frequency",
        "band",
        "mode",
        "power",
        "myCountry",
        "myState",
        "myQth",
        "myPota",
        "myWwff",
        "mySota",
        "myIota",
        "mySig",
        "mySigInfo",
        "myRig",
        "myAntenna",
    ],
};

// Settings that no longer exist, dropped on the way out of storage. `contestMode` became a session:
// it only ever drove two bits of UI, so there is nothing to migrate — the operator starts a contest
// session instead. See utils/session.
// `totaMap` was the Tiles page's list/map boolean. The poster replaced that map — it says which
// tiles are covered, which is what the map was being read for — and the list is still the default,
// so a stored `false` needs nothing carried over and a stored `true` has nowhere to go.
const legacySettings = ["contestMode", "totaMap"];

export const fixSettings = (settings: Partial<Settings>): Settings =>
    ({
        ...Object.fromEntries(Object.entries(settings).filter(([k]) => !legacySettings.includes(k))),
        ...Object.fromEntries(Object.entries(defaultSettings).filter(([k, v]) => !(k in settings))),
    }) as Settings;

type DTLStoreProps = {
    qsos: QSO[];
    filters: QsoFilter[];
    settings: Settings;
    currentLocation: string;
    // Every session ever run, newest last. The active one is the one `activeSessionId` points at and
    // it's held by id rather than by value so ending it is a one-field write.
    sessions: Session[];
    activeSessionId?: string;
};

type DTLStoreActionsProps = {
    log: (qso: QSO | QSO[]) => void;
    updateSetting: <T extends keyof Settings>(field: T, value: Settings[T]) => void;
    updateFilters: (filters: QsoFilter[]) => void;
    deleteLog: (qso: QSO) => void;
    resetStore: () => void;
    setCurrentLocation: (location: string) => void;
    startSession: (session: Session) => void;
    updateSession: (id: string, patch: Partial<Session>) => void;
    endSession: (id: string) => void;
    deleteSession: (id: string) => void;
    bumpSerial: (id: string) => void;
    adoptSessions: (sessions: Session[], qsos: QSO[]) => void;
};

type DTLStoreActionsMutatorProps = (
    set: (stateMutator: (state: DTLStoreProps) => Partial<DTLStoreProps>) => void,
    get: () => DTLStoreProps,
) => DTLStoreActionsProps;

const InitialStore: DTLStoreProps = {
    qsos: [],
    filters: [],
    settings: defaultSettings,
    currentLocation: "",
    sessions: [],
};

const StoreActions: DTLStoreActionsMutatorProps = (set) => ({
    // The bulk branch used to run `some()` over the incoming batch for every stored QSO, so an
    // import cost stored × imported comparisons — the shape that makes a big ADIF look hung.
    // A Set of the incoming ids answers the same question in one lookup.
    log: (qso) =>
        set((state) => {
            if (!Array.isArray(qso)) console.log("[DTL-DEBUG] store.log", qso.id, "mode=", qso.mode);
            if (!Array.isArray(qso)) return { qsos: [...state.qsos.filter((q) => q.id != qso.id), qso] };
            const incoming = new Set(qso.map((q) => q.id));
            return { qsos: [...state.qsos.filter((q) => !incoming.has(q.id)), ...qso] };
        }),
    updateSetting: (field, value) => set((state) => ({ settings: { ...state.settings, [field]: value } })),
    updateFilters: (filters) =>
        set((state) => ({
            filters,
            settings: { ...state.settings, showFilters: filters.length ? true : state.settings.showFilters },
        })),
    deleteLog: (qso) => set((state) => ({ qsos: [...state.qsos.filter((q) => q.id != qso.id)] })),
    resetStore: () => set(() => ({ qsos: [] })),
    setCurrentLocation: (location) => set(() => ({ currentLocation: location })),
    // Starting a session ends whatever was running: two at once would leave it ambiguous which one
    // owns the next QSO.
    startSession: (session) =>
        set((state) => ({
            sessions: [
                ...state.sessions.map((s) =>
                    s.id === state.activeSessionId && !s.endedAt ? { ...s, endedAt: DateTime.utc() } : s,
                ),
                session,
            ],
            activeSessionId: session.id,
        })),
    updateSession: (id, patch) =>
        set((state) => ({ sessions: state.sessions.map((s) => (s.id === id ? { ...s, ...patch } : s)) })),
    endSession: (id) =>
        set((state) => ({
            sessions: state.sessions.map((s) => (s.id === id ? { ...s, endedAt: DateTime.utc() } : s)),
            activeSessionId: state.activeSessionId === id ? undefined : state.activeSessionId,
        })),
    // The QSOs it logged keep their sessionId and stay in the log: deleting a session forgets the
    // outing's settings, not the contacts.
    deleteSession: (id) =>
        set((state) => ({
            sessions: state.sessions.filter((s) => s.id !== id),
            activeSessionId: state.activeSessionId === id ? undefined : state.activeSessionId,
        })),
    bumpSerial: (id) =>
        set((state) => ({
            sessions: state.sessions.map((s) =>
                s.id === id && s.contest ? { ...s, contest: { ...s.contest, serial: s.contest.serial + 1 } } : s,
            ),
        })),
    // Sessions worked out from QSOs already in the log, stored alongside the QSOs they now own. One
    // write for both halves: a session pointing at QSOs that never got their `sessionId` would show
    // up empty everywhere. Nothing becomes active — these are outings that are already over.
    adoptSessions: (sessions, qsos) =>
        set((state) => {
            const adopted = new Set(qsos.map((q) => q.id));
            return {
                sessions: [...state.sessions, ...sessions],
                qsos: [...state.qsos.filter((q) => !adopted.has(q.id)), ...qsos],
            };
        }),
});

export type UseStorePropsType = DTLStoreProps & DTLStoreActionsProps;

const dateKeys = ["date", "dateOff", "sessionStart", "startedAt", "endedAt"];
const reviveDate = (key: string, value: unknown) =>
    dateKeys.includes(key) && typeof value === "string" ? DateTime.fromISO(value, { setZone: true }) : value;

// HamQTH password never touches AsyncStorage on native: it's spliced out before the blob is
// written and stashed in the platform Keychain/Keystore instead, then merged back in on read.
// Web has no equivalent secure store, so it falls back to the plain AsyncStorage blob there.
const HAMQTH_PASSWORD_KEY = "dtl-hamqth-password";

const secureStorage: PersistStorage<UseStorePropsType> = {
    getItem: async (name) => {
        const raw = await AsyncStorage.getItem(name);
        if (!raw) return null;
        const parsed = JSON.parse(raw, reviveDate) as { state: UseStorePropsType; version?: number };
        if (Platform.OS !== "web" && parsed.state?.settings?.hamqth) {
            const password = await SecureStore.getItemAsync(HAMQTH_PASSWORD_KEY);
            if (password) parsed.state.settings.hamqth.password = password;
        }
        return parsed;
    },
    setItem: async (name, value) => {
        let toStore = value;
        if (Platform.OS !== "web" && value.state.settings?.hamqth) {
            const { password, ...hamqthRest } = value.state.settings.hamqth;
            if (password) await SecureStore.setItemAsync(HAMQTH_PASSWORD_KEY, password);
            else await SecureStore.deleteItemAsync(HAMQTH_PASSWORD_KEY);
            toStore = {
                ...value,
                state: {
                    ...value.state,
                    settings: { ...value.state.settings, hamqth: hamqthRest as HamQTHSettingsType },
                },
            };
        }
        await AsyncStorage.setItem(name, JSON.stringify(toStore));
    },
    removeItem: async (name) => {
        await AsyncStorage.removeItem(name);
        if (Platform.OS !== "web") await SecureStore.deleteItemAsync(HAMQTH_PASSWORD_KEY);
    },
};

// IndexedDB keeps structured clones, so a QSO goes in as it is — no stringifying the log on every
// keystroke. The one thing that doesn't survive the trip is Luxon's DateTime: it is a class
// instance, and a structured clone would hand back a prototype-less bag of its internals. Those go
// in as ISO strings, the same shape the JSON path wrote, and come back through the same reviver.
const toStorable = (value: unknown): unknown => {
    if (DateTime.isDateTime(value)) return value.toISO();
    if (Array.isArray(value)) return value.map(toStorable);
    if (value && typeof value === "object")
        return Object.fromEntries(Object.entries(value).map(([key, entry]) => [key, toStorable(entry)]));
    return value;
};

const fromStorable = (value: unknown, key = ""): unknown => {
    if (Array.isArray(value)) return value.map((entry) => fromStorable(entry));
    if (value && typeof value === "object")
        return Object.fromEntries(Object.entries(value).map(([field, entry]) => [field, fromStorable(entry, field)]));
    return reviveDate(key, value);
};

// zustand hands the storage the live state, actions included. JSON dropped the functions on its own;
// structured clone throws a DataCloneError on them, so they come off explicitly.
const dataOnly = (state: UseStorePropsType): DTLStoreProps =>
    Object.fromEntries(Object.entries(state).filter(([, value]) => typeof value !== "function")) as DTLStoreProps;

// The QSOs as last written, by id. The actions keep the reference of every QSO they didn't touch, so
// identity is enough to tell what actually changed: logging one contact costs one small put instead
// of rewriting the whole log, which is the difference that makes a six-figure log usable.
let persistedQsos = new Map<string, QSO>();

const qsoOps = (qsos: QSO[]): IdbOp[] => {
    const next = new Map(qsos.map((qso) => [qso.id, qso]));
    const ops: IdbOp[] = qsos
        .filter((qso) => persistedQsos.get(qso.id) !== qso)
        .map((qso) => ({ store: QSO_STORE, key: qso.id, value: toStorable(qso) }));
    persistedQsos.forEach((_, id) => !next.has(id) && ops.push({ store: QSO_STORE, key: id }));
    persistedQsos = next;
    return ops;
};

const writeState = (name: string, value: StorageValue<UseStorePropsType>): Promise<boolean> => {
    const { qsos, ...rest } = dataOnly(value.state);
    const ops = qsoOps(qsos);
    ops.push({ store: META_STORE, key: name, value: { state: toStorable(rest), version: value.version } });
    return idbBatch(ops);
};

// Nothing in IndexedDB yet means either a first run or a log still sitting in the localStorage that
// AsyncStorage writes on web. It moves over whole, and the old copy is only dropped once the new one
// is safely written — until then it is the only copy there is.
const migrateFromLocalStorage = async (name: string): Promise<StorageValue<UseStorePropsType> | null> => {
    const raw = await AsyncStorage.getItem(name);
    if (!raw) return null;
    const parsed = JSON.parse(raw, reviveDate) as StorageValue<UseStorePropsType>;
    if (await writeState(name, parsed)) await AsyncStorage.removeItem(name);
    return parsed;
};

const indexedStorage: PersistStorage<UseStorePropsType> = {
    getItem: async (name) => {
        void requestPersistence();
        const meta = await idbGet<StorageValue<DTLStoreProps>>(META_STORE, name);
        if (!meta) return migrateFromLocalStorage(name);
        const qsos = (await idbValues<unknown>(QSO_STORE)).map((qso) => fromStorable(qso) as QSO);
        // Seeded here as well as on write: the objects just handed to the store are the ones it
        // holds, so the first save after a launch has nothing to re-write.
        persistedQsos = new Map(qsos.map((qso) => [qso.id, qso]));
        const state = { ...(fromStorable(meta.state) as DTLStoreProps), qsos };
        return { state, version: meta.version } as StorageValue<UseStorePropsType>;
    },
    setItem: async (name, value) => {
        await writeState(name, value);
    },
    removeItem: async (name) => {
        await idbBatch([...qsoOps([]), { store: META_STORE, key: name }]);
    },
};

// Native stays on AsyncStorage: it is SQLite-backed there, with no quota to escape and a Keychain to
// keep the HamQTH password out of the blob. Web moves to IndexedDB, minus the profiles that have
// none — and node under test — which fall back to the localStorage behind AsyncStorage.
const storage = Platform.OS === "web" && idbAvailable() ? indexedStorage : secureStorage;

export const useStore = create<
    UseStorePropsType,
    [["zustand/devtools", never], ["zustand/persist", UseStorePropsType]]
>(
    devtools(
        persist(combine(InitialStore, StoreActions), {
            name: "dtl-storage",
            // Settings coming back from storage are completed once, here. `useSettings` used to run
            // `fixSettings` on every render, which handed out a fresh object each time and stopped
            // anything downstream from memoising on it.
            merge: (persisted, current) => {
                const merged = { ...current, ...(persisted as Partial<UseStorePropsType>) };
                return { ...merged, settings: fixSettings(merged.settings || {}) };
            },
            storage,
        }),
    ),
);

// The store starts on its defaults and only fills in once AsyncStorage has answered. Anything that
// treats an empty setting as "never configured" — the first-run setup — has to wait for that,
// otherwise it fires at every launch before the real settings land.
export const useHydrated = (): boolean => {
    const [hydrated, setHydrated] = React.useState<boolean>(() => useStore.persist.hasHydrated());
    React.useEffect(() => useStore.persist.onFinishHydration(() => setHydrated(true)), []);
    return hydrated;
};
