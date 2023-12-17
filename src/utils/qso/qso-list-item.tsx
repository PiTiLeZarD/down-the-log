import React from "react";
import { freq2band } from "../../data/bands";
import { useStore } from "../../store";
import { findCountry, getCallsignData } from "../../utils/callsign";
import { maidenDistance } from "../../utils/locator";
import { QSO } from "../../utils/qso";
import { Stack } from "../../utils/stack";
import { Typography } from "../../utils/theme/components/typography";
import { QsoListProps } from "./qso-list";
import { QsoRow } from "./qso-row";

export type QsoListItemProps = {
    item: QSO;
    index: number;
    onQsoPress: QsoListProps["onQsoPress"];
};

export type QsoListItemComponent = React.FC<QsoListItemProps>;

export const QsoListItem: QsoListItemComponent = React.memo(
    ({ item: qso, index, onQsoPress }): JSX.Element => {
        const currentLocation = useStore((state) => state.currentLocation);
        const callsignData = getCallsignData(qso.callsign);
        return (
            <QsoRow
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
        );
    },
    (prevProps, nextProps) => nextProps.item.id === prevProps.item.id,
);