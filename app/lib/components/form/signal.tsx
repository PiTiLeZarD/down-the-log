import React, { useEffect, useEffectEvent, useRef } from "react";
import { useFormContext } from "react-hook-form";
import { isDigital } from "../../data/modes";
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

    const defaultValue = isDigital(mode) ? "-1" : "59";

    const applyDefault = useEffectEvent(() => setValue(field, defaultValue));
    const applyDefaultIfUnset = useEffectEvent(() => {
        if (signal == undefined) applyDefault();
    });

    useEffect(() => applyDefaultIfUnset(), []);

    // Switching mode swaps the report scale, so the default follows. The mount run is skipped, or
    // opening an existing QSO would overwrite the report it was logged with.
    const previousMode = useRef(mode);
    useEffect(() => {
        if (previousMode.current === mode) return;
        previousMode.current = mode;
        applyDefault();
    }, [mode]);

    const [readability, strength] = signal && !isDigital(mode) ? String(signal).split("") : [5, 9];
    return (
        <>
            <Button
                startIcon={field.includes("received") ? "arrow-down" : "arrow-up"}
                text={`${field.includes("received") ? "Rx" : "Tx"}: ${signal || defaultValue}${
                    isDigital(mode) ? "dB" : ""
                }`}
                variant="outlined"
                onPress={() => setOpen(true)}
            />
            <Modal open={open} onClose={() => setOpen(false)}>
                <Stack>
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
