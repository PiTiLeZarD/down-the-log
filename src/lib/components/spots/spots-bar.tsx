import { useRouter } from "expo-router";
import React from "react";
import { ScrollView, View } from "react-native";
import { StyleSheet } from "react-native-unistyles";
import { applySpotFilter, useSpots } from "../../utils/spots";
import { useStore } from "../../utils/store";
import { useQsos } from "../qso";
import { useSettings } from "../../utils/use-settings";
import { useWidthMatches } from "../../ui/breakpoints";
import { Button } from "../../ui/button";
import { Typography } from "../../ui/typography";
import { Stack } from "../stack";
import { programmeColours } from "./spot-row";

const MAX_CHIPS = 40;

const styles = StyleSheet.create((theme) => ({
    container: {
        backgroundColor: theme.background,
    },
    // The chips take whatever the label and the buttons leave, and scroll inside it.
    scroller: {
        flexGrow: 1,
        flexShrink: 1,
    },
}));

/**
 * The strip above the log: the same feed the spots page shows, filtered the same way, reduced to
 * what fits on one line. Anything that needs reading rather than glancing at — the park name, the
 * comment, who spotted it — is a tap away on the page rather than crammed in here.
 */
export const SpotsBar = () => {
    const updateSetting = useStore((state) => state.updateSetting);
    const settings = useSettings();
    const { spots, loading, fetchedAt } = useSpots();
    const qsos = useQsos();
    const smallScreen = useWidthMatches(undefined, "md");
    const { navigate } = useRouter();

    const visible = React.useMemo(
        () => applySpotFilter(spots, settings.spotFilter, settings.spotSources, qsos).slice(0, MAX_CHIPS),
        [spots, settings.spotFilter, settings.spotSources, qsos],
    );

    const status = !fetchedAt ? (loading ? "Fetching spots..." : "Spots unavailable") : "No spots match your filters";

    return (
        <Stack direction="row" gap="xxl" style={styles.container}>
            <View>
                <Button
                    variant="chip"
                    colour="primary"
                    text={smallScreen ? "Spots" : "Spots page"}
                    onPress={() => navigate("/spots")}
                />
            </View>
            {visible.length ? (
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.scroller}>
                    <Stack direction="row">
                        {visible.map((spot) => (
                            <Button
                                key={spot.id}
                                variant="chip"
                                colour={programmeColours[spot.programme]}
                                text={`${spot.callsign} ${spot.band || (spot.frequency ? `${spot.frequency}MHz` : "?")}`}
                                onPress={() => navigate("/spots")}
                            />
                        ))}
                    </Stack>
                </ScrollView>
            ) : (
                <Typography variant="subtitle" style={{ flexGrow: 1 }}>
                    {status}
                </Typography>
            )}
            <View>
                <Button startIcon="close" onPress={() => updateSetting("showSpots", false)} />
            </View>
        </Stack>
    );
};
