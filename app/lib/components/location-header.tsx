import { useRouter } from "expo-router";
import { View } from "react-native";
import { StyleSheet } from "react-native-unistyles";
import cqzones from "../data/cqzones.json";
import dxcc from "../data/dxcc.json";
import ituzones from "../data/ituzones.json";
import { maidenhead2Latlong } from "../utils/locator";
import { findZone } from "../utils/polydec";
import { useStore } from "../utils/store";
import { useWidthMatches } from "../utils/theme/breakpoints";
import { Button } from "../utils/theme/components/button";
import { Typography } from "../utils/theme/components/typography";
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

    return (
        <View style={styles.header}>
            <Stack direction="row">
                <Stack style={{ flexGrow: 1 }}>
                    <Stack direction="row">
                        <Typography>My gridsquare: </Typography>
                        <Typography variant="em">
                            {currentLocation ? currentLocation : "Looking for your location..."}
                        </Typography>
                    </Stack>
                    {currentLocation && (
                        <Typography variant="subtitle">
                            (CQ: {findZone(cqzones, maidenhead2Latlong(currentLocation))}, ITU:{" "}
                            {findZone(ituzones, maidenhead2Latlong(currentLocation))}, DXCC:{" "}
                            {findZone(dxcc, maidenhead2Latlong(currentLocation))})
                        </Typography>
                    )}
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
                    <SolarData />
                    <Clocks />
                </Stack>
            </View>
        </View>
    );
};
