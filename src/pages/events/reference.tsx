import { NavigationProp, useNavigation } from "@react-navigation/native";
import React from "react";
import { View } from "react-native";
import { NavigationParamList } from "../../Navigation";
import { useStore } from "../../store";
import { downloadQsos } from "../../utils/adif";
import { Grid } from "../../utils/grid";
import { QSO, useQsos } from "../../utils/qso";
import { Button } from "../../utils/theme/components/button";
import { Icon } from "../../utils/theme/components/icon";
import { Typography } from "../../utils/theme/components/typography";
import { GmapsChip } from "../qso-form/gmaps-chip";
import { EventActivation, EventType, eventDataMap, eventDataMassageMap, eventFileNameMap } from "./rules";

export type ReferenceProps = {
    event: EventType;
    reference: string;
    activations: Record<string, EventActivation>;
};

export type ReferenceComponent = React.FC<ReferenceProps>;

export const Reference: ReferenceComponent = ({ event, reference, activations }): JSX.Element => {
    const qsos = useQsos();
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
        <>
            <Grid container style={{ height: 32 }}>
                <Grid item xs={2}>
                    <View>
                        <Button variant="chip" endIcon="arrow-forward" text={reference} onPress={handleRefPress} />
                    </View>
                </Grid>
                <Grid item xs={6}>
                    <Typography>{eventData?.name}</Typography>
                </Grid>
                <Grid item xs={2}>
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
                        <Typography>{date}</Typography>
                    </Grid>
                    <Grid item xs={2}>
                        <Typography>{status}</Typography>
                    </Grid>
                    <Grid item xs={6}>
                        <Typography>Qsos: {qsos.length}</Typography>
                    </Grid>
                </Grid>
            ))}
        </>
    );
};
