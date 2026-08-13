import React, { Fragment } from "react";
import { QSO, duration, hasEvent } from ".";
import { countries } from "../../data/countries";
import { roundTo } from "../../utils/math";
import { Icon } from "../../ui/icon";
import { Typography } from "../../ui/typography";
import { Stack } from "../stack";
import { QsoListProps } from "./qso-list";
import { QsoRow } from "./qso-row";

export type QsoListItemProps = {
    item: QSO;
    index: number;
    lineHeight?: number;
    onQsoPress: QsoListProps["onQsoPress"];
    imperial: boolean;
    openIssues: boolean;
};

export const QsoListItem = React.memo(
    ({ item: qso, index, lineHeight, onQsoPress, imperial, openIssues }: QsoListItemProps) => {
        const icons = [
            qso.note ? <Icon name="chatbox-ellipses-outline" /> : null,
            hasEvent(qso) ? <Icon name="earth" /> : null,
            (qso.pota && qso.myPota) || (qso.wwff && qso.myWwff) ? <Icon name="swap-horizontal" /> : null,
            openIssues ? <Icon name="warning-outline" colour="danger" /> : null,
        ].filter((e) => !!e);

        return (
            <QsoRow
                lineHeight={lineHeight}
                danger={openIssues}
                success={qso.lotw_received || qso.eqsl_received}
                position={String((qso.position === undefined ? index : qso.position) + 1)}
                time={qso.date.toFormat("HH:mm")}
                duration={duration(qso)}
                callsign={
                    <Stack direction="row" style={{ flexWrap: "wrap" }}>
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
                    // Wraps rather than overflows: band, mode and up to four icons don't fit on one
                    // line in a phone-width column.
                    <Stack direction="row" style={{ flexWrap: "wrap" }}>
                        <Typography>{[qso.band, qso.mode].filter((e) => !!e).join("/")}</Typography>
                        {icons.map((icon, i) => (
                            <Fragment key={i}>{icon}</Fragment>
                        ))}
                    </Stack>
                }
                onPress={() => onQsoPress(qso)}
            />
        );
    },
    // Identity, not id/position: the store replaces QSOs rather than mutating them, so a new object
    // is exactly "this row's data changed". Comparing id/position instead kept editing a QSO — an
    // added dateOff, say — from ever repainting its row, since neither field moves on an edit.
    (prevProps, nextProps) =>
        nextProps.item === prevProps.item &&
        nextProps.openIssues === prevProps.openIssues &&
        nextProps.imperial === prevProps.imperial,
);
