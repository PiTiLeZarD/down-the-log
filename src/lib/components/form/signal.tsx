import React, { useEffect, useEffectEvent } from "react";
import { useFormContext } from "react-hook-form";
import { defaultRst, isDigital } from "../../data/modes";
import { Modal } from "../../utils/modal";
import { Button } from "../../ui/button";
import { Input } from "../../ui/input";
import { Typography } from "../../ui/typography";
import { Grid } from "../grid";
import { QSO } from "../qso";
import { Stack } from "../stack";

export type SignalProps = {
    field: keyof QSO;
};

export const Signal = ({ field }: SignalProps) => {
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
    return (
        <>
            {/* Only the arrow says which way the report goes: the buttons sit in a third of the
                frequency row now, and "Rx: "/"Tx: " left no room for the report itself. The modal
                spells the direction out. */}
            <Button
                startIcon={received ? "arrow-down" : "arrow-up"}
                text={`${signal || defaultValue}${isDigital(mode) ? "dB" : ""}`}
                // No `numberOfLines` here: in a sixth of a row the clamp clipped "59" down to "5"
                // rather than shrinking it. The report never wraps — there is nothing to break on.
                textStyle={{ flexShrink: 0 }}
                variant="outlined"
                onPress={() => setOpen(true)}
            />
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
