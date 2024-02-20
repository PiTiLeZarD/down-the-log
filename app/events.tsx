import React from "react";
import { Switch } from "react-native-gesture-handler";
import { PageLayout } from "./lib/components/page-layout";
import { useQsos } from "./lib/components/qso";
import { Reference } from "./lib/components/reference";
import { Stack } from "./lib/components/stack";
import { TabsLayout } from "./lib/components/tabs-layout";
import { unique } from "./lib/utils/arrays";
import { EventType, eventDataMassageMap, events, getActivations } from "./lib/utils/event-rules";
import { downloadQsos } from "./lib/utils/file-format";
import { Button } from "./lib/utils/theme/components/button";
import { PaginatedList } from "./lib/utils/theme/components/paginated-list";
import { Typography } from "./lib/utils/theme/components/typography";

export type EventsProps = {};

export type EventsComponent = React.FC<EventsProps>;

const Events: EventsComponent = (): JSX.Element => {
    const qsos = useQsos();
    const [wwffLocal, setWwffLocal] = React.useState<boolean>(false);
    const getMax = (event: EventType) => (event === "wwff" && wwffLocal ? 10 : undefined);

    const handleDownloadHunting = (event: EventType) => () =>
        downloadQsos(
            `${event}_hunting.adif`,
            qsos.filter((q) => !!q[event]),
            "adif",
            eventDataMassageMap[event],
        );

    return (
        <PageLayout title="Events">
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
                        <Typography variant="h3">Hunting</Typography>
                        <Button
                            startIcon="download"
                            text={`Hunting ADIF (${unique(qsos.filter((q) => !!q[event]).map((q) => q[event])).length})`}
                            onPress={handleDownloadHunting(event)}
                        />
                        <Typography variant="h3">Activating</Typography>
                        <PaginatedList itemsPerPage={6}>
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
                    </Stack>
                ))}
            </TabsLayout>
        </PageLayout>
    );
};

export default Events;
