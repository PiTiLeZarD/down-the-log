import { useEffect, useEffectEvent, useRef } from "react";
import { Control, FieldValues, useWatch } from "react-hook-form";
import { QSO } from "../components/qso";

export type UseAutoSaveType<T extends FieldValues> = (control: Control<T, any>, save: (data: T) => void) => void;

// Long enough to collapse a typed word into one write, short enough that the operator never sees it.
const DEBOUNCE_MS = 300;

// useWatch hands back the form values straight away, so saving on every emission re-persisted the
// whole store each time a QSO was merely opened. The first values seen for a given id are the ones
// we just loaded (mount, or reset() after navigating to another QSO), never an edit: record the id
// and skip. Everything after that is the user typing.
//
// The save itself is debounced. It ends in a zustand set, which re-runs the persist middleware and
// its diff over every QSO in the log — correct, but not something to pay per character typed.
export const useAutoSave: UseAutoSaveType<QSO> = (control, save) => {
    const data = useWatch<QSO>({ control });
    const loadedId = useRef<string | undefined>(undefined);
    const pending = useRef<QSO | undefined>(undefined);
    const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

    const persist = useEffectEvent((values: QSO) => save(values));

    const flush = useEffectEvent(() => {
        if (timer.current) clearTimeout(timer.current);
        timer.current = undefined;
        const values = pending.current;
        pending.current = undefined;
        if (values) persist(values);
    });

    useEffect(() => {
        if (!data?.id) return;
        if (loadedId.current !== data.id) {
            loadedId.current = data.id;
            return;
        }
        // The values are held rather than the emission: navigating away mid-word leaves a write
        // still owed, and it is owed on the QSO that was being edited, not on whatever loaded next.
        pending.current = data as QSO;
        if (timer.current) clearTimeout(timer.current);
        timer.current = setTimeout(flush, DEBOUNCE_MS);
    }, [data]);

    // Closing the screen must not lose the last keystrokes the debounce is still holding.
    useEffect(() => () => flush(), []);
};
