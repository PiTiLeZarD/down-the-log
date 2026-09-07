import React, { useEffect, useEffectEvent } from "react";
import { useFormContext } from "react-hook-form";
import { StyleSheet } from "react-native-unistyles";
import { defaultRst, isDigital } from "../../data/modes";
import { Modal } from "../../utils/modal";
import { Button } from "../../ui/button";
import { Input } from "../../ui/input";
import { Typography } from "../../ui/typography";
import { Grid } from "../grid";
import { QSO } from "../qso";
import { Stack } from "../stack";

const styles = StyleSheet.create((theme) => ({
    // A report is two or three characters in a sixth of a row. The default button padding is wider
    // than the label it wraps at that size, which is what pushed "-11" out through the border.
    compact: {
        paddingLeft: theme.margins.md,
        paddingRight: theme.margins.md,
    },
}));

export type SignalProps = {
    field: keyof QSO;
    // In the form the button sits under a label, so the direction is spelled out there and the
    // arrow comes off — the arrow alone is wider than the space left for a digital report. The
    // input bar has no room for a label and keeps the arrow instead.
    labelled?: boolean;
};

export const Signal = ({ field, labelled = false }: SignalProps) => {
    const [open, setOpen] = React.useState<boolean>(false);
    const { watch, setValue } = useFormContext<QSO>();
    const signal = watch(field);
    const mode = watch("mode");

    const defaultValue = defaultRst(mode);

    const applyDefault = useEffectEvent(() => setValue(field, defaultValue));
    const applyDefaultIfUnset = useEffectEvent(() => {
        if (signal == undefined) applyDefault();
    });

    useEffect(() => applyDefaultIfUnset(), []);

    // Following a mode change is the form's job now — see `useRstDefaults`. Doing it here only
    // worked while the reports were on screen, and on an already-logged QSO it rewrote the report
    // that was actually exchanged.

    const received = field.includes("received");
    const [readability, strength] = signal && !isDigital(mode) ? String(signal).split("") : [5, 9];
    const button = (
        <Button
            {...(labelled ? {} : { startIcon: received ? "arrow-down" : "arrow-up" })}
            // No unit on the label: "-11dB" does not fit the column, and a digital report is in dB
            // by definition. The mode is on the next row and the modal names the unit.
            text={String(signal || defaultValue)}
            // No `numberOfLines` here: in a sixth of a row the clamp clipped "59" down to "5"
            // rather than shrinking it. The report never wraps — there is nothing to break on.
            textStyle={{ flexShrink: 0 }}
            style={labelled ? styles.compact : undefined}
            variant="outlined"
            onPress={() => setOpen(true)}
        />
    );
    return (
        <>
            {labelled ? (
                <Stack>
                    <Typography>{received ? "Rx:" : "Tx:"}</Typography>
                    {button}
                </Stack>
            ) : (
                button
            )}
            <Modal open={open} onClose={() => setOpen(false)}>
                <Stack>
                    <Typography variant="h2" style={{ textAlign: "center" }}>
                        {received ? "Received" : "Sent"}
                    </Typography>
                    {!isDigital(mode) && (
                        <Grid container>
                            <Grid item xs={6}>
                                <Stack>
                                    <Typography style={{ textAlign: "center" }}>Readability</Typography>
                                    {new Array(5).fill(null).map((_, i) => (
                                        <Button
                                            key={i}
                                            text={i + 1}
                                            variant={readability == i + 1 ? "contained" : "outlined"}
                                            onPress={() => setValue(field, `${i + 1}${strength}`)}
                                        />
                                    ))}
                                </Stack>
                            </Grid>
                            <Grid item xs={6}>
                                <Stack>
                                    <Typography style={{ textAlign: "center" }}>Strength</Typography>
                                    {new Array(10).fill(null).map((_, i) => (
                                        <Button
                                            key={i}
                                            text={i}
                                            variant={strength == i ? "contained" : "outlined"}
                                            colour="secondary"
                                            onPress={() => {
                                                setValue(field, `${readability}${i}`);
                                                setOpen(false);
                                            }}
                                        />
                                    ))}
                                </Stack>
                            </Grid>
                        </Grid>
                    )}
                    {isDigital(mode) && (
                        <Input
                            suffix="dB"
                            value={String(signal)}
                            onKeyPress={(e) => {
                                if ((e as any).keyCode === 13) setOpen(false);
                            }}
                            onChangeText={(newValue) => setValue(field, newValue)}
                        />
                    )}
                    <Button colour="success" text="OK" onPress={() => setOpen(false)} />
                </Stack>
            </Modal>
        </>
    );
};
