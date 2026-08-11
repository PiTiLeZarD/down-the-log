import AsyncStorage from "@react-native-async-storage/async-storage";
import * as SecureStore from "expo-secure-store";
import { DateTime } from "luxon";
import React from "react";
import { Platform } from "react-native";
import { create } from "zustand";
import { combine, devtools, persist, PersistStorage } from "zustand/middleware";
// Types only, and deliberately spelled `import type`: a plain import of QsoFilter drags the whole
// component tree in behind it, and the store is imported by just about everything.
import type { QsoFilter } from "../components/filters";
import type { QSO } from "../components/qso";
import type { Band } from "../data/bands";
import type { Mode } from "../data/modes";
import type { HamQTHSettingsType } from "./hamqth";

// Only the operator's identity lives here. The rest of the station — rig, antenna, QTH, country —
// is per-QSO: there's rarely just one of each, so it's set on the QSO and carried over from there.
export type Settings = {
    myGridsquare?: string;
    myCallsign: string;
    showBeacons: boolean;
    showHeatmap: boolean;
    showSpots: boolean;
    showFilters: boolean;
    contestMode: boolean;
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
    contestMode: false,
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

export const fixSettings = (settings: Partial<Settings>): Settings =>
    ({
        ...settings,
        ...Object.fromEntries(Object.entries(defaultSettings).filter(([k, v]) => !(k in settings))),
    }) as Settings;

type DTLStoreProps = {
    qsos: QSO[];
    filters: QsoFilter[];
    settings: Settings;
    currentLocation: string;
};

type DTLStoreActionsProps = {
    log: (qso: QSO | QSO[]) => void;
    updateSetting: <T extends keyof Settings>(field: T, value: Settings[T]) => void;
    updateFilters: (filters: QsoFilter[]) => void;
    deleteLog: (qso: QSO) => void;
    resetStore: () => void;
    setCurrentLocation: (location: string) => void;
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
};

const StoreActions: DTLStoreActionsMutatorProps = (set) => ({
    // The bulk branch used to run `some()` over the incoming batch for every stored QSO, so an
    // import cost stored × imported comparisons — the shape that makes a big ADIF look hung.
    // A Set of the incoming ids answers the same question in one lookup.
    log: (qso) =>
        set((state) => {
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
});

export type UseStorePropsType = DTLStoreProps & DTLStoreActionsProps;

const reviveDate = (key: string, value: unknown) =>
    (key === "date" || key === "dateOff" || key === "sessionStart") && typeof value === "string"
        ? DateTime.fromISO(value, { setZone: true })
        : value;

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
            storage: secureStorage,
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
