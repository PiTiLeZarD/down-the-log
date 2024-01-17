import React, { useEffect } from "react";
import { useFormContext } from "react-hook-form";
import { Grid } from "../../utils/grid";
import { Modal } from "../../utils/modal";
import { QSO } from "../../utils/qso";
import { Stack } from "../../utils/stack";
import { Button } from "../../utils/theme/components/button";
import { Typography } from "../../utils/theme/components/typography";

export type SignalProps = {
    field: keyof QSO;
};

export type SignalComponent = React.FC<SignalProps>;

export const Signal: SignalComponent = ({ field }): JSX.Element => {
    const { watch, setValue } = useFormContext<QSO>();
    const signal = watch(field);

    useEffect(() => {
        if (signal == undefined) setValue(field, "59");
    }, []);

    const [readability, strength] = signal ? String(signal).split("") : [5, 9];
    const [open, setOpen] = React.useState<boolean>(false);
    return (
        <>
            <Button
                startIcon={field.includes("received") ? "arrow-down" : "arrow-up"}
                text={`${field.includes("received") ? "Rx" : "Tx"}: ${signal || "59"}`}
                variant="outlined"
                onPress={() => setOpen(true)}
            />
            <Modal open={open} onClose={() => setOpen(false)}>
                <Stack>
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
                    <Button text="Close" onPress={() => setOpen(false)} />
                </Stack>
            </Modal>
        </>
    );
};
