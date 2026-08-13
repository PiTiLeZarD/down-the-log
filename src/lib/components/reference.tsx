import { useRouter } from "expo-router";
import { DateTime } from "luxon";
import { View } from "react-native";
import { useUnistyles } from "react-native-unistyles";
import {
    EventActivation,
    EventType,
    dtFormat,
    eventDataMap,
    eventDataMassageMap,
    eventFileNameMap,
    rules,
} from "../utils/event-rules";
import { downloadQsos } from "../utils/file-format";
import { useStore } from "../utils/store";
import { useWidthMatches } from "../ui/breakpoints";
import { Button } from "../ui/button";
import { Typography } from "../ui/typography";
import { MapChip } from "./map-chip";
import { Grid } from "./grid";
import { QSO } from "./qso";

export type ReferenceProps = {
    position: number;
    max?: number;
    event: EventType;
    reference: string;
    activations: Record<string, EventActivation>;
};

export const Reference = ({ position, max, event, reference, activations }: ReferenceProps) => {
    const { theme } = useUnistyles();
    const eventData = eventDataMap[event][reference];
    const updateFilters = useStore((state) => state.updateFilters);
    const { navigate } = useRouter();
    // On a phone the name never fits beside the chips, so it drops onto a line of its own.
    const smallScreen = useWidthMatches(undefined, "md");

    const allQsos = Object.entries(activations)
        .map(([, { qsos }]) => qsos)
        .flat();
    const handleDownload = (qsos: QSO[]) =>
        downloadQsos(eventFileNameMap[event](qsos), qsos, "adif", eventDataMassageMap[event]);
    const handleRefPress = () => {
        updateFilters([{ name: event, values: [reference] }]);
        navigate("/");
    };

    return (
        <View
            style={{
                padding: theme.margins.lg,
                borderRadius: theme.margins.lg,
                backgroundColor: theme.colours.grey[theme.rowShade(!!(position % 2))],
            }}
        >
            <Grid container style={smallScreen ? undefined : { height: 32 }}>
                <Grid item xs={event === "pota" ? 8 : 5} md={2}>
                    {/* Chips size to their label and sit at the outer edges of the row rather than
                        stretching across their whole column. */}
                    <View style={{ alignItems: "flex-start" }}>
                        <Button variant="chip" endIcon="search" text={reference} onPress={handleRefPress} />
                    </View>
                </Grid>
                {!smallScreen && (
                    <Grid item md={event === "wwff" ? 6 : 7}>
                        <Typography variant="em">{eventData?.name}</Typography>
                    </Grid>
                )}
                {event === "wwff" && (
                    <Grid item xs={3} md={2}>
                        <Typography>{rules["wwff"](allQsos, max)}</Typography>
                    </Grid>
                )}
                {/* wwff references are all mapped on the events map already, so they carry no map chip. */}
                {event !== "wwff" && (
                    <Grid item xs={event === "pota" ? 4 : 3} md={event === "pota" ? 3 : 1}>
                        {eventData?.locator && (
                            <View style={{ alignItems: "flex-end" }}>
                                {event !== "pota" && <MapChip locator={eventData?.locator} zoom={10} />}
                                {event === "pota" && (
                                    <Button
                                        variant="chip"
                                        text="pota"
                                        // Says it leaves the app for pota.app rather than filtering in place.
                                        endIcon="open-outline"
                                        url={`https://pota.app/#/park/${reference}`}
                                    />
                                )}
                            </View>
                        )}
                    </Grid>
                )}
                {!["pota"].includes(event) && (
                    <Grid item xs={4} md={2}>
                        <View style={{ alignItems: "flex-end" }}>
                            <Button
                                startIcon="download"
                                variant="chip"
                                colour="secondary"
                                text="ADIF"
                                onPress={() => handleDownload(allQsos)}
                            />
                        </View>
                    </Grid>
                )}
            </Grid>
            {smallScreen && <Typography variant="em">{eventData?.name}</Typography>}
            {Object.entries(activations).map(([date, { status, qsos }]) => (
                <Grid container key={date}>
                    <Grid item xs={3}>
                        <Typography>{DateTime.fromFormat(date, dtFormat).toFormat("dd/MM/yy")}</Typography>
                    </Grid>
                    <Grid item xs={3}>
                        <Typography>{status}</Typography>
                    </Grid>
                    <Grid item xs={["pota"].includes(event) ? 5 : 6}>
                        <Typography>
                            Qsos: {qsos.length} P2P: {qsos.filter((q) => !!q[event]).length}
                        </Typography>
                    </Grid>
                    {["pota"].includes(event) && (
                        <Grid item xs={1}>
                            <View style={{ alignItems: "flex-end" }}>
                                <Button
                                    startIcon="download"
                                    variant="chip"
                                    colour="secondary"
                                    onPress={() => handleDownload(qsos)}
                                />
                            </View>
                        </Grid>
                    )}
                </Grid>
            ))}
        </View>
    );
};
