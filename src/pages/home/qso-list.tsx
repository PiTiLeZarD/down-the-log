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

export type QsoListProps = {
    qsos: QSO[];
    onQsoPress: (qso: QSO) => void;
};

export type QsoListComponent = React.FC<QsoListProps>;

export const QsoList: QsoListComponent = ({ qsos, onQsoPress }): JSX.Element => {
    const currentLocation = useStore((state) => state.currentLocation);
    const separator = (qso: QSO, index: number): JSX.Element => {
        if (index === 0 || qso.date.diff(qsos[index - 1].date).days > 0) {
            return (
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
            );
        }
        return <></>;
    };

    const callsignCell = (qso: QSO) => {
        const callsignData = getCallsignData(qso.callsign);
        return (
            <Stack direction="row">
                <Typography>{findCountry(callsignData)?.flag}</Typography>
                <Typography>{qso.callsign}</Typography>
                <Typography>
                    ({maidenDistance(currentLocation, qso.locator || callsignData?.gs || currentLocation)}km)
                </Typography>
            </Stack>
        );
    };

    return (
        <FlatList
            ListHeaderComponent={<Qso header position="ID" time="Time" callsign="Callsign" name="Name" band="Band" />}
            data={qsos}
            renderItem={({ item, index }) => (
                <>
                    {separator(item, index)}
                    <Qso
                        position={String(index + 1)}
                        time={item.date.toFormat("HH:mm")}
                        callsign={callsignCell(item)}
                        name={item.name || "N/A"}
                        band={`${item.frequency ? freq2band(+item.frequency) || "N/A" : "N/A"} (${item.mode || "N/A"})`}
                        onPress={() => onQsoPress(item)}
                    />
                </>
            )}
        />
    );
};
