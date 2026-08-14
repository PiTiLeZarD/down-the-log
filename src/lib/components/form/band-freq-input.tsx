import React from "react";
import { useFormContext } from "react-hook-form";
import { useUnistyles } from "react-native-unistyles";
import { freq2band } from "../../data/bands";
import { Input } from "../../ui/input";
import { Typography } from "../../ui/typography";
import { khz, mhz, tunableFrom } from "../../utils/frequency";
import { QSO } from "../qso";
import { Stack } from "../stack";

/**
 * Frequency is the field; band is a view of it.
 *
 * The operator tunes a radio, not a picker, so there is one box and it holds the frequency the radio
 * is on. The band shown in front of it is `freq2band` of whatever is typed — never something to set,
 * which is what used to make the two disagree: a band picker that rebuilt the frequency from the
 * middle of the band turned a session set up on 14020 back into 14175.
 */

// A number input has no selection API — assigning selectionStart to one throws — which is why the
// old attempt at this only ever worked on some platforms. The keyboard hint does the same job.
const selectTunable = (element: HTMLInputElement) => {
    if (typeof element?.setSelectionRange !== "function") return;
    element.setSelectionRange(tunableFrom(element.value), element.value.length);
};

export type BandFreqInputProps = {
    noLabel?: boolean;
};

export const BandFreqInput = ({ noLabel = false }: BandFreqInputProps) => {
    const { theme } = useUnistyles();
    const { watch, setValue } = useFormContext<QSO>();

    const frequency = watch("frequency");
    const [userInput, setUserInput] = React.useState<string>(khz(frequency));
    const band = freq2band(mhz(userInput));

    // The box mirrors the form's frequency, so it resyncs during render rather than from an effect —
    // an effect would show the previous frequency for a frame on every QSO change. Only when the two
    // actually differ as numbers: comparing the strings would fight the operator mid-type, wiping
    // the trailing "." out of "14210." as soon as the form rounded it away.
    const [renderedFor, setRenderedFor] = React.useState<number | undefined>(frequency);
    if (renderedFor !== frequency) {
        setRenderedFor(frequency);
        if (mhz(userInput) !== frequency) setUserInput(khz(frequency));
    }

    const handleChange = (input: string) => {
        setUserInput(input);
        // An empty or half-typed box is left alone rather than written as 0: the operator is still
        // typing, and a QSO logged in that moment keeps the frequency it already had.
        if (input === "" || Number.isNaN(+input)) return;

        const tuned = mhz(input);
        setValue("frequency", tuned);
        // The band goes onto the form with it, one way and derived — not a second field to set, but
        // the form is a QSO and everything reading it live wants the pair to agree. Without this the
        // QSO page kept flagging a 40m contact as outside 20m: the store had caught up on save and
        // the form it was reading hadn't. A frequency in no band leaves the old one standing, which
        // is what `qsoBand` does too, and is what the out-of-band flag is there to point at.
        const tunedBand = freq2band(tuned);
        if (tunedBand) setValue("band", tunedBand);
    };

    return (
        <Stack style={{ maxWidth: "100%" }}>
            {!noLabel && <Typography>Frequency:</Typography>}
            <Input
                aria-label="frequency"
                inputMode="decimal"
                // Not `numeric`: that renders a number input on the web, and a number input has no
                // selection to set, so the box can't offer the kHz digits up on focus.
                style={[!band ? { backgroundColor: theme.colours.secondary.main } : {}]}
                prefix={band || "?"}
                suffix="kHz"
                value={userInput}
                onChangeText={handleChange}
                onFocus={(ev) => {
                    const element = ev.target as unknown as HTMLInputElement;
                    selectTunable(element);
                    // A click focuses on mousedown and only sets the caret on mouseup, after this
                    // handler has run — selecting here alone worked from the keyboard and lost the
                    // selection to the click that asked for it.
                    if (typeof element?.addEventListener === "function")
                        element.addEventListener(
                            "mouseup",
                            (mouseUp) => {
                                mouseUp.preventDefault();
                                selectTunable(element);
                            },
                            { once: true },
                        );
                }}
            />
        </Stack>
    );
};
