import { useRouter } from "expo-router";
import { DateTime } from "luxon";
import React from "react";
import { View } from "react-native";
import { useStyles } from "react-native-unistyles";
import { downloadQsos } from "../utils/adif";
import {
    EventActivation,
    EventType,
    dtFormat,
    eventDataMap,
    eventDataMassageMap,
    eventFileNameMap,
    rules,
} from "../utils/event-rules";
import { useStore } from "../utils/store";
import { Button } from "../utils/theme/components/button";
import { Icon } from "../utils/theme/components/icon";
import { Typography } from "../utils/theme/components/typography";
import { GmapsChip } from "./gmaps-chip";
import { Grid } from "./grid";
import { QSO } from "./qso";

export type ReferenceProps = {
    position: number;
    max?: number;
    event: EventType;
    reference: string;
    activations: Record<string, EventActivation>;
};

const distances = (qsos: QSO[]) => qsos.filter((q) => !!q.distance).map((q) => q.distance) as number[];

export type ReferenceComponent = React.FC<ReferenceProps>;

export const Reference: ReferenceComponent = ({ position, max, event, reference, activations }): JSX.Element => {
    const { theme } = useStyles();
    const eventData = eventDataMap[event][reference];
    const updateFilters = useStore((state) => state.updateFilters);
    const { navigate } = useRouter();

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
                backgroundColor: position % 2 ? theme.colours.grey[300] : undefined,
            }}
        >
            <Grid container style={{ height: 32 }}>
                <Grid item xs={2}>
                    <View>
                        <Button variant="chip" endIcon="search" text={reference} onPress={handleRefPress} />
                    </View>
                </Grid>
                <Grid item xs={event === "wwff" ? 5 : 7}>
                    <Typography variant="em">{eventData?.name}</Typography>
                </Grid>
                {event === "wwff" && (
                    <Grid item xs={2}>
                        <Typography>{rules["wwff"](allQsos, max)}</Typography>
                    </Grid>
                )}
                <Grid item xs={1}>
                    {eventData?.locator && (
                        <View>
                            <GmapsChip locator={eventData?.locator} zoom={10} />
                        </View>
                    )}
                </Grid>
                <Grid item xs={2}>
                    <View>
                        <Button
                            startIcon="download"
                            variant="chip"
                            colour="secondary"
                            text="ADIF"
                            onPress={() => handleDownload(allQsos)}
                        />
                    </View>
                </Grid>
            </Grid>
            {Object.entries(activations).map(([date, { status, qsos }]) => (
                <Grid container key={date}>
                    <Grid item xs={1} />
                    <Grid item xs={1}>
                        <Icon name="arrow-forward" />
                    </Grid>
                    <Grid item xs={2}>
                        <Typography>{DateTime.fromFormat(date, dtFormat).toFormat("dd/MM/yyyy")}</Typography>
                    </Grid>
                    <Grid item xs={2}>
                        <Typography>{status}</Typography>
                    </Grid>
                    <Grid item xs={6}>
                        <Typography>
                            Qsos: {qsos.length} P2P: {qsos.filter((q) => !!q[event]).length} min:
                            {Math.min(...distances(qsos))}km max: {Math.max(...distances(qsos))}km
                        </Typography>
                    </Grid>
                </Grid>
            ))}
        </View>
    );
};
