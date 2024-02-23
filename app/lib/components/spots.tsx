import React, { useEffect } from "react";
import { View } from "react-native";
import { createStyleSheet, useStyles } from "react-native-unistyles";
import { Spot, updateAllSpots } from "../utils/spots";
import { useStore } from "../utils/store";
import { Button } from "../utils/theme/components/button";
import { Typography } from "../utils/theme/components/typography";
import { useSettings } from "../utils/use-settings";
import { QrzChip } from "./qrz-chip";
import { Stack } from "./stack";

const stylesheet = createStyleSheet((theme) => ({
    container: {
        backgroundColor: theme.colours.primary[theme.shades.light],
        padding: theme.margins.md,
        borderTopColor: theme.colours.primary[theme.shades.darker],
        borderTopWidth: theme.margins.sm,
        borderTopStyle: "solid",
        maxWidth: "100%",
        overflow: "hidden",
    },
}));

export type SpotsProps = {};

export type SpotsComponent = React.FC<SpotsProps>;

export const Spots: SpotsComponent = (): JSX.Element => {
    const { styles } = useStyles(stylesheet);
    const [spotSelected, setSpotSelected] = React.useState<Spot | undefined>();
    const settings = useSettings();
    const updateSpots = useStore((state) => state.updateSpots);
    const spots = useStore((state) => state.spots);
    useEffect(() => {
        updateAllSpots(settings, updateSpots);
    }, []);

    return (
        <Stack direction="row" style={styles.container}>
            <Typography variant="em">Spots:</Typography>
            {!spotSelected &&
                spots
                    ?.filter((s) => s.honeypot?.spotIgnore !== "yes")
                    .map((spot) => (
                        <View>
                            <Button
                                text={`${spot.callsign}:${[spot.frequency, spot.mode, spot.continent].filter((e) => !!e).join("/")}`}
                                variant="chip"
                                colour="grey"
                                onPress={() => setSpotSelected(spot)}
                            />
                        </View>
                    ))}
            {spotSelected && (
                <>
                    <Stack direction="row" gap="xxl" style={{ flexGrow: 1 }}>
                        <Typography>{spotSelected.date?.toFormat("dd/MM/yyyy HH:mm")}</Typography>
                        <View>
                            <QrzChip callsign={spotSelected.callsign} textIsCallsign includeFlag />
                        </View>
                        {[
                            spotSelected.frequency,
                            spotSelected.band,
                            spotSelected.myCallsign ? (
                                <View>
                                    <QrzChip callsign={spotSelected.myCallsign} textIsCallsign includeFlag />
                                </View>
                            ) : undefined,
                        ]
                            .filter((e) => !!e)
                            .map((v) => (React.isValidElement(v) ? v : <Typography>{v}</Typography>))}
                    </Stack>
                    <Stack direction="row">
                        <Button startIcon="close" onPress={() => setSpotSelected(undefined)} />
                        <Button
                            startIcon="remove"
                            onPress={() => {
                                spotSelected.honeypot = { ...(spotSelected.honeypot || {}), spotIgnore: "yes" };
                                updateSpots([spotSelected]);
                                setSpotSelected(undefined);
                            }}
                        />
                        <Button startIcon="add" />
                    </Stack>
                </>
            )}
        </Stack>
    );
};
