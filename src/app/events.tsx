import React from "react";
import { Switch } from "react-native-gesture-handler";
import { EventMap } from "../lib/components/event-map";
import { MissingReferencesWarning } from "../lib/components/missing-references-warning";
import { PageLayout } from "../lib/components/page-layout";
import { useQsos } from "../lib/components/qso";
import { Reference } from "../lib/components/reference";
import { Stack } from "../lib/components/stack";
import { TabsLayout } from "../lib/components/tabs-layout";
import { unique } from "../lib/utils/arrays";
import { EventType, eventDataMassageMap, events, getActivations } from "../lib/utils/event-rules";
import { downloadQsos } from "../lib/utils/file-format";
import { backfillSessions } from "../lib/utils/session";
import { useStore } from "../lib/utils/store";
import { useSettings } from "../lib/utils/use-settings";
import { Button } from "../lib/ui/button";
import { showDialog } from "../lib/ui/dialog";
import { PaginatedList } from "../lib/ui/paginated-list";
import { Typography } from "../lib/ui/typography";

// Turns the activations on this page into real sessions. The screen works them out from the QSOs
// every render, but only a session shows up on the sessions list, exports as one, or can be picked
// up again — so a log that predates sessions gets nothing from them until it's been through here.
const BackfillButton = () => {
    const qsos = useQsos();
    const adoptSessions = useStore((state) => state.adoptSessions);
    // The whole log walked per event; worth memoising, since it recomputes on any tab or toggle press.
    const pending = React.useMemo(() => backfillSessions(qsos), [qsos]);

    if (!pending.sessions.length) return null;

    const handlePress = async () => {
        const confirmed = await showDialog({
            title: `Make ${pending.sessions.length} sessions?`,
            icon: "question",
            text: `${pending.qsos.length} QSOs from past activations aren't in a session yet. Each activation becomes one, dated when it happened. Nothing is logged or changed beyond that.`,
            confirmButtonText: "Make them",
            cancelButtonText: "Cancel",
        });
        if (confirmed) adoptSessions(pending.sessions, pending.qsos);
    };

    return (
        <Button
            variant="chip"
            colour="secondary"
            startIcon="albums"
            text={`Sessions (${pending.sessions.length})`}
            onPress={handlePress}
        />
    );
};

const Events = () => {
    const qsos = useQsos();
    const [wwffLocal, setWwffLocal] = React.useState<boolean>(false);
    const showMap = useSettings().eventsMap;
    const updateSetting = useStore((state) => state.updateSetting);
    const getMax = (event: EventType) => (event === "wwff" && wwffLocal ? 10 : undefined);

    const handleDownloadHunting = (event: EventType) => () =>
        downloadQsos(
            `${event}_hunting.adif`,
            qsos.filter((q) => !!q[event]),
            "adif",
            eventDataMassageMap[event],
        );

    return (
        <PageLayout
            title={
                <Stack direction="row">
                    <Typography variant="h1" style={{ flexGrow: 1 }}>
                        Events
                    </Typography>
                    <BackfillButton />
                    <Typography>List</Typography>
                    <Switch value={showMap} onValueChange={(v) => updateSetting("eventsMap", v)} />
                    <Typography>Map</Typography>
                </Stack>
            }
        >
            <TabsLayout tabs={Array.from(events).map((t) => t.toUpperCase())}>
                {Array.from(events).map((event) => (
                    <Stack key={event}>
                        {event === "wwff" && (
                            <Stack direction="row">
                                <Typography>Number of contacts required:</Typography>
                                <Typography>44</Typography>
                                <Switch value={wwffLocal} onValueChange={(v) => setWwffLocal(!wwffLocal)} />
                                <Typography>10</Typography>
                            </Stack>
                        )}
                        <MissingReferencesWarning event={event} />
                        {!["pota"].includes(event) && (
                            <>
                                <Typography variant="h3">Hunting</Typography>
                                <Button
                                    startIcon="download"
                                    text={`Hunting ADIF (${unique(qsos.filter((q) => !!q[event]).map((q) => q[event])).length})`}
                                    onPress={handleDownloadHunting(event)}
                                />
                                <Typography variant="h3">Activating</Typography>
                            </>
                        )}
                        {showMap ? (
                            <EventMap
                                event={event}
                                activations={getActivations(event, qsos, getMax(event))}
                                max={getMax(event)}
                            />
                        ) : (
                            <PaginatedList itemsPerPage={6} whenEmpty={<Typography>No events available</Typography>}>
                                {Object.entries(getActivations(event, qsos, getMax(event))).map(
                                    ([reference, activations], i) => (
                                        <Reference
                                            key={reference}
                                            position={i}
                                            event={event}
                                            reference={reference}
                                            activations={activations}
                                            max={getMax(event)}
                                        />
                                    ),
                                )}
                            </PaginatedList>
                        )}
                    </Stack>
                ))}
            </TabsLayout>
        </PageLayout>
    );
};

export default Events;
