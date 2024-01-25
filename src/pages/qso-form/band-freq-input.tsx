import React from "react";
import { useFormContext } from "react-hook-form";
import { useStyles } from "react-native-unistyles";
import { Band, band2freq, bands, freq2band } from "../../data/bands";
import { Mode } from "../../data/modes";
import { useStore } from "../../store";
import { Grid } from "../../utils/grid";
import { Modal } from "../../utils/modal";
import { QSO } from "../../utils/qso";
import { Stack } from "../../utils/stack";
import { Button } from "../../utils/theme/components/button";
import { Input } from "../../utils/theme/components/input";
import { Typography } from "../../utils/theme/components/typography";

const freqValue = (freq?: number, band?: Band, mode?: Mode) => {
    if (freq != undefined) return freq * 1000;
    if (band != undefined) return (band2freq(band, mode) || 14.144) * 1000;
    return 14144;
};

export type BandFreqInputProps = {};

export type BandFreqInputComponent = React.FC<BandFreqInputProps>;

export const BandFreqInput: BandFreqInputComponent = (): JSX.Element => {
    const { theme } = useStyles();
    const [showAll, setShowAll] = React.useState<boolean>(false);
    const [open, setOpen] = React.useState<boolean>(false);
    const { watch, setValue, getValues } = useFormContext<QSO>();
    const { favouriteBands } = useStore((state) => state.settings);

    const frequency = watch("frequency");
    const band = watch("band");
    const { mode } = getValues();
    const [freqUserInput, setFreqUserInput] = React.useState<string>(String(freqValue(frequency, band, mode)));
    const bandUserInput = freq2band(+freqUserInput / 1000);

    const allBands =
        showAll || favouriteBands.length === 0
            ? Object.keys(bands)
            : Object.keys(bands).filter((b) => favouriteBands.includes(b as Band));

    React.useEffect(() => {
        setFreqUserInput(String(freqValue(frequency, band, mode)));
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
            <Button
                text={`${frequency ? (+frequency).toFixed(3) : "N/A"} Mhz (${band || "N/A"})`}
                onPress={() => setOpen(true)}
            />
            <Modal wide open={open} onClose={() => setOpen(false)}>
                <Stack gap="xxl">
                    {favouriteBands.length > 0 && (
                        <Button
                            text={showAll ? "Only favourite bands" : "Show all bands"}
                            onPress={() => setShowAll(!showAll)}
                        />
                    )}
                    <Grid container>
                        {allBands.map((b) => (
                            <Grid key={b} item xs={2}>
                                <Button
                                    style={{ padding: theme.margins.sm, margin: theme.margins.sm }}
                                    textStyle={{ fontSize: 18 }}
                                    text={b}
                                    variant={b == band ? "contained" : "outlined"}
                                    onPress={() => {
                                        setValue("band", b as Band);
                                        setValue("frequency", band2freq(b as Band, mode) || 14.144);
                                    }}
                                />
                            </Grid>
                        ))}
                    </Grid>
                    <Typography>Frequency: </Typography>
                    <Input
                        numeric
                        style={[
                            { textAlign: "center", fontSize: 30 },
                            !bandUserInput ? { backgroundColor: theme.colours.secondary[theme.shades.main] } : {},
                        ]}
                        textStyle={{ fontSize: 20, lineHeight: 30 }}
                        value={freqUserInput}
                        suffix="kHz"
                        onChangeText={(nfreq) => setFreqUserInput(nfreq)}
                    />
                    <Button text="Close" onPress={() => setOpen(false)} />
                </Stack>
            </Modal>
        </Stack>
    );
};
