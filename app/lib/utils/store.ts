import AsyncStorage from "@react-native-async-storage/async-storage";
import { DateTime } from "luxon";
import { create } from "zustand";
import { combine, createJSONStorage, devtools, persist } from "zustand/middleware";
import { QsoFilter } from "../components/filters";
import { GoogleCredentials } from "../components/google-static-map/map";
import { QSO } from "../components/qso";
import { Band } from "../data/bands";
import { Mode } from "../data/modes";
import { HamQTHSettingsType } from "./hamqth";
import { Spot } from "./spots";

export type Settings = {
    myGridsquare?: string;
    myCallsign: string;
    showBeacons: boolean;
    showFilters: boolean;
    showSpots: boolean;
    contestMode: boolean;
    imperial: boolean;
    timeoffThreshold: number;
    datemonth: boolean;
    hamqth?: HamQTHSettingsType;
    google?: GoogleCredentials;
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
    showSpots: false,
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
    spots?: Spot[];
    filters: QsoFilter[];
    settings: Settings;
    currentLocation: string;
};

type DTLStoreActionsProps = {
    log: (qso: QSO | QSO[]) => void;
    updateSpots: (spots: Spot[]) => void;
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
    updateSpots: (spots) =>
        set((state) => ({
            spots: [...(state.spots?.filter((s) => !spots.some((ss) => ss.callsign === s.callsign)) || []), ...spots],
        })),
    updateSetting: (field, value) => set((state) => ({ settings: { ...state.settings, [field]: value } })),
    updateFilters: (filters) => set((state) => ({ filters })),
    deleteLog: (qso) => set((state) => ({ qsos: [...state.qsos.filter((q) => q.id != qso.id)] })),
    resetStore: () => set(() => ({ qsos: [] })),
    setCurrentLocation: (location) => set(() => ({ currentLocation: location })),
});

export type UseStorePropsType = DTLStoreProps & DTLStoreActionsProps;

export const useStore = create<
    UseStorePropsType,
    [["zustand/devtools", never], ["zustand/persist", UseStorePropsType]]
>(
    devtools(
        persist(combine(InitialStore, StoreActions), {
            name: "dtl-storage",
            storage: createJSONStorage(() => AsyncStorage),
            deserialize: (s: string) => {
                const storage: { state: UseStorePropsType; version: number } = JSON.parse(s);

                storage.state.qsos = storage.state.qsos.map((q: QSO) => {
                    q.date = DateTime.fromISO(q.date as unknown as string, { setZone: true });
                    if (q.dateOff) q.dateOff = DateTime.fromISO(q.dateOff as unknown as string, { setZone: true });
                    return q;
                });

                if (storage.state.settings.hamqth?.sessionStart) {
                    storage.state.settings.hamqth!.sessionStart = DateTime.fromISO(
                        storage.state.settings.hamqth?.sessionStart as unknown as string,
                        { setZone: true },
                    );
                }

                return storage;
            },
        }),
    ),
);
