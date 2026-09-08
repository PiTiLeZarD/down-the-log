import { useRouter } from "expo-router";
import React from "react";
import { View } from "react-native";
import { Alert } from "../ui/alert";
import { Button } from "../ui/button";
import { IconName } from "../ui/icon";
import { PaginatedList } from "../ui/paginated-list";
import { Typography } from "../ui/typography";
import { unique } from "../utils/arrays";
import { useStore } from "../utils/store";
import {
    TotaView,
    activationKey,
    getTotaActivations,
    isQsoUploadable,
    isUploadable,
    qsosMissingTile,
    totaCutoff,
    uploadedAt,
} from "../utils/tota";
import { useSettings } from "../utils/use-settings";
import { useQsos } from "./qso";
import { Stack } from "./stack";
import { TotaActivationRow } from "./tota-activation";
import { TotaPoster } from "./tota-poster";
import { TotaRegistration, TotaRegistrationChip, readableDate } from "./tota-registration";

const views: { value: TotaView; label: string; icon: IconName }[] = [
    { value: "list", label: "List", icon: "list" },
    { value: "poster", label: "Poster", icon: "grid-outline" },
];

// A view that no longer exists — the map the poster took over from — falls back to the list.
const currentView = (stored: TotaView): TotaView => (views.some((v) => v.value === stored) ? stored : "list");

// Sits in the page header next to the section title. Until the registration date is known the page
// shows nothing but the form asking for it, so there is no view to switch between.
export const TotaViewToggle = () => {
    const { totaView, totaRegistered } = useSettings();
    const updateSetting = useStore((state) => state.updateSetting);
    const view = currentView(totaView);

    if (!totaRegistered) return null;

    return (
        <>
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
        </>
    );
};

// Nothing is filtered out on merit. TOTA puts every inch of the planet in a tile — a backyard is as
// valid an activation as a summit, it just scores its QSOs with no distance behind them — so the log
// has no business deciding which of the operator's days are worth uploading. The two things hidden
// are the days already sent, which is bookkeeping, and the days before TOTA's backdating window,
// which their uploader would refuse anyway. That window is measured from the registration date, so
// the page asks for it before it can show anything.
export const TotaActivations = () => {
    const qsos = useQsos();
    const settings = useSettings();
    const { totaView: stored, totaRegistered: registered } = settings;
    const view = currentView(stored);
    const updateFilters = useStore((state) => state.updateFilters);
    const { navigate } = useRouter();
    const [hideUploaded, setHideUploaded] = React.useState<boolean>(false);

    // Everything the log knows about first, then the window TOTA will actually take. Both are
    // memoised on the log alone: the registration date is a string compare on top, too cheap to
    // widen the dependency for.
    const everything = React.useMemo(() => getTotaActivations(qsos), [qsos]);
    const allMissing = React.useMemo(() => qsosMissingTile(qsos), [qsos]);

    if (!registered) return <TotaRegistration />;

    const all = everything.filter((a) => isUploadable(a, registered));
    const missing = allMissing.filter((q) => isQsoUploadable(q, registered));
    const tooOld = everything.length - all.length;

    const uploaded = all.filter((a) => !!uploadedAt(a)).length;
    // Hiding the uploaded ones is a view of the same log, not a smaller log, so the counts above
    // stay counts of everything TOTA would take.
    const activations = hideUploaded ? all.filter((a) => !uploadedAt(a)) : all;
    const tiles = unique(all.map((a) => a.tile));
    // Nothing to hand out isn't the same thing as nothing logged, and the empty view should say so.
    const whenEmpty = (
        <Typography>{hideUploaded ? "Every activation here is uploaded" : "No tile activations yet"}</Typography>
    );

    return (
        <Stack gap="xxl">
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
            {view === "poster" && <TotaPoster tiles={tiles} />}
            {view === "list" && (
                <PaginatedList itemsPerPage={8} whenEmpty={whenEmpty}>
                    {activations.map((activation, i) => (
                        <TotaActivationRow key={activationKey(activation)} position={i} activation={activation} />
                    ))}
                </PaginatedList>
            )}
        </Stack>
    );
};
