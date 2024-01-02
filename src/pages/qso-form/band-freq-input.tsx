import React from "react";
import { useFormContext } from "react-hook-form";
import { Modal } from "react-native";
import { useStyles } from "react-native-unistyles";
import { Band, band2freq, bands } from "../../data/bands";
import { Grid } from "../../utils/grid";
import { QSO } from "../../utils/qso";
import { Stack } from "../../utils/stack";
import { Button } from "../../utils/theme/components/button";
import { Input } from "../../utils/theme/components/input";
import { Typography } from "../../utils/theme/components/typography";

const freqValue = (freq?: number, band?: Band) => {
    if (freq != undefined) return freq * 1000;
    if (band != undefined) return (band2freq(band) || 14.144) * 1000;
    return 14144;
};

export type BandFreqInputProps = {};

export type BandFreqInputComponent = React.FC<BandFreqInputProps>;

export const BandFreqInput: BandFreqInputComponent = (): JSX.Element => {
    const { theme } = useStyles();
    const [open, setOpen] = React.useState<boolean>(false);
    const { watch, setValue } = useFormContext<QSO>();

    const frequency = watch("frequency");
    const band = watch("band");
    const [freqUserInput, setFreqUserInput] = React.useState<string>(String(freqValue(frequency, band)));

    React.useEffect(() => {
        setFreqUserInput(String(freqValue(frequency, band)));
    }, [frequency]);

    React.useEffect(() => {
        if (!Number.isNaN(+freqUserInput)) {
            setValue("frequency", +freqUserInput / 1000);
        }
    }, [freqUserInput]);
    return (
        <Stack>
            <Typography>Frequency:</Typography>
            <Button text={`${frequency} Mhz (${band})`} onPress={() => setOpen(true)} />
            <Modal animationType="none" visible={open} onRequestClose={() => setOpen(false)}>
                <Grid container>
                    <Grid item xs={4} />
                    <Grid item xs={4}>
                        <Stack gap="xxl">
                            <Grid container>
                                {Object.keys(bands).map((b) => (
                                    <Grid key={b} item xs={2}>
                                        <Button
                                            style={{ padding: theme.margins.md, margin: theme.margins.md }}
                                            text={b}
                                            variant={b == band ? "contained" : "outlined"}
                                            onPress={() => {
                                                setValue("band", b as Band);
                                                setValue("frequency", band2freq(b as Band) || 14.144);
                                            }}
                                        />
                                    </Grid>
                                ))}
                            </Grid>
                            <Typography variant="em">Frequency (in khz):</Typography>
                            <Input
                                numeric
                                style={{ textAlign: "center", fontSize: 30 }}
                                value={freqUserInput}
                                onChangeText={(nfreq) => setFreqUserInput(nfreq)}
                            />
                            <Button text="Close" onPress={() => setOpen(false)} />
                        </Stack>
                    </Grid>
                    <Grid item xs={4} />
                </Grid>
            </Modal>
        </Stack>
    );
};
