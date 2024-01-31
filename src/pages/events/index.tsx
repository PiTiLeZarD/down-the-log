import { StackScreenProps } from "@react-navigation/stack";
import React from "react";
import { NavigationParamList } from "../../Navigation";
import { downloadQsos } from "../../utils/adif";
import { PageLayout } from "../../utils/page-layout";
import { useQsos } from "../../utils/qso";
import { Stack } from "../../utils/stack";
import { TabsLayout } from "../../utils/tabs-layout";
import { Button } from "../../utils/theme/components/button";
import { PaginatedList } from "../../utils/theme/components/paginated-list";
import { Typography } from "../../utils/theme/components/typography";
import { Reference } from "./reference";
import { EventType, allReferencesActivated, events } from "./rules";

export type EventsProps = {} & StackScreenProps<NavigationParamList, "Events">;

export type EventsComponent = React.FC<EventsProps>;

export const Events: EventsComponent = (): JSX.Element => {
    const qsos = useQsos();

    const handleDownloadHunting = (event: EventType) => () =>
        downloadQsos(
            `${event}_hunting.adif`,
            qsos.filter((q) => !!q[event]),
        );

    return (
        <PageLayout title="Events">
            <Typography variant="subtitle">
                Everything is work in progress here, but you'll be able to handle any event and files here at some point
            </Typography>
            <TabsLayout tabs={Array.from(events).map((t) => t.toUpperCase())}>
                {Array.from(events).map((event) => (
                    <Stack key={event}>
                        <Typography variant="h3">Hunting</Typography>
                        <Button startIcon="download" text="Hunting ADIF" onPress={handleDownloadHunting(event)} />
                        <Typography variant="h3">Activating</Typography>
                        <PaginatedList>
                            {allReferencesActivated(qsos, event).map((reference) => (
                                <Reference key={reference} reference={reference} event={event} />
                            ))}
                        </PaginatedList>
                    </Stack>
                ))}
            </TabsLayout>
        </PageLayout>
    );
};
