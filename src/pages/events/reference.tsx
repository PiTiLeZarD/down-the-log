import { NavigationProp, useNavigation } from "@react-navigation/native";
import { DateTime } from "luxon";
import React from "react";
import { View } from "react-native";
import { useStyles } from "react-native-unistyles";
import { NavigationParamList } from "../../Navigation";
import { useStore } from "../../store";
import { downloadQsos } from "../../utils/adif";
import { Grid } from "../../utils/grid";
import { QSO } from "../../utils/qso";
import { Button } from "../../utils/theme/components/button";
import { Icon } from "../../utils/theme/components/icon";
import { Typography } from "../../utils/theme/components/typography";
import { GmapsChip } from "../qso-form/gmaps-chip";
import {
    EventActivation,
    EventType,
    dtFormat,
    eventDataMap,
    eventDataMassageMap,
    eventFileNameMap,
    rules,
} from "./rules";

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
    const { navigate } = useNavigation<NavigationProp<NavigationParamList>>();

    const handleDownload = (qsos: QSO[]) =>
        downloadQsos(eventFileNameMap[event](qsos), qsos, "adif", eventDataMassageMap[event]);
    const handleRefPress = () => {
        updateFilters([{ name: event, values: [reference] }]);
        navigate("Home");
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
                        <Typography>
                            {rules["wwff"](
                                Object.entries(activations)
                                    .map(([, { qsos }]) => qsos)
                                    .flat(),
                                max,
                            )}
                        </Typography>
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
                        <Button startIcon="download" variant="chip" colour="secondary" text="ADIF" />
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
