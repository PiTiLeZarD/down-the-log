import { StackScreenProps } from "@react-navigation/stack";
import React from "react";
import { NavigationParamList } from "../../Navigation";
import { downloadQsos } from "../../utils/adif";
import { PageLayout } from "../../utils/page-layout";
import { useQsos } from "../../utils/qso";
import { Stack } from "../../utils/stack";
import { TabsLayout } from "../../utils/tabs-layout";
import { Button } from "../../utils/theme/components/button";
import { Typography } from "../../utils/theme/components/typography";
import { Reference } from "./reference";
import { EventType, eventDataMassageMap, events, getActivations } from "./rules";

export type EventsProps = {} & StackScreenProps<NavigationParamList, "Events">;

export type EventsComponent = React.FC<EventsProps>;

export const Events: EventsComponent = (): JSX.Element => {
    const qsos = useQsos();

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
                        <Typography variant="h3">Hunting</Typography>
                        <Button startIcon="download" text="Hunting ADIF" onPress={handleDownloadHunting(event)} />
                        <Typography variant="h3">Activating</Typography>
                        {Object.entries(getActivations(event, qsos)).map(([reference, activations], i) => (
                            <Reference position={i} event={event} reference={reference} activations={activations} />
                        ))}
                    </Stack>
                ))}
            </TabsLayout>
        </PageLayout>
    );
};
