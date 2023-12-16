import React from "react";
import { FlatList, View } from "react-native";
import { freq2band } from "../../data/bands";
import { useStore } from "../../store";
import { findCountry, getCallsignData } from "../../utils/callsign";
import { maidenDistance } from "../../utils/locator";
import { QSO } from "../../utils/qso";
import { Stack } from "../../utils/stack";
import { Typography } from "../../utils/theme/components/typography";
import { Qso } from "./qso";

export type QsoListItemProps = {
    qsos: QSO[];
    item: QSO;
    index: number;
    onQsoPress: QsoListProps["onQsoPress"];
};

export type QsoListItemComponent = React.FC<QsoListItemProps>;

export const QsoListItem: QsoListItemComponent = React.memo(
    ({ qsos, item: qso, index, onQsoPress }): JSX.Element => {
        const currentLocation = useStore((state) => state.currentLocation);
        const callsignData = getCallsignData(qso.callsign);
        return (
            <>
                {(index === 0 || qso.date.diff(qsos[index - 1].date).days > 0) && (
                    <>
                        <View
                            style={{
                                paddingHorizontal: 5,
                                paddingVertical: 3,
                                display: "flex",
                                alignItems: "center",
                            }}
                        >
                            <Typography style={{ fontWeight: "bold" }}>{qso.date.toFormat("dd/MM/yyyy")}</Typography>
                        </View>
                    </>
                )}
                <Qso
                    position={String(index + 1)}
                    time={qso.date.toFormat("HH:mm")}
                    callsign={
                        <Stack direction="row">
                            <Typography>{findCountry(callsignData)?.flag}</Typography>
                            <Typography>{qso.callsign}</Typography>
                            <Typography>
                                ({maidenDistance(currentLocation, qso.locator || callsignData?.gs || currentLocation)}
                                km)
                            </Typography>
                        </Stack>
                    }
                    name={qso.name || "N/A"}
                    band={`${qso.frequency ? freq2band(+qso.frequency) || "N/A" : "N/A"} (${qso.mode || "N/A"})`}
                    onPress={() => onQsoPress(qso)}
                />
            </>
        );
    },
    (prevProps, nextProps) => nextProps.item.id === prevProps.item.id,
);

export type QsoListProps = {
    qsos: QSO[];
    onQsoPress: (qso: QSO) => void;
};

export type QsoListComponent = React.FC<QsoListProps>;

export const QsoList: QsoListComponent = ({ qsos, onQsoPress }): JSX.Element => (
    <FlatList
        ListHeaderComponent={<Qso header position="ID" time="Time" callsign="Callsign" name="Name" band="Band" />}
        data={qsos}
        renderItem={({ item, index }) => <QsoListItem {...{ qsos, onQsoPress, item, index }} />}
    />
);
