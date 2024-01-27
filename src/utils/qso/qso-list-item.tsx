import React from "react";
import { countries } from "../../data/countries";
import { QSO, hasEvent } from "../../utils/qso";
import { Stack } from "../../utils/stack";
import { Typography } from "../../utils/theme/components/typography";
import { roundTo } from "../math";
import { Icon } from "../theme/components/icon";
import { QsoListProps } from "./qso-list";
import { QsoRow } from "./qso-row";

export type QsoListItemProps = {
    item: QSO;
    index: number;
    lineHeight?: number;
    onQsoPress: QsoListProps["onQsoPress"];
    imperial: boolean;
};

export type QsoListItemComponent = React.FC<QsoListItemProps>;

export const QsoListItem: QsoListItemComponent = React.memo(
    ({ item: qso, index, lineHeight, onQsoPress, imperial }): JSX.Element => {
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
                        {qso.distance !== undefined && (
                            <Typography>
                                ({imperial ? roundTo(qso.distance / 1.6, 2) : qso.distance}
                                {imperial ? "mi" : "km"})
                            </Typography>
                        )}
                    </Stack>
                }
                name={qso.name || "N/A"}
                band={
                    hasEvent(qso) ? (
                        <Stack direction="row">
                            <Typography>{`${qso.band || "N/A"} (${qso.mode || "N/A"})`}</Typography>
                            <Icon name="earth" />
                        </Stack>
                    ) : (
                        `${qso.band || "N/A"} (${qso.mode || "N/A"})`
                    )
                }
                onPress={() => onQsoPress(qso)}
            />
        );
    },
    (prevProps, nextProps) => nextProps.item.id === prevProps.item.id,
);
