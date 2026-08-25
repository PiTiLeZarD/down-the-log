import { useRouter } from "expo-router";
import React from "react";
import { View } from "react-native";
import { PageLayout } from "../lib/components/page-layout";
import { useQsos } from "../lib/components/qso";
import { Stack } from "../lib/components/stack";
import { TotaActivationRow } from "../lib/components/tota-activation";
import { TotaPoster } from "../lib/components/tota-poster";
import { TotaRegistration, TotaRegistrationChip, readableDate } from "../lib/components/tota-registration";
import { unique } from "../lib/utils/arrays";
import { useStore } from "../lib/utils/store";
import {
    TotaView,
    activationKey,
    getTotaActivations,
    isQsoUploadable,
    isUploadable,
    qsosMissingTile,
    totaCutoff,
    uploadedAt,
} from "../lib/utils/tota";
import { useSettings } from "../lib/utils/use-settings";
import { Alert } from "../lib/ui/alert";
import { Button } from "../lib/ui/button";
import { IconName } from "../lib/ui/icon";
import { PaginatedList } from "../lib/ui/paginated-list";
import { Typography } from "../lib/ui/typography";

const views: { value: TotaView; label: string; icon: IconName }[] = [
    { value: "list", label: "List", icon: "list" },
    { value: "poster", label: "Poster", icon: "grid-outline" },
];

// Nothing is filtered out on merit. TOTA puts every inch of the planet in a tile — a backyard is as
// valid an activation as a summit, it just scores its QSOs with no distance behind them — so the log
// has no business deciding which of the operator's days are worth uploading. The two things hidden
// are the days already sent, which is bookkeeping, and the days before TOTA's backdating window,
// which their uploader would refuse anyway. That window is measured from the registration date, so
// the page asks for it before it can show anything.
const Tota = () => {
    const qsos = useQsos();
    const settings = useSettings();
    const { totaView: stored, totaRegistered: registered } = settings;
    // A view that no longer exists — the map the poster took over from — falls back to the list.
    const view = views.some((v) => v.value === stored) ? stored : "list";
    const updateSetting = useStore((state) => state.updateSetting);
    const updateFilters = useStore((state) => state.updateFilters);
    const { navigate } = useRouter();
    const [hideUploaded, setHideUploaded] = React.useState<boolean>(false);

    // Everything the log knows about first, then the window TOTA will actually take. Both are
    // memoised on the log alone: the registration date is a string compare on top, too cheap to
    // widen the dependency for.
    const everything = React.useMemo(() => getTotaActivations(qsos), [qsos]);
    const allMissing = React.useMemo(() => qsosMissingTile(qsos), [qsos]);

    const all = registered ? everything.filter((a) => isUploadable(a, registered)) : everything;
    const missing = registered ? allMissing.filter((q) => isQsoUploadable(q, registered)) : allMissing;
    const tooOld = everything.length - all.length;

    const uploaded = all.filter((a) => !!uploadedAt(a)).length;
    // Hiding the uploaded ones is a view of the same log, not a smaller log, so the counts above
    // stay counts of everything TOTA would take.
    const activations = hideUploaded ? all.filter((a) => !uploadedAt(a)) : all;
    const tiles = unique(all.map((a) => a.tile));
    // The poster draws the same activations the rest of the page does, so it stops at the same
    // cutoff: a tile only reached on a day TOTA won't accept isn't progress it will ever hold.
    const posterTiles = unique(all.map((a) => a.tile));
    // Nothing to hand out isn't the same thing as nothing logged, and the empty view should say so.
    const whenEmpty = (
        <Typography>{hideUploaded ? "Every activation here is uploaded" : "No tile activations yet"}</Typography>
    );

    if (!registered)
        return (
            <PageLayout title="Tiles">
                <TotaRegistration />
            </PageLayout>
        );

    return (
        <PageLayout
            title={
                <Stack direction="row" gap="md">
                    <Typography variant="h1" style={{ flexGrow: 1 }}>
                        Tiles
                    </Typography>
                    {views.map(({ value, label, icon }) => (
                        <View key={value}>
                            <Button
                                variant="chip"
                                colour={view === value ? "primary" : "grey"}
                                startIcon={icon}
                                text={label}
                                onPress={() => updateSetting("totaView", value)}
                            />
                        </View>
                    ))}
                </Stack>
            }
        >
            <Stack direction="row">
                <Typography style={{ flexGrow: 1 }}>
                    {all.length} activation{all.length === 1 ? "" : "s"} in {tiles.length} tile
                    {tiles.length === 1 ? "" : "s"}, {uploaded} uploaded
                </Typography>
                <View>
                    <Button
                        variant="chip"
                        text="tilesontheair.com"
                        endIcon="open-outline"
                        url="https://tilesontheair.com/"
                    />
                </View>
            </Stack>
            <Typography variant="subtitle">
                A tile is the 6-character grid square you operated from, and every UTC day in a tile is its own
                activation — including the ones from home. One QSO is enough. Upload an activation&apos;s ADIF on their
                site, then add the distance and effort the log doesn&apos;t know about. They take logs through that form
                only — there is no submission API — so downloading an activation ticks it off here and the chip toggles
                by hand.
            </Typography>
            <Stack direction="row" gap="md">
                <View>
                    <TotaRegistrationChip />
                </View>
                {!!uploaded && view !== "poster" && (
                    <View>
                        <Button
                            variant="chip"
                            colour={hideUploaded ? "primary" : "grey"}
                            startIcon={hideUploaded ? "eye-off-outline" : "eye-outline"}
                            text="Hide uploaded"
                            onPress={() => setHideUploaded(!hideUploaded)}
                        />
                    </View>
                )}
            </Stack>
            {!!tooOld && (
                <Typography variant="subtitle">
                    {tooOld} older activation{tooOld === 1 ? " is" : "s are"} not listed: TOTA only accepts logs from{" "}
                    {readableDate(totaCutoff(registered), settings.datemonth)} onwards, 30 days before you registered.
                </Typography>
            )}
            {!!missing.length && (
                <Alert severity="warning">
                    <Stack direction="row" style={{ width: "95%" }}>
                        <Typography style={{ flexGrow: 1 }}>
                            {missing.length} QSO{missing.length === 1 ? "" : "s"} without a 6-character gridsquare of
                            your own, so no tile
                        </Typography>
                        <View style={{ flex: 1 }}>
                            <Button
                                text="Check them here"
                                onPress={() => {
                                    updateFilters([{ name: "tile", values: [""] }]);
                                    navigate("/");
                                }}
                            />
                        </View>
                    </Stack>
                </Alert>
            )}
            {view === "poster" && <TotaPoster tiles={posterTiles} />}
            {view === "list" && (
                <PaginatedList itemsPerPage={8} whenEmpty={whenEmpty}>
                    {activations.map((activation, i) => (
                        <TotaActivationRow key={activationKey(activation)} position={i} activation={activation} />
                    ))}
                </PaginatedList>
            )}
        </PageLayout>
    );
};

export default Tota;
