import React from "react";
import { useFormContext } from "react-hook-form";
import { useStyles } from "react-native-unistyles";
import { Band, band2freq, bands, freq2band } from "../../data/bands";
import { Mode } from "../../data/modes";
import { Modal } from "../../utils/modal";
import { Button } from "../../utils/theme/components/button";
import { Input } from "../../utils/theme/components/input";
import { Typography } from "../../utils/theme/components/typography";
import { useSettings } from "../../utils/use-settings";
import { Grid } from "../grid";
import { QSO } from "../qso";
import { Stack } from "../stack";

const freqValue = (freq?: number, band?: Band, mode?: Mode) => {
    if (freq != undefined) return freq * 1000;
    if (band != undefined) return (band2freq(band, mode) || 14.144) * 1000;
    return 14144;
};

export type BandFreqInputProps = {
    noLabel?: boolean;
};

export type BandFreqInputComponent = React.FC<BandFreqInputProps>;

export const BandFreqInput: BandFreqInputComponent = ({ noLabel = false }): JSX.Element => {
    const { theme } = useStyles();
    const [showAll, setShowAll] = React.useState<boolean>(false);
    const [open, setOpen] = React.useState<boolean>(false);
    const { watch, setValue, getValues } = useFormContext<QSO>();
    const { favouriteBands } = useSettings();

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
            {!noLabel && <Typography>Frequency:</Typography>}
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
                    <Button colour="success" text="OK" onPress={() => setOpen(false)} />
                </Stack>
            </Modal>
        </Stack>
    );
};
