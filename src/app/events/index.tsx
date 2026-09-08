import { useRouter } from "expo-router";
import React from "react";
import { View } from "react-native";
import { StyleSheet } from "react-native-unistyles";
import { PageLayout } from "../../lib/components/page-layout";
import { QSO, useQsos } from "../../lib/components/qso";
import { Stack } from "../../lib/components/stack";
import { EventSectionDef, eventSections } from "../../lib/components/events/sections";
import { Button } from "../../lib/ui/button";
import { Icon } from "../../lib/ui/icon";
import { Typography } from "../../lib/ui/typography";
import { EventType, capitalise, events } from "../../lib/utils/event-rules";
import { tileOf } from "../../lib/utils/tota";
import { useSessions } from "../../lib/utils/use-session";

const styles = StyleSheet.create((theme) => ({
    sectionButton: {
        backgroundColor: theme.colours.primary.lighter,
        paddingTop: theme.margins.xl,
        paddingBottom: theme.margins.xl,
    },
    sectionRow: {
        width: "100%",
    },
    sectionText: {
        flexGrow: 1,
        flexShrink: 1,
    },
}));

const plural = (count: number, noun: string) => `${count} ${noun}${count === 1 ? "" : "s"}`;

// One walk of the log for every section's count. Each one is a set of what has been activated, which
// is all the list needs to say — the sections themselves do the real work of scoring it.
const useSectionCounts = (): Record<string, string | undefined> => {
    const qsos = useQsos();
    const sessions = useSessions();

    return React.useMemo(() => {
        const references = Object.fromEntries(events.map((event) => [event, new Set<string>()])) as Record<
            EventType,
            Set<string>
        >;
        const tiles = new Set<string>();

        for (const qso of qsos) {
            for (const event of events) {
                const reference = qso[`my${capitalise(event)}` as keyof QSO];
                if (reference) references[event].add(String(reference));
            }
            const tile = tileOf(qso);
            if (tile) tiles.add(tile);
        }

        return {
            sessions: sessions.length ? plural(sessions.length, "session") : undefined,
            tiles: tiles.size ? plural(tiles.size, "tile") : undefined,
            ...Object.fromEntries(
                events.map((event) => [
                    event,
                    references[event].size ? plural(references[event].size, "reference") : undefined,
                ]),
            ),
        };
    }, [qsos, sessions.length]);
};

const SectionButton = ({ section, count }: { section: EventSectionDef; count?: string }) => {
    const { navigate } = useRouter();

    return (
        <Button style={styles.sectionButton} onPress={() => navigate(`/events/${section.value}`)}>
            <Stack direction="row" gap="lg" style={styles.sectionRow}>
                <Icon name={section.icon} size={26} />
                <View style={styles.sectionText}>
                    <Typography variant="h4">{section.label}</Typography>
                    <Typography variant="subtitle">{section.description}</Typography>
                </View>
                {!!count && <Typography variant="subtitle">{count}</Typography>}
                <Icon name="chevron-forward" size={20} />
            </Stack>
        </Button>
    );
};

// The programs used to be tabs across the top of one screen, five of them squeezed onto a phone and
// POTA always the one showing. A section is picked here instead: nothing is assumed to be the one
// the operator cares about, and Sessions and Tiles fit in the same list without crowding it.
const Events = () => {
    const counts = useSectionCounts();

    return (
        <PageLayout title="Events">
            <Stack gap="lg">
                {eventSections.map((section) => (
                    <SectionButton key={section.value} section={section} count={counts[section.value]} />
                ))}
            </Stack>
        </PageLayout>
    );
};

export default Events;
