import asyncstorage from '@react-native-async-storage/async-storage';
import { DateTime } from 'luxon';
import { create } from 'zustand';
import { combine, createJSONStorage, devtools, persist } from 'zustand/middleware';

export type QSO = {
    id: string;
    date: DateTime;
    callsign: string;
    name?: string;
    frequency?: number;
    mode?: 'SSB' | 'FM' | 'AM' | 'CW';
    power?: number;
    qth?: string;
    locator?: string;
    note?: string;
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
    log: (qso) => set((state) => ({ qsos: [...state.qsos.filter((q) => q.id != qso.id), qso] })),
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
            deserialize: (s: string) => {
                const storage: { state: UseStorePropsType; version: number } = JSON.parse(s);

                storage.state.qsos = storage.state.qsos.map((q: QSO) => {
                    q.date = DateTime.fromISO(q.date as unknown as string);
                    return q;
                });

                return storage;
            },
        })
    )
);
