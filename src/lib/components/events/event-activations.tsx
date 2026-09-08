import React from "react";
import { Switch } from "react-native-gesture-handler";
import { Button } from "../../ui/button";
import { PaginatedList } from "../../ui/paginated-list";
import { Typography } from "../../ui/typography";
import { unique } from "../../utils/arrays";
import { EventType, eventDataMassageMap, getActivations } from "../../utils/event-rules";
import { downloadQsos } from "../../utils/file-format";
import { useSettings } from "../../utils/use-settings";
import { EventMap } from "../event-map";
import { MissingReferencesWarning } from "../missing-references-warning";
import { useQsos } from "../qso";
import { Reference } from "../reference";
import { Stack } from "../stack";

export type EventActivationsProps = {
    event: EventType;
};

// One award program's worth of the log: what has been hunted, and every reference activated. The
// list/map choice lives in the page header above this, since it is the same switch for every program.
export const EventActivations = ({ event }: EventActivationsProps) => {
    const qsos = useQsos();
    const showMap = useSettings().eventsMap;
    // WWFF's own rules put the bar at 44 QSOs, except for a local activation, which is 10. Nothing
    // in the log says which one an outing was, so it stays a toggle on the operator's side.
    const [wwffLocal, setWwffLocal] = React.useState<boolean>(false);
    const max = event === "wwff" && wwffLocal ? 10 : undefined;

    // The whole log is walked per reference, and both the map and the list want the same answer.
    const activations = React.useMemo(() => getActivations(event, qsos, max), [event, qsos, max]);
    const hunted = React.useMemo(() => qsos.filter((q) => !!q[event]), [qsos, event]);

    const handleDownloadHunting = () =>
        downloadQsos(`${event}_hunting.adif`, hunted, "adif", eventDataMassageMap[event]);

    return (
        <Stack gap="xxl">
            {event === "wwff" && (
                <Stack direction="row">
                    <Typography>Number of contacts required:</Typography>
                    <Typography>44</Typography>
                    <Switch value={wwffLocal} onValueChange={setWwffLocal} />
                    <Typography>10</Typography>
                </Stack>
            )}
            <MissingReferencesWarning event={event} />
            {!["pota"].includes(event) && (
                <>
                    <Typography variant="h3">Hunting</Typography>
                    <Button
                        startIcon="download"
                        text={`Hunting ADIF (${unique(hunted.map((q) => q[event])).length})`}
                        onPress={handleDownloadHunting}
                    />
                    <Typography variant="h3">Activating</Typography>
                </>
            )}
            {showMap ? (
                <EventMap event={event} activations={activations} max={max} />
            ) : (
                <PaginatedList itemsPerPage={6} whenEmpty={<Typography>No events available</Typography>}>
                    {Object.entries(activations).map(([reference, refActivations], i) => (
                        <Reference
                            key={reference}
                            position={i}
                            event={event}
                            reference={reference}
                            activations={refActivations}
                            max={max}
                        />
                    ))}
                </PaginatedList>
            )}
        </Stack>
    );
};
