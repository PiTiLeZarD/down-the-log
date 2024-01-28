import debounce from "debounce";
import { DateTime } from "luxon";
import React, { useEffect, useMemo } from "react";
import { View } from "react-native";
import { createStyleSheet, useStyles } from "react-native-unistyles";
import cqzones from "../../data/cqzones.json";
import ituzones from "../../data/ituzones.json";
import { useStore } from "../../store";
import { findCountry, getCallsignData, parseCallsign } from "../../utils/callsign";
import { Grid } from "../../utils/grid";
import {
    HamQTHCallsignData,
    fetchCallsignData,
    fetchSessionId,
    isSessionValid,
    newSessionId,
} from "../../utils/hamqth";
import { maidenDistance, maidenhead2Latlong } from "../../utils/locator";
import { findZone } from "../../utils/polydec";
import { Stack } from "../../utils/stack";
import { Button } from "../../utils/theme/components/button";
import { Input } from "../../utils/theme/components/input";
import { Typography } from "../../utils/theme/components/typography";
import { useSettings } from "../../utils/use-settings";

const stylesheet = createStyleSheet((theme) => ({
    inputBox: {
        backgroundColor: theme.colours.primary[theme.shades.light],
        borderTopColor: theme.colours.primary[theme.shades.darker],
        borderTopWidth: theme.margins.sm,
        borderTopStyle: "solid",
        padding: theme.margins.md,
    },
    input: {
        backgroundColor: "white",
    },
}));

export type CallsignInputProps = {
    handleAdd: (hamqthCSData?: HamQTHCallsignData) => void;
    value: string;
    onChange: (callsign: string) => void;
};

export type CallsignInputComponent = React.FC<CallsignInputProps>;

export const CallsignInput: CallsignInputComponent = ({ value, handleAdd, onChange }): JSX.Element => {
    const { styles } = useStyles(stylesheet);
    const [hamqthCSData, setHamqthCSData] = React.useState<HamQTHCallsignData | undefined>(undefined);
    const callsignData = useMemo(() => (value ? getCallsignData(value) : undefined), [value]);
    const currentLocation = useStore((state) => state.currentLocation);
    const settings = useSettings();
    const updateSetting = useStore((state) => state.updateSetting);

    useEffect(() => {
        if (settings.hamqth?.user && settings.hamqth.password) {
            if (!isSessionValid(settings.hamqth)) {
                console.info("Fetching new hamqth session");
                fetchSessionId(settings.hamqth.user, settings.hamqth.password).then((sessionId) => {
                    if (sessionId) {
                        updateSetting("hamqth", newSessionId(settings.hamqth, sessionId));
                    }
                });
            }
        }
    }, []);

    useEffect(
        debounce(() => {
            const parsedCallsign = parseCallsign(value);
            if (value && (parsedCallsign?.delineation || "").length && isSessionValid(settings.hamqth)) {
                fetchCallsignData(settings.hamqth?.sessionId, value).then((data) => setHamqthCSData(data));
            } else {
                setHamqthCSData(undefined);
            }
        }, 500),
        [value],
    );
    const country = callsignData ? findCountry(callsignData) : null;

    return (
        <Stack style={styles.inputBox}>
            {callsignData && (
                <Grid container>
                    <Grid item xs={8} md={6} lg={8}>
                        <Stack>
                            {hamqthCSData && <Typography>{hamqthCSData.qth}</Typography>}
                            <Stack direction="row">
                                <Typography>{country?.flag}</Typography>
                                <Typography>{country?.name}</Typography>
                                {callsignData.state && <Typography>{callsignData.state}</Typography>}
                                <Typography>({callsignData.ctn})</Typography>
                            </Stack>
                            <Typography variant="subtitle">
                                {maidenDistance(
                                    currentLocation,
                                    hamqthCSData && hamqthCSData.grid ? hamqthCSData.grid : callsignData.gs,
                                    settings.imperial,
                                )}
                                {settings.imperial ? "mi" : "km"}
                            </Typography>
                        </Stack>
                    </Grid>
                    <Grid item xs={4} md={3} lg={3}>
                        {hamqthCSData && (
                            <Stack>
                                <Typography>{hamqthCSData.name}</Typography>
                                <Typography variant="subtitle">
                                    Local time:{" "}
                                    {DateTime.utc()
                                        .setZone(
                                            `UTC${
                                                hamqthCSData.utc_offset > 0
                                                    ? `+${hamqthCSData.utc_offset}`
                                                    : hamqthCSData.utc_offset
                                            }`,
                                        )
                                        .toFormat("HH:mm")}
                                </Typography>
                                {hamqthCSData.age && <Typography variant="subtitle">{hamqthCSData.age}yo</Typography>}
                            </Stack>
                        )}
                    </Grid>
                    <Grid item xs={-1} md={3} lg={1}>
                        <Stack>
                            <Typography variant="subtitle">
                                CQ: {callsignData.gs ? findZone(cqzones, maidenhead2Latlong(callsignData.gs)) : "??"}
                            </Typography>
                            <Typography variant="subtitle">
                                ITU: {callsignData.gs ? findZone(ituzones, maidenhead2Latlong(callsignData.gs)) : "??"}
                            </Typography>
                            <Typography variant="subtitle">DXCC: {callsignData.dxcc}</Typography>
                        </Stack>
                    </Grid>
                </Grid>
            )}
            <Stack direction="row" gap="xxl">
                <View style={{ flexGrow: 1 }}>
                    <Input
                        style={styles.input}
                        onChangeText={(text: string) => onChange(text.toUpperCase())}
                        onKeyPress={(e) => {
                            if ((e as any).keyCode === 13) handleAdd(hamqthCSData);
                        }}
                        value={value}
                        placeholder="Callsign"
                    />
                </View>
                <View>
                    <Button onPress={() => handleAdd(hamqthCSData)} startIcon="add" />
                </View>
            </Stack>
        </Stack>
    );
};
