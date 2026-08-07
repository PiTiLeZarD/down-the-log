import { useRouter } from "expo-router";
import { useFormContext } from "react-hook-form";
import { PaginatedList } from "../ui/paginated-list";
import { Typography } from "../ui/typography";
import { baseCallsign } from "../utils/callsign";
import { QSO, useQsos } from "./qso";
import { QsoRow } from "./qso/qso-row";
import { Stack } from "./stack";

export const PreviousQsos = () => {
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
            <Typography variant="h3">
                Other QSOs with {baseCallsign(callsign)} ({qsos.length} total)
            </Typography>
            <PaginatedList itemsPerPage={5}>
                <QsoRow header position="ID" time="Date" callsign="Notes" name="Callsign" band="Band" hidePosition />
                {qsos.map((q, i) => (
                    <QsoRow
                        onPress={() => navigate(`/qso?qsoId=${q.id}`)}
                        key={q.id}
                        position={String(i + 1)}
                        time={q.date.toFormat("dd/MM/yyyy")}
                        callsign={q.note}
                        name={q.callsign}
                        band={`${q.band || "N/A"} (${q.mode || "N/A"})`}
                        hidePosition
                    />
                ))}
            </PaginatedList>
        </Stack>
    );
};
