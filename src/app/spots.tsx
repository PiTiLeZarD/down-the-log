import { useRouter } from "expo-router";
import { DateTime } from "luxon";
import React from "react";
import { View } from "react-native";
import { useUnistyles } from "react-native-unistyles";
import { PageLayout } from "../lib/components/page-layout";
import { QSO, extrapolate, useQsos } from "../lib/components/qso";
import { SpotFilters, SpotList, SpotMeButton, SpotModal, SpotSettings } from "../lib/components/spots";
import { Stack } from "../lib/components/stack";
import { Button } from "../lib/ui/button";
import { Typography } from "../lib/ui/typography";
import {
    MergedSpot,
    activeFilterCount,
    applySpotFilter,
    defaultSpotFilter,
    qsoFromSpot,
    refreshSpots,
    spotSourceLabels,
    spotStation,
    useSpots,
} from "../lib/utils/spots";
import { useWidthMatches } from "../lib/ui/breakpoints";
import { useStore } from "../lib/utils/store";
import { useActiveSession } from "../lib/utils/use-session";
import { useSettings } from "../lib/utils/use-settings";

const Spots = () => {
    const { theme } = useUnistyles();
    const settings = useSettings();
    const updateSetting = useStore((state) => state.updateSetting);
    const log = useStore((state) => state.log);
    const bumpSerial = useStore((state) => state.bumpSerial);
    const currentLocation = useStore((state) => state.currentLocation);
    const session = useActiveSession();
    const qsos = useQsos();
    const { spots, bySource, loading, fetchedAt } = useSpots();
    const { navigate } = useRouter();

    const [showFilters, setShowFilters] = React.useState<boolean>(false);
    // Setup takes the page over rather than sitting above the list: it is long enough that the spots
    // below it were unreachable anyway, and a screen of settings on top of a live feed read as one
    // page doing two things at once.
    const [setup, setSetup] = React.useState<boolean>(false);
    // The station whose megaphone was tapped, shaped as a QSO for the modal. Nothing is logged by it.
    const [respotting, setRespotting] = React.useState<QSO | undefined>(undefined);
    // Five labelled buttons don't fit a phone, and the icons carry the meaning on their own. The
    // filter count stays: it's the one of them whose label is information rather than a name.
    const compact = useWidthMatches(undefined, "md");

    const visible = React.useMemo(
        () => applySpotFilter(spots, settings.spotFilter, settings.spotSources, qsos),
        [spots, settings.spotFilter, settings.spotSources, qsos],
    );
    const filterCount = activeFilterCount(settings.spotFilter);

    // Both handlers are memoised: SpotRow is memoised on its props, and a callback rebuilt on every
    // render would repaint every row of the list whenever anything on this page changed.
    const handleSpotPress = React.useCallback(
        (spot: MergedSpot) => {
            const seeded = qsoFromSpot(spot, { settings, currentLocation, session, previous: qsos[0] });
            const qso: QSO = extrapolate(seeded, qsos, settings.carryOver, session);
            qso.date = DateTime.utc();
            if (session?.contest) {
                qso.stx = session.contest.serial;
                bumpSerial(session.id);
            }
            log(qso);
            navigate(`/qso?qsoId=${qso.id}`);
        },
        [settings, currentLocation, session, qsos, log, bumpSerial, navigate],
    );

    const handleRespotPress = React.useCallback((spot: MergedSpot) => setRespotting(spotStation(spot)), []);

    // One line per network so a dead source is visible as itself rather than as spots quietly going
    // missing from the list.
    const sourceStatus = settings.spotSources
        .map((source) => {
            const state = bySource[source];
            if (!state) return `${spotSourceLabels[source]} …`;
            return `${spotSourceLabels[source]} ${state.failed ? "unavailable" : state.spots.length}`;
        })
        .join(" · ");

    // The cog sits beside Back rather than among the chips below: it swaps the whole page for the
    // setup, which is a different thing from the filters and refresh that act on the list in place.
    const title = (
        <Stack direction="row" gap="md">
            <Typography variant="h1" style={{ flexGrow: 1 }}>
                {setup ? "Spot setup" : `Spots (${visible.length})`}
            </Typography>
            <View>
                <Button
                    colour={setup ? "secondary" : "primary"}
                    startIcon="settings"
                    aria-label={setup ? "Back to spots" : "Spot setup"}
                    onPress={() => setSetup(!setup)}
                    style={{ paddingLeft: theme.margins.xl, paddingRight: theme.margins.xl }}
                />
            </View>
        </Stack>
    );

    if (setup)
        return (
            <PageLayout title={title}>
                <SpotSettings />
            </PageLayout>
        );

    return (
        <PageLayout title={title}>
            {/* Every button is wrapped: a Button carries `flex: 1` of its own, which in a row makes
                it fight its neighbours for the width instead of taking what its label needs. */}
            <Stack direction="row" gap="lg" style={{ flexWrap: "wrap" }}>
                <SpotMeButton compact={compact} />
                <View>
                    <Button
                        variant="chip"
                        startIcon="refresh"
                        text={compact ? undefined : loading ? "Refreshing" : "Refresh"}
                        aria-label="Refresh"
                        disabled={loading}
                        onPress={() => void refreshSpots()}
                    />
                </View>
                <View>
                    <Button
                        variant="chip"
                        colour={filterCount ? "primary" : "grey"}
                        startIcon="funnel"
                        text={
                            filterCount
                                ? `${compact ? "" : "Filters "}(${filterCount})`
                                : compact
                                  ? undefined
                                  : "Filters"
                        }
                        aria-label="Filters"
                        onPress={() => setShowFilters(!showFilters)}
                    />
                </View>
                {filterCount > 0 && (
                    <View>
                        <Button
                            variant="chip"
                            colour="grey"
                            text={compact ? undefined : "Clear"}
                            startIcon={compact ? "close" : undefined}
                            aria-label="Clear filters"
                            onPress={() => updateSetting("spotFilter", defaultSpotFilter)}
                        />
                    </View>
                )}
            </Stack>
            <Typography variant="subtitle">
                {sourceStatus}
                {fetchedAt ? ` · updated ${fetchedAt.toFormat("HH:mm")}z` : ""}
            </Typography>
            {showFilters && (
                <View>
                    <SpotFilters spots={spots} />
                </View>
            )}
            <SpotList
                spots={visible}
                qsos={qsos}
                emptyMessage={
                    !fetchedAt
                        ? "Fetching spots..."
                        : !settings.spotSources.length
                          ? "No spot networks are switched on — turn one on under Filters."
                          : spots.length
                            ? "No spots match your filters."
                            : "Nothing spotted in the last hour."
                }
                onSpotPress={handleSpotPress}
                onRespotPress={handleRespotPress}
            />
            <SpotModal open={!!respotting} station={respotting} onClose={() => setRespotting(undefined)} />
            <Typography variant="subtitle">
                Tapping a spot logs it and opens the QSO, with everything the spot knows already filled in.
            </Typography>
        </PageLayout>
    );
};

export default Spots;
