import React, { useEffect } from "react";
import { useFormContext } from "react-hook-form";
import { isDigital } from "../../data/modes";
import { Grid } from "../../utils/grid";
import { Modal } from "../../utils/modal";
import { QSO } from "../../utils/qso";
import { Stack } from "../../utils/stack";
import { Button } from "../../utils/theme/components/button";
import { Input } from "../../utils/theme/components/input";
import { Typography } from "../../utils/theme/components/typography";

export type SignalProps = {
    field: keyof QSO;
};

export type SignalComponent = React.FC<SignalProps>;

export const Signal: SignalComponent = ({ field }): JSX.Element => {
    const [open, setOpen] = React.useState<boolean>(false);
    const { watch, setValue } = useFormContext<QSO>();
    const signal = watch(field);
    const mode = watch("mode");

    const defaultValue = isDigital(mode) ? "-1" : "59";

    useEffect(() => {
        if (signal == undefined) setValue(field, defaultValue);
    }, []);

    useEffect(() => {
        setValue(field, defaultValue);
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
