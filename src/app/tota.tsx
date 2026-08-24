import { useRouter } from "expo-router";
import React from "react";
import { View } from "react-native";
import { Switch } from "react-native-gesture-handler";
import { PageLayout } from "../lib/components/page-layout";
import { useQsos } from "../lib/components/qso";
import { Stack } from "../lib/components/stack";
import { TotaActivationRow } from "../lib/components/tota-activation";
import { TotaMap } from "../lib/components/tota-map";
import { unique } from "../lib/utils/arrays";
import { useStore } from "../lib/utils/store";
import { activationKey, getTotaActivations, qsosMissingTile, uploadedAt } from "../lib/utils/tota";
import { useSettings } from "../lib/utils/use-settings";
import { Alert } from "../lib/ui/alert";
import { Button } from "../lib/ui/button";
import { PaginatedList } from "../lib/ui/paginated-list";
import { Typography } from "../lib/ui/typography";

// Nothing is filtered out. TOTA puts every inch of the planet in a tile — a backyard is as valid an
// activation as a summit, it just scores its QSOs with no distance behind them — so the log has no
// business deciding which of the operator's days are worth uploading. The one toggle hides the days
// already sent, which is bookkeeping rather than a judgement about the activation.
const Tota = () => {
    const qsos = useQsos();
    const showMap = useSettings().totaMap;
    const updateSetting = useStore((state) => state.updateSetting);
    const updateFilters = useStore((state) => state.updateFilters);
    const { navigate } = useRouter();
    const [hideUploaded, setHideUploaded] = React.useState<boolean>(false);

    const all = React.useMemo(() => getTotaActivations(qsos), [qsos]);
    const missing = React.useMemo(() => qsosMissingTile(qsos), [qsos]);

    const uploaded = all.filter((a) => !!uploadedAt(a)).length;
    const activations = hideUploaded ? all.filter((a) => !uploadedAt(a)) : all;
    const tiles = unique(activations.map((a) => a.tile));

    return (
        <PageLayout
            title={
                <Stack direction="row">
                    <Typography variant="h1" style={{ flexGrow: 1 }}>
                        Tiles
                    </Typography>
                    <Typography>List</Typography>
                    <Switch value={showMap} onValueChange={(v) => updateSetting("totaMap", v)} />
                    <Typography>Map</Typography>
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
            {!!uploaded && (
                <Stack direction="row" gap="md">
                    <View>
                        <Button
                            variant="chip"
                            colour={hideUploaded ? "primary" : "grey"}
                            startIcon={hideUploaded ? "eye-off-outline" : "eye-outline"}
                            text="Hide uploaded"
                            onPress={() => setHideUploaded(!hideUploaded)}
                        />
                    </View>
                </Stack>
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
            {showMap ? (
                <TotaMap activations={activations} />
            ) : (
                <PaginatedList itemsPerPage={8} whenEmpty={<Typography>No tile activations yet</Typography>}>
                    {activations.map((activation, i) => (
                        <TotaActivationRow key={activationKey(activation)} position={i} activation={activation} />
                    ))}
                </PaginatedList>
            )}
        </PageLayout>
    );
};

export default Tota;
