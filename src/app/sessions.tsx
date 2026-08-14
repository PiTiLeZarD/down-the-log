import { useRouter } from "expo-router";
import { View } from "react-native";
import { useUnistyles } from "react-native-unistyles";
import { Grid } from "../lib/components/grid";
import { PageLayout } from "../lib/components/page-layout";
import { QSO, useQsos } from "../lib/components/qso";
import { Stack } from "../lib/components/stack";
import { eventDataMassageMap } from "../lib/utils/event-rules";
import { downloadQsos } from "../lib/utils/file-format";
import {
    Session,
    activationProgress,
    resumedSession,
    sessionLabel,
    sessionName,
    sessionQsos,
    templates,
} from "../lib/utils/session";
import { useStore } from "../lib/utils/store";
import { Button } from "../lib/ui/button";
import { showDialog } from "../lib/ui/dialog";
import { PaginatedList } from "../lib/ui/paginated-list";
import { Typography } from "../lib/ui/typography";
import { useSessions } from "../lib/utils/use-session";
import { useSettings } from "../lib/utils/use-settings";

const SessionRow = ({ position, session, qsos }: { position: number; session: Session; qsos: QSO[] }) => {
    const { theme } = useUnistyles();
    const settings = useSettings();
    const startSession = useStore((state) => state.startSession);
    const deleteSession = useStore((state) => state.deleteSession);
    const updateFilters = useStore((state) => state.updateFilters);
    const { navigate } = useRouter();

    const mine = sessionQsos(qsos, session);
    const { count, target, status } = activationProgress(session, qsos);
    const { event, contest, label } = templates[session.template];
    const dateFormat = settings.datemonth ? "MM-dd-yyyy HH:mm" : "dd/MM/yyyy HH:mm";

    const handleShow = () => {
        updateFilters([{ name: "session", values: [sessionLabel(session)] }]);
        navigate("/");
    };
    const handleExport = () =>
        downloadQsos(
            `${sessionName(session).replace(/[^\w-]+/g, "_")}_${session.startedAt.toFormat("yyyyMMdd")}.${contest ? "cab" : "adif"}`,
            mine,
            contest ? "cabrillo" : "adif",
            event ? eventDataMassageMap[event] : undefined,
        );
    const handleDelete = async () => {
        const confirmed = await showDialog({
            title: `Forget ${sessionName(session)}?`,
            icon: "question",
            text: "Its QSOs stay in your log — only the session's settings are dropped.",
            confirmButtonText: "Forget it",
            cancelButtonText: "Cancel",
            confirmColour: "danger",
        });
        if (confirmed) deleteSession(session.id);
    };

    return (
        <View
            style={{
                padding: theme.margins.lg,
                borderRadius: theme.margins.lg,
                backgroundColor: theme.colours.grey[theme.rowShade(!!(position % 2))],
            }}
        >
            <Grid container>
                <Grid item xs={8} md={5}>
                    <Stack direction="row">
                        <Typography variant="em" numberOfLines={1}>
                            {sessionName(session)}
                        </Typography>
                        {!session.endedAt && <Typography variant="subtitle">running</Typography>}
                    </Stack>
                    <Typography variant="subtitle">
                        {label} · {session.startedAt.toFormat(dateFormat)}
                    </Typography>
                </Grid>
                <Grid item xs={4} md={3}>
                    <Typography>
                        {target ? `${count}/${target}` : `${count} QSO`}
                        {status ? ` · ${status}` : ""}
                    </Typography>
                </Grid>
                <Grid item xs={4} md={2}>
                    <View style={{ alignItems: "flex-start" }}>
                        <Button variant="chip" endIcon="search" text="Show" onPress={handleShow} />
                    </View>
                </Grid>
                <Grid item xs={8} md={2}>
                    <Stack direction="row" style={{ justifyContent: "flex-end" }}>
                        <View>
                            <Button
                                variant="chip"
                                colour="secondary"
                                startIcon="download"
                                text={contest ? "Cabrillo" : "ADIF"}
                                onPress={handleExport}
                            />
                        </View>
                        <View>
                            <Button
                                variant="chip"
                                colour="grey"
                                startIcon="play"
                                onPress={() => startSession(resumedSession(session))}
                            />
                        </View>
                        <View>
                            <Button variant="chip" colour="grey" startIcon="trash" onPress={handleDelete} />
                        </View>
                    </Stack>
                </Grid>
            </Grid>
        </View>
    );
};

const Sessions = () => {
    const sessions = useSessions();
    const qsos = useQsos();

    return (
        <PageLayout title="Sessions">
            <Typography variant="subtitle">
                Every outing you've logged under a session. Starting one again reuses its settings on a fresh
                activation — the QSOs stay with the session that logged them.
            </Typography>
            <PaginatedList whenEmpty={<Typography>No sessions yet — start one from the log screen.</Typography>}>
                {sessions.map((session, i) => (
                    <SessionRow key={session.id} position={i} session={session} qsos={qsos} />
                ))}
            </PaginatedList>
        </PageLayout>
    );
};

export default Sessions;
