import { useEffect, useEffectEvent, useRef } from "react";
import { useFormContext, useWatch } from "react-hook-form";
import { Mode, defaultRst } from "../../data/modes";
import { QSO } from "../qso";

const fields = ["rst_received", "rst_sent"] as const;

/**
 * Keeps both reports on the scale of the mode being worked: SSB and CW start on 59, the weak-signal
 * digital modes on -1. Lives on the form rather than in the `Signal` buttons because the reports are
 * only in the input bar if the operator put them there — with them hidden, retuning from FT8 to SSB
 * used to log a 59 QSO as -1.
 *
 * A report the operator set themselves is never touched: only a blank, or one still sitting on the
 * previous mode's default, follows the change.
 */
export const useRstDefaults = () => {
    const { getValues, setValue, control } = useFormContext<QSO>();
    const mode = useWatch({ control, name: "mode" });

    const previousMode = useRef<Mode | undefined>(mode);
    const follow = useEffectEvent((from: Mode | undefined, to: Mode | undefined) => {
        const stale = defaultRst(from);
        const fresh = defaultRst(to);
        fields.forEach((field) => {
            const value = getValues(field);
            if (!value || value === stale) setValue(field, fresh);
        });
    });

    useEffect(() => {
        if (previousMode.current === mode) return;
        const from = previousMode.current;
        previousMode.current = mode;
        follow(from, mode);
    }, [mode]);

    // A blank report has to be filled too: the `Signal` buttons used to do it on mount, and a
    // session that types its reports plainly doesn't render them.
    const fillBlanks = useEffectEvent(() => follow(mode, mode));
    useEffect(() => fillBlanks(), []);
};
