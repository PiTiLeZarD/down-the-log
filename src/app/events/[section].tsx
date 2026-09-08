import { Redirect, useLocalSearchParams } from "expo-router";
import { Switch } from "react-native-gesture-handler";
import { EventActivations } from "../../lib/components/events/event-activations";
import { eventOfSection, findEventSection } from "../../lib/components/events/sections";
import { PageLayout } from "../../lib/components/page-layout";
import { BackfillButton } from "../../lib/components/session/backfill-button";
import { SessionsList } from "../../lib/components/session/sessions-list";
import { Stack } from "../../lib/components/stack";
import { TotaActivations, TotaViewToggle } from "../../lib/components/tota-activations";
import { Typography } from "../../lib/ui/typography";
import { useStore } from "../../lib/utils/store";
import { useSettings } from "../../lib/utils/use-settings";

// One section of the Events screen, picked from the list at /events. Each one owns whatever controls
// belong next to its title: the map switch is only about references on a map, and the backfill offer
// only makes sense where the sessions it would make are listed.
const EventSection = () => {
    const { section: param } = useLocalSearchParams<{ section: string }>();
    const section = findEventSection(param);
    const showMap = useSettings().eventsMap;
    const updateSetting = useStore((state) => state.updateSetting);

    // A hand-typed or stale URL — the old /events?tab=… links included — lands back on the list.
    if (!section) return <Redirect href="/events" />;

    const event = eventOfSection(section.value);

    return (
        <PageLayout
            title={
                <Stack direction="row" gap="md">
                    <Typography variant="h1" style={{ flexGrow: 1 }}>
                        {section.label}
                    </Typography>
                    {section.value === "sessions" && <BackfillButton />}
                    {section.value === "tiles" && <TotaViewToggle />}
                    {!!event && (
                        <>
                            <Typography>List</Typography>
                            <Switch value={showMap} onValueChange={(v) => updateSetting("eventsMap", v)} />
                            <Typography>Map</Typography>
                        </>
                    )}
                </Stack>
            }
        >
            {section.value === "sessions" && <SessionsList />}
            {section.value === "tiles" && <TotaActivations />}
            {!!event && <EventActivations event={event} />}
        </PageLayout>
    );
};

export default EventSection;
