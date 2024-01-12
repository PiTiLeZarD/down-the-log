import debounce from "debounce";
import { DateTime } from "luxon";
import React, { useEffect, useMemo } from "react";
import { View } from "react-native";
import { createStyleSheet, useStyles } from "react-native-unistyles";
import cqzones from "../../data/cqzones.json";
import ituzones from "../../data/ituzones.json";
import { useStore } from "../../store";
import { findCountry, getCallsignData } from "../../utils/callsign";
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
    handleAdd: () => void;
    value: string;
    onChange: (callsign: string) => void;
};

export type CallsignInputComponent = React.FC<CallsignInputProps>;

export const CallsignInput: CallsignInputComponent = ({ value, handleAdd, onChange }): JSX.Element => {
    const { styles } = useStyles(stylesheet);
    const [hamqthCSData, setHamqthCSData] = React.useState<HamQTHCallsignData | null>(null);
    const callsignData = useMemo(() => (value ? getCallsignData(value) : undefined), [value]);
    const currentLocation = useStore((state) => state.currentLocation);
    const settings = useStore((state) => state.settings);
    const updateSetting = useStore((state) => state.updateSetting);

    useEffect(() => {
        if (settings.hamqth?.user && settings.hamqth.password) {
            if (!isSessionValid(settings.hamqth)) {
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
            if (value && isSessionValid(settings.hamqth)) {
                fetchCallsignData(settings.hamqth?.sessionId, value).then((data) => {
                    if (data) setHamqthCSData(data);
                });
            }
        }, 250),
        [value],
    );

    const country = callsignData ? findCountry(callsignData) : null;

    return (
        <Stack style={styles.inputBox}>
            {callsignData && (
                <Grid container>
                    <Grid item xs={4}>
                        <Typography>
                            {country?.flag}
                            {country?.name} {callsignData.state ? `(${callsignData.state})` : ""}
                        </Typography>
                    </Grid>
                    <Grid item xs={3}>
                        <Typography>
                            {maidenDistance(
                                currentLocation,
                                hamqthCSData ? hamqthCSData.grid : callsignData.gs,
                                settings.imperial,
                            )}
                            {settings.imperial ? "mi" : "km"}
                        </Typography>
                    </Grid>
                    <Grid item xs={5} md={3}>
                        <Typography>
                            CQ: {callsignData.gs ? findZone(cqzones, maidenhead2Latlong(callsignData.gs)) : "??"}, ITU:{" "}
                            {callsignData.gs ? findZone(ituzones, maidenhead2Latlong(callsignData.gs)) : "??"}, DXCC:{" "}
                            {callsignData.dxcc}
                        </Typography>
                    </Grid>
                    <Grid item xs={-1} md={1}>
                        <Typography>({callsignData.ctn})</Typography>
                    </Grid>
                </Grid>
            )}
            {hamqthCSData && (
                <Grid container>
                    <Grid item xs={3}>
                        <Typography>{hamqthCSData.name}</Typography>
                    </Grid>
                    <Grid item xs={3}>
                        <Typography>QTH: {hamqthCSData.qth}</Typography>
                    </Grid>
                    <Grid item xs={3}>
                        <Typography>{hamqthCSData.age}yo</Typography>
                    </Grid>
                    <Grid item xs={3}>
                        <Typography>
                            Local time: {DateTime.utc().setZone(`UTC${hamqthCSData.utc_offset}`).toFormat("HH:mm")}
                        </Typography>
                    </Grid>
                </Grid>
            )}
            <Stack direction="row" gap="xxl">
                <View style={{ flexGrow: 1 }}>
                    <Input
                        style={styles.input}
                        onChangeText={(text: string) => onChange(text.toUpperCase())}
                        onKeyPress={(e) => {
                            if ((e as any).keyCode === 13) handleAdd();
                        }}
                        value={value}
                        placeholder="Callsign"
                    />
                </View>
                <View>
                    <Button onPress={() => handleAdd()} startIcon="add" />
                </View>
            </Stack>
        </Stack>
    );
};
