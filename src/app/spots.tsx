import { useRouter } from "expo-router";
import { DateTime } from "luxon";
import React from "react";
import { View } from "react-native";
import { PageLayout } from "../lib/components/page-layout";
import { QSO, extrapolate, useQsos } from "../lib/components/qso";
import { SpotFilters, SpotList, SpotMeButton } from "../lib/components/spots";
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
    useSpots,
} from "../lib/utils/spots";
import { useStore } from "../lib/utils/store";
import { useActiveSession } from "../lib/utils/use-session";
import { useSettings } from "../lib/utils/use-settings";

const Spots = () => {
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

    const visible = React.useMemo(
        () => applySpotFilter(spots, settings.spotFilter, settings.spotSources, qsos),
        [spots, settings.spotFilter, settings.spotSources, qsos],
    );
    const filterCount = activeFilterCount(settings.spotFilter);

    // The same path the log screen's add button takes, seeded from the spot instead of from a typed
    // callsign: the QSO is logged and then opened, so it can be corrected or deleted like any other.
    const handleSpotPress = (spot: MergedSpot) => {
        const seeded = qsoFromSpot(spot, { settings, currentLocation, session, previous: qsos[0] });
        const qso: QSO = extrapolate(seeded, qsos, settings.carryOver, session);
        qso.date = DateTime.utc();
        if (session?.contest) {
            qso.stx = session.contest.serial;
            bumpSerial(session.id);
        }
        log(qso);
        navigate(`/qso?qsoId=${qso.id}`);
    };

    // One line per network so a dead source is visible as itself rather than as spots quietly going
    // missing from the list.
    const sourceStatus = settings.spotSources
        .map((source) => {
            const state = bySource[source];
            if (!state) return `${spotSourceLabels[source]} …`;
            return `${spotSourceLabels[source]} ${state.failed ? "unavailable" : state.spots.length}`;
        })
        .join(" · ");

    return (
        <PageLayout title={`Spots (${visible.length})`}>
            {/* Every button is wrapped: a Button carries `flex: 1` of its own, which in a row makes
                it fight its neighbours for the width instead of taking what its label needs. */}
            <Stack direction="row" gap="lg" style={{ flexWrap: "wrap" }}>
                <SpotMeButton />
                <View>
                    <Button
                        variant="chip"
                        startIcon="refresh"
                        text={loading ? "Refreshing" : "Refresh"}
                        disabled={loading}
                        onPress={() => void refreshSpots()}
                    />
                </View>
                <View>
                    <Button
                        variant="chip"
                        colour={filterCount ? "primary" : "grey"}
                        startIcon="funnel"
                        text={filterCount ? `Filters (${filterCount})` : "Filters"}
                        onPress={() => setShowFilters(!showFilters)}
                    />
                </View>
                {filterCount > 0 && (
                    <View>
                        <Button
                            variant="chip"
                            colour="grey"
                            text="Clear"
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
            />
            <Typography variant="subtitle">
                Tapping a spot logs it and opens the QSO, with everything the spot knows already filled in.
            </Typography>
        </PageLayout>
    );
};

export default Spots;
