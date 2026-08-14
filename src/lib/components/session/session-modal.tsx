import React, { useEffectEvent } from "react";
import { FormProvider, useForm } from "react-hook-form";
import { ScrollView, View, useWindowDimensions } from "react-native";
import { StyleSheet } from "react-native-unistyles";
import { band2freq } from "../../data/bands";
import { Modal } from "../../utils/modal";
import {
    Session,
    SessionTemplate,
    carryOverFields,
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

/**
 * Band was the field a session held before the frequency became the thing you set, and sessions
 * saved back then still list it. One control covers both, so a session naming both would draw it
 * twice; swapping band out for frequency as the session is saved is what eventually retires it.
 */
const migrateFields = (fields: (keyof QSO)[]): (keyof QSO)[] =>
    fields.includes("band")
        ? Array.from(new Set(fields.map((f) => (f === "band" ? "frequency" : f))))
        : fields;

const drawnFields = (fields: (keyof QSO)[]) => migrateFields(fields);

// The frequency box carries the band in front of it and the unit behind it, so it reads badly
// squeezed into half a column. It gets a row to itself.
const fieldSpan = (field: keyof QSO) => (field === "frequency" ? 12 : 6);

// A session saved before frequency was the field holds a band and no frequency, and the box would
// open empty on it. Start it where that band starts, the way the old picker would have.
const seedFrequency = (defaults: Partial<QSO>): Partial<QSO> =>
    defaults.band && defaults.frequency === undefined
        ? { ...defaults, frequency: band2freq(defaults.band, defaults.mode) }
        : defaults;

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
        if (session) return seedFrequency(session.defaults);
        const base = prefillMyStation({} as QSO, myStationFromSettings(settings, currentLocation));
        // Minus what the last QSO's own session was activating: a new session starts on a new park,
        // and seeding it with the one just finished is worse than seeding it with nothing.
        return seedFrequency(
            qsos.length ? carryOver(base, qsos[0], carryOverFields(settings.carryOver, qsos[0])) : base,
        );
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

    // Taking up the cross reference offered next to a park adds its field to the session, right
    // below the one that offered it: the value is already in the form, but a field the session
    // doesn't hold is neither drawn nor collected, so the press looked like it did nothing.
    const addCrossField = (source: keyof QSO, filled: keyof QSO) =>
        setFields((current) =>
            current.includes(filled)
                ? current
                : current.flatMap((f) => (f === source ? [f, filled] : [f])),
        );

    const collect = (): Partial<QSO> => {
        const values = methods.getValues();
        return Object.fromEntries(
            migrateFields(fields)
                .map((f) => [f, values[f]])
                .filter(([, v]) => v !== undefined && v !== "" && v !== null),
        );
    };

    const contestPart = () =>
        templates[template].contest
            ? { contest: { contestId: contestId || undefined, serial: +serial || 1, exchangeSent: exchangeSent || undefined } }
            : {};

    const handleSubmit = () => {
        // Saved with the migrated list, not the one that was loaded: a session that still named
        // `band` would otherwise show a chip for a field nothing writes any more.
        const saved = migrateFields(fields);
        if (session) updateSession(session.id, { name, fields: saved, defaults: collect(), ...contestPart() });
        else startSession({ ...newSession(template, collect()), name, fields: saved, ...contestPart() });
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
                                        <SessionField field={field} onCrossFill={addCrossField} />
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
