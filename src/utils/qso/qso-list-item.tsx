import React from "react";
import { freq2band } from "../../data/bands";
import { countries } from "../../data/countries";
import { QSO } from "../../utils/qso";
import { Stack } from "../../utils/stack";
import { Typography } from "../../utils/theme/components/typography";
import { QsoListProps } from "./qso-list";
import { QsoRow } from "./qso-row";

export type QsoListItemProps = {
    item: QSO;
    index: number;
    lineHeight?: number;
    onQsoPress: QsoListProps["onQsoPress"];
    currentLocation: string;
};

export type QsoListItemComponent = React.FC<QsoListItemProps>;

export const QsoListItem: QsoListItemComponent = React.memo(
    ({ item: qso, index, lineHeight, onQsoPress, currentLocation }): JSX.Element => {
        return (
            <QsoRow
                lineHeight={lineHeight}
                success={qso.lotw_received || qso.eqsl_received}
                position={String((qso.position || index) + 1)}
                time={qso.date.toFormat("HH:mm")}
                callsign={
                    <Stack direction="row">
                        <Typography>{qso.country ? countries[qso.country]?.flag : ""}</Typography>
                        <Typography>{qso.callsign}</Typography>
                        <Typography>({qso.distance}km)</Typography>
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
