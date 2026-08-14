import React, { useEffectEvent } from "react";
import { FormProvider, useForm } from "react-hook-form";
import { ScrollView, View, useWindowDimensions } from "react-native";
import { StyleSheet } from "react-native-unistyles";
import { Modal } from "../../utils/modal";
import {
    Session,
    SessionTemplate,
    newSession,
    resumedSession,
    sessionFieldLabel,
    sessionFields,
    sessionName,
    sessionTemplates,
    templates,
} from "../../utils/session";
import { useStore } from "../../utils/store";
import { Button } from "../../ui/button";
import { Input } from "../../ui/input";
import { Typography } from "../../ui/typography";
import { useSessions } from "../../utils/use-session";
import { useSettings } from "../../utils/use-settings";
import { Grid } from "../grid";
import { QSO, carryOver, myStationFromSettings, prefillMyStation, useQsos } from "../qso";
import { Stack } from "../stack";
import { SessionField } from "./session-field";

const styles = StyleSheet.create((theme) => ({
    body: {
        backgroundColor: theme.background,
        padding: theme.margins.lg,
        borderRadius: theme.margins.lg,
    },
    // Capped in pixels rather than by flex or a percentage: the modal's Grid item is laid out by
    // width and carries no height of its own, so there's nothing for either to resolve against —
    // the bottom of a long field list ran off the screen instead of scrolling.
    scroll: (maxHeight: number) => ({
        maxHeight,
    }),
}));

// Room for the header row and the body's own padding, so the scroll area stops short of the edge.
const HEADER_ALLOWANCE = 100;

// The frequency input writes both halves of the pair, so a session holding band and frequency would
// otherwise draw two identical controls.
const drawnFields = (fields: (keyof QSO)[]) =>
    fields.filter((f) => !(f === "frequency" && fields.includes("band")));

// Band and frequency share one control with three boxes in it, which is unreadable squeezed into
// half a column — the band picker was down to a couple of characters. It gets a row to itself.
const fieldSpan = (field: keyof QSO) => (field === "band" || field === "frequency" ? 12 : 6);

export type SessionModalProps = {
    open: boolean;
    // The session being edited. Absent means this is the "start a new one" flow.
    session?: Session;
    onClose: () => void;
};

export const SessionModal = ({ open, session, onClose }: SessionModalProps) => {
    const settings = useSettings();
    const qsos = useQsos();
    const { height } = useWindowDimensions();
    const recent = useSessions().slice(0, 3);
    const currentLocation = useStore((state) => state.currentLocation);
    const startSession = useStore((state) => state.startSession);
    const updateSession = useStore((state) => state.updateSession);

    const [template, setTemplate] = React.useState<SessionTemplate>(session?.template || "pota");
    const [name, setName] = React.useState<string>(session?.name || "");
    const [fields, setFields] = React.useState<(keyof QSO)[]>(session?.fields || templates[template].fields);
    const [contestId, setContestId] = React.useState<string>(session?.contest?.contestId || "");
    const [serial, setSerial] = React.useState<string>(String(session?.contest?.serial || 1));
    const [exchangeSent, setExchangeSent] = React.useState<string>(session?.contest?.exchangeSent || "");

    // A new session opens on what the operator is already using — their settings, and the last QSO's
    // carried-over values — so the common case is picking a template, typing the reference, Start.
    const seed = (): Partial<QSO> => {
        if (session) return session.defaults;
        const base = prefillMyStation({} as QSO, myStationFromSettings(settings, currentLocation));
        return qsos.length ? carryOver(base, qsos[0], settings.carryOver) : base;
    };

    const methods = useForm<QSO>({ defaultValues: seed() as QSO });

    // Reopening has to start from the session as it is now, not from whatever was typed and
    // abandoned the last time the modal was up.
    const [renderedFor, setRenderedFor] = React.useState<boolean>(open);
    if (renderedFor !== open) {
        setRenderedFor(open);
        if (open) {
            setTemplate(session?.template || "pota");
            setName(session?.name || "");
            setFields(session?.fields || templates[session?.template || "pota"].fields);
            setContestId(session?.contest?.contestId || "");
            setSerial(String(session?.contest?.serial || 1));
            setExchangeSent(session?.contest?.exchangeSent || "");
        }
    }
    // The form is the one part that can't be resynced alongside them: `reset` notifies every
    // subscribed field, and firing that from a render pass updates them from inside this one.
    const reopen = useEffectEvent(() => methods.reset(seed() as QSO));
    React.useEffect(() => {
        if (open) reopen();
    }, [open]);

    const pickTemplate = (next: SessionTemplate) => {
        setTemplate(next);
        // Only for a new session: swapping the template of a running one would throw away the field
        // list the operator has tuned.
        if (!session) setFields(templates[next].fields);
    };

    const toggleField = (field: keyof QSO) =>
        setFields(fields.includes(field) ? fields.filter((f) => f !== field) : [...fields, field]);

    const collect = (): Partial<QSO> => {
        const values = methods.getValues();
        return Object.fromEntries(
            fields
                .map((f) => [f, values[f]])
                .filter(([, v]) => v !== undefined && v !== "" && v !== null),
        );
    };

    const contestPart = () =>
        templates[template].contest
            ? { contest: { contestId: contestId || undefined, serial: +serial || 1, exchangeSent: exchangeSent || undefined } }
            : {};

    const handleSubmit = () => {
        if (session) updateSession(session.id, { name, fields, defaults: collect(), ...contestPart() });
        else startSession({ ...newSession(template, collect()), name, fields, ...contestPart() });
        onClose();
    };

    return (
        <Modal wide open={open} onClose={onClose}>
            <View style={styles.body}>
                {/* Outside the ScrollView: the way out of a long form has to stay put. */}
                <Stack direction="row">
                    <Typography variant="h3" style={{ flexGrow: 1 }}>
                        {session ? "Edit session" : "Start a session"}
                    </Typography>
                    <View>
                        <Button variant="chip" colour="grey" startIcon="close" onPress={onClose} />
                    </View>
                </Stack>
                <ScrollView style={styles.scroll(height - HEADER_ALLOWANCE)}>
                    <Stack>
                        {/* Going back out to the same park next weekend is one press, not a form to
                            fill in again. Only offered for a new session — there's nothing to
                            resume into one that's already running. */}
                        {!session && recent.length > 0 && (
                            <>
                                <Typography>Again:</Typography>
                                <Grid container>
                                    {recent.map((s) => (
                                        <Grid item xs={6} md={4} key={s.id}>
                                            <Button
                                                variant="outlined"
                                                colour="grey"
                                                startIcon={templates[s.template].icon}
                                                text={sessionName(s)}
                                                numberOfLines={1}
                                                onPress={() => {
                                                    startSession(resumedSession(s));
                                                    onClose();
                                                }}
                                            />
                                        </Grid>
                                    ))}
                                </Grid>
                            </>
                        )}

                        <Typography>Type:</Typography>
                        {/* Label only. With an icon in front the six of them no longer fit on one
                            row and the last two were clipped. */}
                        <Grid container>
                            {sessionTemplates.map((t) => (
                                <Grid item xs={4} md={2} key={t}>
                                    <Button
                                        text={templates[t].label}
                                        numberOfLines={1}
                                        variant={t === template ? "contained" : "outlined"}
                                        onPress={() => pickTemplate(t)}
                                    />
                                </Grid>
                            ))}
                        </Grid>

                        <Typography>Name:</Typography>
                        <Input
                            value={name}
                            onChangeText={setName}
                            placeholder={templates[template].label}
                        />

                        {templates[template].contest && (
                            <Grid container>
                                <Grid item xs={12} md={6}>
                                    <Stack>
                                        <Typography>Contest:</Typography>
                                        <Input
                                            value={contestId}
                                            onChangeText={(v) => setContestId(v.toUpperCase())}
                                            placeholder="CQ-WW-SSB"
                                        />
                                    </Stack>
                                </Grid>
                                <Grid item xs={6} md={3}>
                                    <Stack>
                                        <Typography>Next serial:</Typography>
                                        <Input numeric value={serial} onChangeText={setSerial} />
                                    </Stack>
                                </Grid>
                                <Grid item xs={6} md={3}>
                                    <Stack>
                                        <Typography>Exchange sent:</Typography>
                                        <Input
                                            value={exchangeSent}
                                            onChangeText={(v) => setExchangeSent(v.toUpperCase())}
                                        />
                                    </Stack>
                                </Grid>
                            </Grid>
                        )}

                        <Typography variant="h4" underline>
                            Applied to every QSO
                        </Typography>
                        <FormProvider {...methods}>
                            <Grid container>
                                {drawnFields(fields).map((field) => (
                                    <Grid item xs={12} md={fieldSpan(field)} key={field}>
                                        <SessionField field={field} />
                                    </Grid>
                                ))}
                            </Grid>
                        </FormProvider>

                        <Typography variant="subtitle">
                            Anything ticked below is set once here and written onto every QSO logged in the session.
                            You can still change it on a single QSO afterwards.
                        </Typography>
                        <Grid container>
                            {sessionFields.map((field) => (
                                <Grid item xs={6} md={3} key={field}>
                                    <Button
                                        variant="chip"
                                        numberOfLines={1}
                                        colour={fields.includes(field) ? "primary" : "grey"}
                                        text={sessionFieldLabel(field)}
                                        onPress={() => toggleField(field)}
                                    />
                                </Grid>
                            ))}
                        </Grid>

                        <Button
                            colour="success"
                            startIcon={session ? "checkmark" : "play"}
                            text={session ? "Save" : "Start"}
                            onPress={handleSubmit}
                        />
                    </Stack>
                </ScrollView>
            </View>
        </Modal>
    );
};
