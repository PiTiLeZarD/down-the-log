import asyncstorage from "@react-native-async-storage/async-storage";
import { DateTime } from "luxon";
import { create } from "zustand";
import { combine, createJSONStorage, devtools, persist } from "zustand/middleware";
import { GoogleCredentials } from "./utils/google-static-map/map";
import { HamQTHSettingsType } from "./utils/hamqth";
import { QSO } from "./utils/qso";

export type Settings = {
    myGridsquare?: string;
    myCallsign: string;
    showBeacons: boolean;
    showFilters: boolean;
    imperial: boolean;
    hamqth?: HamQTHSettingsType;
    google?: GoogleCredentials;
};

type DTLStoreProps = {
    qsos: QSO[];
    settings: Settings;
    currentLocation: string;
};

type DTLStoreActionsProps = {
    log: (qso: QSO) => void;
    updateSetting: <T extends keyof Settings>(field: T, value: Settings[T]) => void;
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
    settings: { myCallsign: "", showBeacons: false, imperial: false, showFilters: false },
    currentLocation: "",
};

const StoreActions: DTLStoreActionsMutatorProps = (set) => ({
    log: (qso) => set((state) => ({ qsos: [...state.qsos.filter((q) => q.id != qso.id), qso] })),
    updateSetting: (field, value) => set((state) => ({ settings: { ...state.settings, [field]: value } })),
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
            storage: createJSONStorage(() => asyncstorage),
            deserialize: (s: string) => {
                const storage: { state: UseStorePropsType; version: number } = JSON.parse(s);

                storage.state.qsos = storage.state.qsos.map((q: QSO) => {
                    q.date = DateTime.fromISO(q.date as unknown as string, { setZone: true });
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
