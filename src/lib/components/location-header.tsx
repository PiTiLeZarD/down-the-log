import { usePathname, useRouter } from "expo-router";
import { View } from "react-native";
import { StyleSheet } from "react-native-unistyles";
import cqzones from "../data/cqzones.json";
import dxcc from "../data/dxcc.json";
import ituzones from "../data/ituzones.json";
import { maidenhead2Latlong } from "../utils/locator";
import { findZone } from "../utils/polydec";
import { useStore } from "../utils/store";
import { useWidthMatches } from "../ui/breakpoints";
import { Button } from "../ui/button";
import { Typography } from "../ui/typography";
import { useLocationError } from "../utils/use-location";
import { useSettings } from "../utils/use-settings";
import { Clocks } from "./clocks";
import { SolarData } from "./solar-data";
import { Stack } from "./stack";

const styles = StyleSheet.create((theme) => ({
    header: {
        backgroundColor: theme.colours.primary.light,
        padding: theme.margins.md,
        borderBottomWidth: theme.margins.sm,
        borderBottomColor: theme.colours.grey.darker,
    },
    callsign: {
        marginTop: 5,
        marginBottom: 5,
        fontWeight: "bold",
    },
}));

export const LocationHeader = () => {
    const { navigate } = useRouter();
    const currentLocation = useStore((state) => state.currentLocation);
    const settings = useSettings();
    // A denied or failed GPS fix used to leave "Looking for your location..." up for good. Say what
    // went wrong instead, and point at the setting that makes the app work without a fix at all.
    const locationError = useLocationError((state) => state.error);
    // A QSO form is already tall on a phone; the solar chips push the fields off the first screen.
    const hideSolar = usePathname().startsWith("/qso");

    return (
        <View style={styles.header}>
            <Stack direction="row">
                <Stack style={{ flexGrow: 1 }}>
                    <Stack direction="row">
                        <Typography>My gridsquare: </Typography>
                        <Typography variant="em">
                            {currentLocation || (locationError ? "unknown" : "Looking for your location...")}
                        </Typography>
                    </Stack>
                    {!currentLocation && locationError ? (
                        <Typography variant="subtitle">
                            {locationError}. Set a gridsquare in Settings to work without a fix.
                        </Typography>
                    ) : null}
                    {currentLocation ? (
                        <Typography variant="subtitle">
                            (CQ: {findZone(cqzones, maidenhead2Latlong(currentLocation))}, ITU:{" "}
                            {findZone(ituzones, maidenhead2Latlong(currentLocation))}, DXCC:{" "}
                            {findZone(dxcc, maidenhead2Latlong(currentLocation))})
                        </Typography>
                    ) : null}
                </Stack>
                <View style={{ flexGrow: 1 }}>
                    <Typography variant={useWidthMatches("md") ? "h1" : "h5"} style={styles.callsign}>
                        {settings.myCallsign}
                    </Typography>
                </View>
                <View style={useWidthMatches("md") ? {} : { display: "none" }}>
                    <Stack direction="row">
                        <SolarData />
                        <Clocks />
                    </Stack>
                </View>
                <View>
                    <Button onPress={() => navigate("/menu")} startIcon="menu" />
                </View>
            </Stack>
            <View style={useWidthMatches(undefined, "md") ? {} : { display: "none" }}>
                <Stack>
                    {!hideSolar && <SolarData />}
                    <Clocks />
                </Stack>
            </View>
        </View>
    );
};
