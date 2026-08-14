import { DateTime, Interval } from "luxon";
import React from "react";
import { ScrollView, View } from "react-native";
import { StyleSheet } from "react-native-unistyles";
import { activationProgress, sessionChipLabel, sessionName, templates } from "../../utils/session";
import { useStore } from "../../utils/store";
import { Button } from "../../ui/button";
import { showDialog } from "../../ui/dialog";
import { Icon } from "../../ui/icon";
import { Typography } from "../../ui/typography";
import { useActiveSession } from "../../utils/use-session";
import { QSO, useQsos } from "../qso";
import { Stack } from "../stack";
import { SessionFieldModal } from "./session-field-modal";
import { SessionModal } from "./session-modal";

const styles = StyleSheet.create((theme) => ({
    bar: {
        backgroundColor: theme.colours.primary.lighter,
        paddingLeft: theme.margins.md,
        paddingRight: theme.margins.md,
        paddingTop: theme.margins.sm,
        paddingBottom: theme.margins.sm,
    },
    chips: {
        flexGrow: 0,
    },
}));

const elapsed = (from: DateTime, to: DateTime): string => {
    const { hours = 0, minutes = 0 } = Interval.fromDateTimes(from, to).toDuration(["hours", "minutes"]).toObject();
    return `${Math.floor(hours)}h${String(Math.floor(minutes)).padStart(2, "0")}`;
};

// Always on screen, pinned above the input bar: the old contest mode was a switch buried in the
// settings with nothing to show for itself, and "am I in it, and what is it doing" has to be
// answerable without leaving the log.
export const SessionBar = () => {
    const session = useActiveSession();
    const qsos = useQsos();
    const endSession = useStore((state) => state.endSession);

    const [modalOpen, setModalOpen] = React.useState<boolean>(false);
    const [editField, setEditField] = React.useState<keyof QSO | undefined>(undefined);

    // Only ticks while something is running, and only every half minute: the readout is in minutes.
    const [now, setNow] = React.useState<DateTime>(DateTime.utc());
    React.useEffect(() => {
        if (!session) return;
        const timer = setInterval(() => setNow(DateTime.utc()), 30000);
        return () => clearInterval(timer);
    }, [session]);

    const handleStop = async () => {
        if (!session) return;
        const confirmed = await showDialog({
            title: `End ${sessionName(session)}?`,
            icon: "question",
            text: "New QSOs will stop picking up its settings. The session stays in your history.",
            confirmButtonText: "End it",
            cancelButtonText: "Keep going",
        });
        if (confirmed) endSession(session.id);
    };

    // Nothing at all when nothing is running: starting one lives in the input bar, where it costs no
    // height. See SessionStartButton.
    if (!session) return null;

    const { count, target, status } = activationProgress(session, qsos);

    return (
        <>
            <Stack style={styles.bar}>
                <Stack direction="row">
                    <Icon name={templates[session.template].icon} />
                    <Typography variant="em" numberOfLines={1} style={{ flexGrow: 1 }}>
                        {sessionName(session)}
                    </Typography>
                    <Typography variant="subtitle">
                        {target ? `${count}/${target}` : `${count} QSO`}
                        {status === "Activated" ? " ✓" : ""}
                    </Typography>
                    <Typography variant="subtitle">{elapsed(session.startedAt, now)}</Typography>
                    {session.contest && <Typography variant="subtitle">#{session.contest.serial}</Typography>}
                    <View>
                        <Button variant="chip" startIcon="create" onPress={() => setModalOpen(true)} />
                    </View>
                    <View>
                        <Button variant="chip" colour="secondary" startIcon="stop" onPress={handleStop} />
                    </View>
                </Stack>
                <ScrollView horizontal style={styles.chips} showsHorizontalScrollIndicator={false}>
                    <Stack direction="row">
                        {session.fields.map((field) => (
                            <View key={field}>
                                <Button
                                    variant="chip"
                                    numberOfLines={1}
                                    colour={session.defaults[field] === undefined ? "grey" : "primary"}
                                    text={sessionChipLabel(field, session.defaults[field])}
                                    onPress={() => setEditField(field)}
                                />
                            </View>
                        ))}
                    </Stack>
                </ScrollView>
            </Stack>
            <SessionModal open={modalOpen} session={session} onClose={() => setModalOpen(false)} />
            <SessionFieldModal session={session} field={editField} onClose={() => setEditField(undefined)} />
        </>
    );
};
