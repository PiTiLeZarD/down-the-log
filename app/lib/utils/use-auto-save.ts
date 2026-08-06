import { useEffect, useEffectEvent } from "react";
import { Control, FieldValues, useWatch } from "react-hook-form";
import { QSO } from "../components/qso";

export type UseAutoSaveType<T extends FieldValues> = (control: Control<T, any>, save: (data: T) => void) => void;

export const useAutoSave: UseAutoSaveType<QSO> = (control, save) => {
    const data = useWatch<QSO>({ control });

    const persist = useEffectEvent((values: QSO) => save(values));

    useEffect(() => {
        if (data) persist(data as QSO);
    }, [data]);
};
