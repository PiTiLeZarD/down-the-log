import React from "react";
import { FormProvider, useForm, useWatch } from "react-hook-form";
import { View } from "react-native";
import { StyleSheet } from "react-native-unistyles";
import { EventType, capitalise } from "../../utils/event-rules";
import { Modal } from "../../utils/modal";
import { SelfSpotTarget, SpotResult, postSpot, selfSpotTargets, spotSourceLabels } from "../../utils/spots";
import { useStore } from "../../utils/store";
import { useActiveSession } from "../../utils/use-session";
import { useSettings } from "../../utils/use-settings";
import { Alert } from "../../ui/alert";
import { Button } from "../../ui/button";
import { Input } from "../../ui/input";
import { Typography } from "../../ui/typography";
import { BandFreqInput } from "../form/band-freq-input";
import { ModeInput } from "../form/mode-input";
import { QSO, useQsos } from "../qso";
import { Stack } from "../stack";

const styles = StyleSheet.create((theme) => ({
    modal: {
        backgroundColor: theme.background,
        padding: theme.margins.xxl,
        borderRadius: theme.margins.md,
    },
    label: {
        width: 90,
    },
}));

// The activation references on our own side of a QSO, and on the worked station's side, with the
// award each belongs to.
const myReferenceFields: [keyof QSO, EventType][] = [
    ["myPota", "pota"],
    ["myWwff", "wwff"],
    ["mySota", "sota"],
    ["myIota", "iota"],
    ["mySigInfo", "sig"],
];
const theirReferenceFields: [keyof QSO, EventType][] = [
    ["pota", "pota"],
    ["wwff", "wwff"],
    ["sota", "sota"],
    ["iota", "iota"],
    ["sigInfo", "sig"],
];

export type SpotReference = { programme: EventType; reference: string };

const referencesFrom =
    (fields: [keyof QSO, EventType][]) =>
    (source?: Partial<QSO>): SpotReference[] =>
        !source
            ? []
            : fields
                  .filter(([field]) => !!source[field])
                  .map(([field, programme]) => ({ programme, reference: source[field] as string }));

// What we are activating right now, in the order the operator is most likely to mean: the running
// session knows, and failing that the last QSO logged does.
export const selfSpotReferences = referencesFrom(myReferenceFields);
// What the station we worked was activating — the reference a spot for them has to carry.
export const stationReferences = referencesFrom(theirReferenceFields);

// The awards a spot can be posted for. IOTA is left out: neither network takes one.
const spottableProgrammes: EventType[] = ["pota", "wwff", "sota"];

export type SpotModalProps = {
    open: boolean;
    onClose: () => void;
    // The station being spotted. Left out, the modal opens on the operator's own activation and can
    // be switched to another station, whose callsign and reference are then typed in.
    station?: QSO;
};

export const SpotModal = ({ open, onClose, station }: SpotModalProps) => {
    const settings = useSettings();
    const updateSetting = useStore((state) => state.updateSetting);
    const session = useActiveSession();
    const qsos = useQsos();
    const last = qsos[0];

    // "me" spots our own activation off the running session. "other" spots somebody else: filled in
    // from the QSO or spot we were opened with, or typed from scratch when we were opened bare —
    // hearing an unspotted activator is exactly when a chaser reaches for this.
    const [subject, setSubject] = React.useState<"me" | "other">(station ? "other" : "me");
    const [callsign, setCallsign] = React.useState<string>("");
    const [typedReference, setTypedReference] = React.useState<string>("");
    const [typedProgramme, setTypedProgramme] = React.useState<EventType>("pota");
    const [chosen, setChosen] = React.useState<string | undefined>(undefined);
    const [comments, setComments] = React.useState<string>("");
    const [sending, setSending] = React.useState<boolean>(false);
    const [results, setResults] = React.useState<SpotResult[] | undefined>(undefined);

    // The frequency and mode boxes are the log screen's own, and both read the form rather than
    // props, so the modal stands a form up for them: retuning here behaves exactly like retuning
    // there — kHz, the band derived in front of it, the favourite modes behind the star.
    const methods = useForm<QSO>({ defaultValues: {} });
    const frequency = useWatch({ control: methods.control, name: "frequency" });
    const mode = useWatch({ control: methods.control, name: "mode" });

    // References we already know about: ours from the session, theirs from the QSO or spot we were
    // handed. Typing one in is the fallback, not the norm.
    const known = React.useMemo(
        () =>
            subject === "other"
                ? stationReferences(station)
                : [...selfSpotReferences(session?.defaults), ...selfSpotReferences(last)],
        [subject, station, session?.defaults, last],
    );
    // De-duplicated by reference, so a park held by both the session and the last QSO is offered once.
    const options = known.filter((option, index) => known.findIndex((o) => o.reference === option.reference) === index);
    const typing = subject === "other" && !options.length;

    // Opening the modal re-reads the radio: the frequency and mode being spotted are whatever the
    // session, the QSO or the last contact says now, not what they said the last time it was opened.
    const [openedWith, setOpenedWith] = React.useState<boolean>(open);
    if (openedWith !== open) {
        setOpenedWith(open);
        if (open) {
            methods.reset({
                // Spotting somebody else: where they were when we heard them. Spotting ourselves:
                // what the radio is on, and failing that the first favourite, since on a summit the
                // mode is usually the one thing that hasn't changed since the last outing.
                frequency: station ? station.frequency : (session?.defaults.frequency ?? last?.frequency),
                mode: station
                    ? station.mode
                    : (session?.defaults.mode ?? last?.mode ?? settings.favouriteModes[0] ?? "SSB"),
            });
            setSubject(station ? "other" : "me");
            setCallsign(station?.callsign || "");
            setTypedReference("");
            setChosen(undefined);
            setComments("");
            setResults(undefined);
        }
    }

    // Whichever list is in play, something has to be selected: the first entry, until it's changed.
    const selected = options.find((option) => option.reference === chosen) || options[0];
    const target: SpotReference | undefined = typing
        ? typedReference
            ? { programme: typedProgramme, reference: typedReference }
            : undefined
        : selected;

    const spotted = subject === "me" ? settings.myCallsign : station?.callsign || callsign;
    const canSend =
        !!settings.myCallsign && !!spotted && !!target && !!frequency && !!mode && !!settings.selfSpotTargets.length;
    const targets = settings.selfSpotTargets;

    const send = async (text: string) => {
        if (!canSend) return;
        setSending(true);
        setResults(undefined);
        const sent = await postSpot(
            targets,
            {
                callsign: spotted,
                // Whoever is on air, the spot is reported by us: on ParksnPeaks that's the account
                // the key belongs to, and POTA carries it as a field of its own.
                spotter: settings.myCallsign,
                programme: (target as SpotReference).programme,
                reference: (target as SpotReference).reference,
                frequency: frequency as number,
                mode: mode as string,
                comments: text,
            },
            settings,
        );
        setResults(sent);
        setSending(false);
    };

    const title = subject === "me" ? "Spot me" : spotted ? `Spot ${spotted}` : "Spot a station";

    return (
        <Modal open={open} onClose={onClose}>
            <Stack gap="xxl" style={styles.modal}>
                <Typography variant="h2">{title}</Typography>
                {!settings.myCallsign && <Alert severity="warning">Set your callsign in settings first.</Alert>}
                {/* Only offered when we weren't opened on a particular station: from a QSO or a spot
                    row the subject is already settled, and a toggle there would just invite mistakes. */}
                {!station && (
                    <Stack direction="row" gap="lg">
                        <View>
                            <Button
                                variant={subject === "me" ? "contained" : "chip"}
                                text="Me"
                                onPress={() => setSubject("me")}
                            />
                        </View>
                        <View>
                            <Button
                                variant={subject === "other" ? "contained" : "chip"}
                                text="Another station"
                                onPress={() => setSubject("other")}
                            />
                        </View>
                    </Stack>
                )}
                {subject === "me" && !options.length && (
                    <Alert severity="warning">
                        <Typography style={{ flexShrink: 1 }}>
                            Nothing to spot: start a POTA, WWFF or SOTA session, or log a QSO with your reference on it.
                        </Typography>
                    </Alert>
                )}
                {typing && (
                    <Stack direction="row" gap="lg">
                        <Typography style={styles.label}>Callsign:</Typography>
                        <View style={{ flexGrow: 1 }}>
                            <Input
                                value={callsign}
                                placeholder="Who you can hear"
                                onChangeText={(value) => setCallsign(value.toUpperCase())}
                            />
                        </View>
                    </Stack>
                )}
                {typing ? (
                    <Stack gap="lg">
                        <Stack direction="row" gap="lg">
                            {spottableProgrammes.map((programme) => (
                                <View key={programme}>
                                    <Button
                                        variant={typedProgramme === programme ? "contained" : "chip"}
                                        text={programme.toUpperCase()}
                                        onPress={() => setTypedProgramme(programme)}
                                    />
                                </View>
                            ))}
                        </Stack>
                        <Stack direction="row" gap="lg">
                            <Typography style={styles.label}>Reference:</Typography>
                            <View style={{ flexGrow: 1 }}>
                                <Input
                                    value={typedReference}
                                    placeholder="Park or summit they announced"
                                    onChangeText={(value) => setTypedReference(value.toUpperCase())}
                                />
                            </View>
                        </Stack>
                    </Stack>
                ) : options.length > 1 ? (
                    <Stack direction="row" gap="lg" style={{ flexWrap: "wrap" }}>
                        {options.map((option) => (
                            <View key={option.reference}>
                                <Button
                                    variant={option.reference === selected?.reference ? "contained" : "chip"}
                                    text={`${capitalise(option.programme)} ${option.reference}`}
                                    onPress={() => setChosen(option.reference)}
                                />
                            </View>
                        ))}
                    </Stack>
                ) : options.length === 1 ? (
                    <Typography variant="em">
                        {capitalise(options[0].programme)} {options[0].reference}
                    </Typography>
                ) : null}
                <FormProvider {...methods}>
                    <BandFreqInput />
                    <ModeInput />
                </FormProvider>
                <Stack>
                    <Typography>Comment:</Typography>
                    {/* Input renders its own row wrapper for the prefix and suffix, and that wrapper
                        is what has to grow — a style on the Input reaches only the box inside it. */}
                    <View style={{ flexGrow: 1 }}>
                        <Input value={comments} onChangeText={setComments} placeholder="Optional" />
                    </View>
                </Stack>
                <Stack gap="lg">
                    <Typography variant="em">Post to:</Typography>
                    <Stack direction="row" gap="lg" style={{ flexWrap: "wrap" }}>
                        {selfSpotTargets.map((option: SelfSpotTarget) => (
                            <View key={option}>
                                <Button
                                    variant={targets.includes(option) ? "contained" : "chip"}
                                    text={spotSourceLabels[option]}
                                    onPress={() =>
                                        updateSetting(
                                            "selfSpotTargets",
                                            targets.includes(option)
                                                ? targets.filter((t) => t !== option)
                                                : [...targets, option],
                                        )
                                    }
                                />
                            </View>
                        ))}
                    </Stack>
                    {!targets.length && (
                        <Typography variant="subtitle">Pick at least one network to post to.</Typography>
                    )}
                </Stack>
                {results?.map((result) => (
                    <Alert key={result.target} severity={result.ok ? "success" : "danger"}>
                        <Typography style={{ flexShrink: 1 }}>
                            {spotSourceLabels[result.target]}: {result.ok ? "spotted" : result.error}
                        </Typography>
                    </Alert>
                ))}
                <Stack direction="row" gap="lg">
                    <View style={{ flexGrow: 1 }}>
                        <Button
                            colour="success"
                            text={sending ? "Sending..." : subject === "me" ? "Spot me" : "Send spot"}
                            disabled={!canSend || sending}
                            onPress={() => void send(comments)}
                        />
                    </View>
                    <View>
                        {/* The other half of spotting: saying the frequency is free again, which is
                            the spot everybody forgets to send. */}
                        <Button
                            colour="secondary"
                            text="QRT"
                            disabled={!canSend || sending}
                            onPress={() => void send(comments ? `QRT ${comments}` : "QRT")}
                        />
                    </View>
                    <View>
                        <Button colour="grey" text="Close" onPress={onClose} />
                    </View>
                </Stack>
            </Stack>
        </Modal>
    );
};

export type SpotMeButtonProps = { compact?: boolean };

export const SpotMeButton = ({ compact }: SpotMeButtonProps) => {
    const [open, setOpen] = React.useState<boolean>(false);
    return (
        <>
            <View>
                <Button
                    variant="chip"
                    colour="secondary"
                    startIcon="megaphone"
                    text={compact ? undefined : "Spot"}
                    aria-label="Spot"
                    onPress={() => setOpen(true)}
                />
            </View>
            <SpotModal open={open} onClose={() => setOpen(false)} />
        </>
    );
};

export type SpotStationButtonProps = { qso: QSO };

/**
 * Spots the station this QSO is with. Only rendered once they have a reference on the QSO: without
 * one there is nothing either network will take, and a button that can only explain itself by
 * failing is worse than no button on a screen this full.
 */
export const SpotStationButton = ({ qso }: SpotStationButtonProps) => {
    const [open, setOpen] = React.useState<boolean>(false);
    if (!stationReferences(qso).length) return null;
    return (
        <>
            <View>
                <Button
                    variant="chip"
                    colour="secondary"
                    startIcon="megaphone"
                    aria-label={`Spot ${qso.callsign}`}
                    onPress={() => setOpen(true)}
                />
            </View>
            <SpotModal open={open} onClose={() => setOpen(false)} station={qso} />
        </>
    );
};
