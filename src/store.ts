import asyncstorage from "@react-native-async-storage/async-storage";
import { DateTime } from "luxon";
import { create } from "zustand";
import { combine, createJSONStorage, devtools, persist } from "zustand/middleware";
import { QSO } from "./utils/qso";

type DTLStoreProps = {
    qsos: QSO[];
    currentLocation: string;
};

type DTLStoreActionsProps = {
    log: (qso: QSO) => void;
    deleteLog: (qso: QSO) => void;
    setCurrentLocation: (location: string) => void;
};

type DTLStoreActionsMutatorProps = (
    set: (stateMutator: (state: DTLStoreProps) => Partial<DTLStoreProps>) => void,
    get: () => DTLStoreProps
) => DTLStoreActionsProps;

const InitialStore: DTLStoreProps = {
    qsos: [],
    currentLocation: "",
};

const StoreActions: DTLStoreActionsMutatorProps = (set) => ({
    log: (qso) => set((state) => ({ qsos: [...state.qsos.filter((q) => q.id != qso.id), qso] })),
    deleteLog: (qso) => set((state) => ({ qsos: [...state.qsos.filter((q) => q.id != qso.id)] })),
    setCurrentLocation: (location) => set((state) => ({ currentLocation: location })),
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

                return storage;
            },
        })
    )
);
