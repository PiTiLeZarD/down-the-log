import { DateTime } from "luxon";
import { View } from "react-native";
import { useRouter } from "expo-router";
import { useUnistyles } from "react-native-unistyles";
import { unique } from "../utils/arrays";
import { Band } from "../data/bands";
import { downloadQsos } from "../utils/file-format";
import { TotaActivation, dtFormat, isQrpActivation, totaFileName, totaMassage } from "../utils/tota";
import { useStore } from "../utils/store";
import { useWidthMatches } from "../ui/breakpoints";
import { Button } from "../ui/button";
import { Typography } from "../ui/typography";
import { Grid } from "./grid";
import { MapChip } from "./map-chip";

export type TotaActivationRowProps = {
    position: number;
    activation: TotaActivation;
};

export const TotaActivationRow = ({ position, activation }: TotaActivationRowProps) => {
    const { theme } = useUnistyles();
    const { tile, date, qsos } = activation;
    const updateFilters = useStore((state) => state.updateFilters);
    const { navigate } = useRouter();
    const smallScreen = !useWidthMatches("md");

    const handleTilePress = () => {
        updateFilters([{ name: "tile", values: [tile] }]);
        navigate("/");
    };

    const from = qsos[0].date;
    const to = qsos[qsos.length - 1].date;
    const bands = unique(qsos.map((q) => q.band).filter((b): b is Band => !!b));

    return (
        <View
            style={{
                padding: theme.margins.lg,
                borderRadius: theme.margins.lg,
                backgroundColor: theme.colours.grey[theme.rowShade(!!(position % 2))],
            }}
        >
            <Grid container>
                <Grid item xs={5} md={3}>
                    <View style={{ alignItems: "flex-start" }}>
                        <Button variant="chip" endIcon="search" text={tile} onPress={handleTilePress} />
                    </View>
                </Grid>
                <Grid item xs={4} md={3}>
                    <Typography>{DateTime.fromFormat(date, dtFormat).toFormat("dd/MM/yy")}</Typography>
                </Grid>
                <Grid item xs={3} md={2}>
                    <View style={{ alignItems: smallScreen ? "flex-end" : "flex-start" }}>
                        <MapChip locator={tile} zoom={12} />
                    </View>
                </Grid>
                {!smallScreen && (
                    <Grid item md={2}>
                        <View style={{ alignItems: "flex-end" }}>
                            {isQrpActivation(activation) && <Button variant="chip" colour="success" text="QRP" />}
                        </View>
                    </Grid>
                )}
                <Grid item xs={12} md={2}>
                    <View style={{ alignItems: "flex-end" }}>
                        <Button
                            startIcon="download"
                            variant="chip"
                            colour="secondary"
                            text="ADIF"
                            onPress={() => downloadQsos(totaFileName(activation), qsos, "adif", totaMassage)}
                        />
                    </View>
                </Grid>
            </Grid>
            <Grid container>
                <Grid item xs={4}>
                    <Typography>Qsos: {qsos.length}</Typography>
                </Grid>
                <Grid item xs={4}>
                    <Typography>
                        {from.toFormat("HH:mm")}-{to.toFormat("HH:mm")}z
                    </Typography>
                </Grid>
                <Grid item xs={4}>
                    <Typography>{bands.join(", ")}</Typography>
                </Grid>
            </Grid>
        </View>
    );
};
