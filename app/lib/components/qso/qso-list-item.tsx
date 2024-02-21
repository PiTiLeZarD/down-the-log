import React from "react";
import { QSO, duration, hasEvent } from ".";
import { countries } from "../../data/countries";
import { roundTo } from "../../utils/math";
import { Icon } from "../../utils/theme/components/icon";
import { Typography } from "../../utils/theme/components/typography";
import { Stack } from "../stack";
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
    ({ item: qso, index, lineHeight, onQsoPress, imperial }): JSX.Element => (
        <QsoRow
            lineHeight={lineHeight}
            success={qso.lotw_received || qso.eqsl_received}
            position={String((qso.position === undefined ? index : qso.position) + 1)}
            time={qso.date.toFormat("HH:mm")}
            duration={duration(qso)}
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
                        <Typography>{[qso.band, qso.mode].filter((e) => !!e).join("/")}</Typography>
                        <Icon name="earth" />
                    </Stack>
                ) : (
                    [qso.band, qso.mode].filter((e) => !!e).join("/")
                )
            }
            onPress={() => onQsoPress(qso)}
        />
    ),
    (prevProps, nextProps) =>
        nextProps.item.id === prevProps.item.id && nextProps.item.position === prevProps.item.position,
);
