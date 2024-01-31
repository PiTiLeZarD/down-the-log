import { NavigationProp, useNavigation } from "@react-navigation/native";
import React from "react";
import { View } from "react-native";
import { NavigationParamList } from "../../Navigation";
import { useStore } from "../../store";
import { downloadQsos } from "../../utils/adif";
import { Grid } from "../../utils/grid";
import { useQsos } from "../../utils/qso";
import { Button } from "../../utils/theme/components/button";
import { Typography } from "../../utils/theme/components/typography";
import { GmapsChip } from "../qso-form/gmaps-chip";
import { EventType, eventDataMap, eventFileNameMap, eventRuleMap, qsosForReference } from "./rules";

export type ReferenceProps = {
    event: EventType;
    reference: string;
};

export type ReferenceComponent = React.FC<ReferenceProps>;

export const Reference: ReferenceComponent = ({ reference, event }): JSX.Element => {
    const qsos = useQsos();
    const eventStatus = eventRuleMap[event](qsos, reference);
    const eventData = eventDataMap[event][reference];
    const updateFilters = useStore((state) => state.updateFilters);
    const { navigate } = useNavigation<NavigationProp<NavigationParamList>>();

    const refQsos = qsosForReference(qsos, event, reference);
    const handleDownload = () => downloadQsos(eventFileNameMap[event](refQsos), refQsos);
    const handleRefPress = () => {
        updateFilters([{ name: event, values: [reference] }]);
        navigate("Home");
    };

    return (
        <Grid container style={{ height: 32 }}>
            <Grid item xs={2}>
                <View>
                    <Button variant="chip" endIcon="arrow-forward" text={reference} onPress={handleRefPress} />
                </View>
            </Grid>
            <Grid item xs={5}>
                <Typography>{eventData?.name}</Typography>
            </Grid>
            <Grid item xs={1}>
                {eventData?.locator && (
                    <View>
                        <GmapsChip locator={eventData?.locator} zoom={10} />
                    </View>
                )}
            </Grid>
            <Grid item xs={2}>
                <Typography variant="em" style={{ textAlign: "center" }}>
                    {eventStatus}
                </Typography>
            </Grid>
            <Grid item xs={2}>
                {eventStatus === "Activated" && (
                    <View>
                        <Button
                            startIcon="download"
                            variant="chip"
                            colour="secondary"
                            text="ADIF"
                            onPress={handleDownload}
                        />
                    </View>
                )}
            </Grid>
        </Grid>
    );
};
