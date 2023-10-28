import asyncstorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { combine, createJSONStorage, devtools, persist } from 'zustand/middleware';

type QSO = {
    id: string;
    callsign: string;
};

type DTLStoreProps = {
    qsos: QSO[];
};

type DTLStoreActionsProps = {
    log: (qso: QSO) => void;
};

type DTLStoreActionsMutatorProps = (
    set: (stateMutator: (state: DTLStoreProps) => DTLStoreProps) => void,
    get: () => DTLStoreProps
) => DTLStoreActionsProps;

const InitialStore: DTLStoreProps = {
    qsos: [],
};

const StoreActions: DTLStoreActionsMutatorProps = (set) => ({
    log: (qso) => set((state) => ({ qsos: [...state.qsos, qso] })),
});

export type UseStorePropsType = DTLStoreProps & DTLStoreActionsProps;

export const useStore = create<
    UseStorePropsType,
    [['zustand/devtools', never], ['zustand/persist', UseStorePropsType]]
>(
    devtools(
        persist(combine(InitialStore, StoreActions), {
            name: 'dtl-storage',
            storage: createJSONStorage(() => asyncstorage),
        })
    )
);
