import { useRouter } from "expo-router";
import React from "react";
import { useFormContext } from "react-hook-form";
import { baseCallsign } from "../utils/callsign";
import { PaginatedList } from "../utils/theme/components/paginated-list";
import { Typography } from "../utils/theme/components/typography";
import { QSO, useQsos } from "./qso";
import { QsoRow } from "./qso/qso-row";
import { Stack } from "./stack";

export type PreviousQsosProps = {};

export type PreviousQsosComponent = React.FC<PreviousQsosProps>;

export const PreviousQsos: PreviousQsosComponent = (): JSX.Element => {
    const { getValues } = useFormContext<QSO>();
    const { id, callsign } = getValues();
    const { navigate } = useRouter();

    const qsos = useQsos().filter(
        (q) =>
            id != q.id && baseCallsign(callsign) !== undefined && baseCallsign(q.callsign) === baseCallsign(callsign),
    );

    if (qsos.length === 0) return <></>;

    return (
        <Stack>
            <Typography variant="h3">Other QSOs with {baseCallsign(callsign)}</Typography>
            <PaginatedList itemsPerPage={5}>
                <QsoRow header position="ID" time="Date" callsign="Notes" name="Callsign" band="Band" />
                {qsos.map((q, i) => (
                    <QsoRow
                        onPress={() => navigate(`/qso?qsoId=${q.id}`)}
                        key={q.id}
                        position={String(i + 1)}
                        time={q.date.toFormat("dd/MM/yyyy")}
                        callsign={q.note}
                        name={q.callsign}
                        band={`${q.band || "N/A"} (${q.mode || "N/A"})`}
                    />
                ))}
            </PaginatedList>
        </Stack>
    );
};
