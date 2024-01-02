import React from "react";
import { useFormContext } from "react-hook-form";
import { Modal } from "react-native";
import { useStyles } from "react-native-unistyles";
import { Band, band2freq, bands, freq2band } from "../../data/bands";
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
    const bandUserInput = freq2band(+freqUserInput / 1000);

    React.useEffect(() => {
        setFreqUserInput(String(freqValue(frequency, band)));
    }, [frequency]);

    React.useEffect(() => {
        if (!Number.isNaN(+freqUserInput)) {
            setValue("frequency", +freqUserInput / 1000);
            if (bandUserInput !== null) setValue("band", bandUserInput);
        }
    }, [freqUserInput]);
    return (
        <Stack>
            <Typography>Frequency:</Typography>
            <Button text={`${frequency} Mhz (${band})`} onPress={() => setOpen(true)} />
            <Modal animationType="none" visible={open} onRequestClose={() => setOpen(false)}>
                <Grid container>
                    <Grid item xs={-1} md={1} lg={2} xl={3} xxl={4} />
                    <Grid item xs={12} md={10} lg={8} xl={6} xxl={4}>
                        <Stack gap="xxl">
                            <Grid container>
                                {Object.keys(bands).map((b) => (
                                    <Grid key={b} item xs={2}>
                                        <Button
                                            style={{ padding: theme.margins.md, margin: theme.margins.md }}
                                            textStyle={{ fontSize: 18 }}
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
                            <Input
                                numeric
                                style={[
                                    { textAlign: "center", fontSize: 30 },
                                    !bandUserInput
                                        ? { backgroundColor: theme.colours.secondary[theme.shades.main] }
                                        : {},
                                ]}
                                textStyle={{ fontSize: 20, lineHeight: 30 }}
                                value={freqUserInput}
                                prefix="Frequency:"
                                suffix="kHz"
                                onChangeText={(nfreq) => setFreqUserInput(nfreq)}
                            />
                            <Button text="Close" onPress={() => setOpen(false)} />
                        </Stack>
                    </Grid>
                    <Grid item xs={-1} md={1} lg={2} xl={3} xxl={4} />
                </Grid>
            </Modal>
        </Stack>
    );
};
