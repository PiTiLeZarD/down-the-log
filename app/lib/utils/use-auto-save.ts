import { useEffect } from "react";
import { Control, FieldValues, useWatch } from "react-hook-form";
import { QSO } from "../components/qso";

export type UseAutoSaveType<T extends FieldValues> = (control: Control<T, any>, save: (data: T) => void) => void;

export const useAutoSave: UseAutoSaveType<QSO> = (control, save) => {
    const data = useWatch<QSO>({ control });

    useEffect(() => {
        if (data) save(data as QSO);
    }, [data]);
};
