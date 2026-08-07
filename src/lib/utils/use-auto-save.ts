import { useEffect, useEffectEvent, useRef } from "react";
import { Control, FieldValues, useWatch } from "react-hook-form";
import { QSO } from "../components/qso";

export type UseAutoSaveType<T extends FieldValues> = (control: Control<T, any>, save: (data: T) => void) => void;

// useWatch hands back the form values straight away, so saving on every emission re-persisted the
// whole store each time a QSO was merely opened. The first values seen for a given id are the ones
// we just loaded (mount, or reset() after navigating to another QSO), never an edit: record the id
// and skip. Everything after that is the user typing.
export const useAutoSave: UseAutoSaveType<QSO> = (control, save) => {
    const data = useWatch<QSO>({ control });
    const loadedId = useRef<string | undefined>(undefined);

    const persist = useEffectEvent((values: QSO) => save(values));

    useEffect(() => {
        if (!data?.id) return;
        if (loadedId.current !== data.id) {
            loadedId.current = data.id;
            return;
        }
        persist(data as QSO);
    }, [data]);
};
