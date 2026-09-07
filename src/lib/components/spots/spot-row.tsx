import { DateTime } from "luxon";
import React from "react";
import { Pressable, View } from "react-native";
import { StyleSheet } from "react-native-unistyles";
import { roundTo } from "../../utils/math";
import { EventType } from "../../utils/event-rules";
import { MergedSpot, SpotStatus, isQrt, spotBadges, spotSourceLabels } from "../../utils/spots";
import { useWidthMatches } from "../../ui/breakpoints";
import { ColourVariant } from "../../ui/theme";
import { Typography } from "../../ui/typography";
import { Stack } from "../stack";

// The same three colours the spots bar has always used, extended to the schemes ParksnPeaks carries
// that we don't model. Colour alone never carries the meaning — every badge is labelled too.
export const programmeColours: Record<EventType, ColourVariant> = {
    sota: "primary",
    wwff: "success",
    pota: "secondary",
    iota: "grey",
    sig: "grey",
};

const styles = StyleSheet.create((theme) => ({
    row: (odd: boolean, qrt: boolean) => ({
        flexDirection: "row",
        gap: theme.margins.lg,
        paddingTop: theme.margins.lg,
        paddingBottom: theme.margins.lg,
        paddingRight: theme.margins.lg,
        backgroundColor: theme.colours.grey[theme.rowShade(odd)],
        // A packed-up activation stays in the list — it says the frequency is free now — but reads
        // as spent rather than as something to chase.
        opacity: qrt ? 0.55 : 1,
    }),
    // The rail is the "where did this come from" cue that survives being glanced at: it takes the
    // colour of the programme the newest spot was for.
    rail: (colour: ColourVariant) => ({
        width: theme.margins.md,
        alignSelf: "stretch",
        backgroundColor: theme.colours[colour].main,
    }),
    time: {
        width: 58,
        alignItems: "flex-start",
    },
    body: {
        flexGrow: 1,
        flexShrink: 1,
    },
    right: {
        alignItems: "flex-end",
    },
    badge: (colour: ColourVariant) => ({
        backgroundColor: theme.colours[colour].light,
        borderRadius: theme.margins.xxl,
        paddingLeft: theme.margins.lg,
        paddingRight: theme.margins.lg,
        paddingTop: theme.margins.xs,
        paddingBottom: theme.margins.xs,
    }),
    badgeText: (colour: ColourVariant) => ({
        color: theme.colours[colour].darker,
        fontSize: theme.components.typography.fontSize - 5,
        fontWeight: "bold",
    }),
}));

export type SpotBadgeProps = { label: string; colour: ColourVariant };

export const SpotBadge = ({ label, colour }: SpotBadgeProps) => (
    <View style={styles.badge(colour)}>
        <Typography style={styles.badgeText(colour)}>{label}</Typography>
    </View>
);

export type SpotRowProps = {
    spot: MergedSpot;
    index: number;
    status: SpotStatus;
    distance?: number;
    imperial: boolean;
    onPress: (spot: MergedSpot) => void;
};

export const SpotRow = React.memo(({ spot, index, status, distance, imperial, onPress }: SpotRowProps) => {
    const smallScreen = useWidthMatches(undefined, "md");
    const badges = spotBadges(spot);
    const qrt = isQrt(spot);
    // Minutes rather than Luxon's prose: "12m" fits the column, "12 minutes ago" doesn't, and age is
    // the number being compared between rows.
    const age = Math.max(0, Math.round(DateTime.utc().diff(spot.date, "minutes").minutes));

    return (
        <Pressable
            style={styles.row(index % 2 === 1, qrt)}
            onPress={() => onPress(spot)}
            aria-label={`Log ${spot.callsign}`}
        >
            <View style={styles.rail(programmeColours[spot.programme])} />
            <Stack gap={0} style={styles.time}>
                <Typography variant="em">{spot.date.toFormat("HH:mm")}</Typography>
                <Typography variant="subtitle">{age < 60 ? `${age}m` : `${Math.round(age / 60)}h`}</Typography>
            </Stack>
            <Stack gap="sm" style={styles.body}>
                <Stack direction="row" gap="lg" style={{ flexWrap: "wrap" }}>
                    <Typography variant="h5" style={{ marginTop: 0, marginBottom: 0 }}>
                        {spot.callsign}
                    </Typography>
                    {badges.map((badge) => (
                        <SpotBadge
                            key={badge.label}
                            label={badge.label}
                            colour={programmeColours[badge.programme as EventType]}
                        />
                    ))}
                    {status.newReference && <SpotBadge label="NEW" colour="success" />}
                    {status.dupe && <SpotBadge label="DUPE" colour="danger" />}
                </Stack>
                {!!spot.reference && (
                    <Typography numberOfLines={1}>
                        {spot.reference}
                        {spot.referenceName ? ` · ${spot.referenceName}` : ""}
                    </Typography>
                )}
                {!!spot.comments && (
                    <Typography variant="subtitle" numberOfLines={2}>
                        {spot.comments}
                    </Typography>
                )}
                <Stack direction="row" gap="lg" style={{ flexWrap: "wrap" }}>
                    {!!spot.spotter && <Typography variant="subtitle">de {spot.spotter}</Typography>}
                    {/* Which networks carried it, once the row has merged more than one of them. */}
                    {spot.sources.length > 1 && (
                        <Typography variant="subtitle">
                            {[...new Set(spot.sources.map((source) => spotSourceLabels[source.source]))].join(" + ")}
                        </Typography>
                    )}
                    {status.workedBefore && !status.dupe && <Typography variant="subtitle">worked before</Typography>}
                </Stack>
            </Stack>
            <Stack gap="sm" style={styles.right}>
                <Typography variant="em">
                    {spot.frequency ? `${roundTo(spot.frequency, 4)}` : spot.band || "?"}
                </Typography>
                <Typography variant="subtitle">{[spot.band, spot.mode].filter(Boolean).join(" ")}</Typography>
                {!smallScreen && distance !== undefined && (
                    <Typography variant="subtitle">
                        {roundTo(distance, 0)}
                        {imperial ? "mi" : "km"}
                    </Typography>
                )}
            </Stack>
        </Pressable>
    );
});
