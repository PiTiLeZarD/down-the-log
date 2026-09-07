import React from "react";
import { View } from "react-native";
import { StyleSheet } from "react-native-unistyles";
import { MergedSpot, spotDistance, spotStatus } from "../../utils/spots";
import { useSettings } from "../../utils/use-settings";
import { Typography } from "../../ui/typography";
import { QSO } from "../qso";
import { Stack } from "../stack";
import { SpotRow } from "./spot-row";

const styles = StyleSheet.create((theme) => ({
    list: {
        borderRadius: theme.margins.md,
        overflow: "hidden",
    },
    empty: {
        padding: theme.margins.xxl,
    },
}));

export type SpotListProps = {
    spots: MergedSpot[];
    qsos: QSO[];
    emptyMessage: string;
    onSpotPress: (spot: MergedSpot) => void;
};

export const SpotList = ({ spots, qsos, emptyMessage, onSpotPress }: SpotListProps) => {
    const settings = useSettings();

    if (!spots.length)
        return (
            <View style={styles.empty}>
                <Typography variant="subtitle">{emptyMessage}</Typography>
            </View>
        );

    return (
        <Stack gap={0} style={styles.list}>
            {spots.map((spot, index) => (
                <SpotRow
                    key={spot.id}
                    spot={spot}
                    index={index}
                    // Both read off indexes cached on the log array, so this is a lookup per row
                    // rather than a scan of the log.
                    status={spotStatus(spot, qsos)}
                    distance={spotDistance(spot, settings.myGridsquare, settings.imperial)}
                    imperial={settings.imperial}
                    onPress={onSpotPress}
                />
            ))}
        </Stack>
    );
};
