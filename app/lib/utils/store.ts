import AsyncStorage from "@react-native-async-storage/async-storage";
import * as SecureStore from "expo-secure-store";
import { DateTime } from "luxon";
import { Platform } from "react-native";
import { create } from "zustand";
import { combine, devtools, persist, PersistStorage } from "zustand/middleware";
import { QsoFilter } from "../components/filters";
import { QSO } from "../components/qso";
import { Band } from "../data/bands";
import { Mode } from "../data/modes";
import { HamQTHSettingsType } from "./hamqth";

export type Settings = {
    myGridsquare?: string;
    myCallsign: string;
    showBeacons: boolean;
    showFilters: boolean;
    contestMode: boolean;
    imperial: boolean;
    timeoffThreshold: number;
    datemonth: boolean;
    hamqth?: HamQTHSettingsType;
    geocodeMapsCoKey?: string;
    favouriteModes: Mode[];
    favouriteBands: Band[];
    inputBarConfig: (keyof QSO)[];
    carryOver: (keyof QSO)[];
};

const defaultSettings: Settings = {
    myCallsign: "",
    showBeacons: false,
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
    log: (qso) =>
        set((state) =>
            Array.isArray(qso)
                ? { qsos: [...state.qsos.filter((q) => !qso.some((qq) => qq.id == q.id)), ...qso] }
                : { qsos: [...state.qsos.filter((q) => q.id != qso.id), qso] },
        ),
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
