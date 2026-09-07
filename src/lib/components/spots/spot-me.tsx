import React from "react";
import { FormProvider, useForm, useWatch } from "react-hook-form";
import { View } from "react-native";
import { StyleSheet } from "react-native-unistyles";
import { EventType, capitalise } from "../../utils/event-rules";
import { Modal } from "../../utils/modal";
import { SelfSpotResult, SelfSpotTarget, selfSpot, selfSpotTargets, spotSourceLabels } from "../../utils/spots";
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
}));

// The activation references on our own side of a QSO, and which award each belongs to.
const myReferenceFields: [keyof QSO, EventType][] = [
    ["myPota", "pota"],
    ["myWwff", "wwff"],
    ["mySota", "sota"],
    ["myIota", "iota"],
    ["mySigInfo", "sig"],
];

export type SelfSpotReference = { programme: EventType; reference: string };

// What's being activated right now, in the order the operator is most likely to mean: the running
// session knows, and failing that the last QSO logged does.
export const selfSpotReferences = (source?: Partial<QSO>): SelfSpotReference[] =>
    !source
        ? []
        : myReferenceFields
              .filter(([field]) => !!source[field])
              .map(([field, programme]) => ({ programme, reference: source[field] as string }));

export type SpotMeProps = {
    open: boolean;
    onClose: () => void;
};

export const SpotMe = ({ open, onClose }: SpotMeProps) => {
    const settings = useSettings();
    const updateSetting = useStore((state) => state.updateSetting);
    const session = useActiveSession();
    const qsos = useQsos();
    const last = qsos[0];

    const references = React.useMemo(
        () => [...selfSpotReferences(session?.defaults), ...selfSpotReferences(last)],
        [session?.defaults, last],
    );
    // De-duplicated by reference, so a park held by both the session and the last QSO is offered once.
    const options = references.filter(
        (option, index) => references.findIndex((o) => o.reference === option.reference) === index,
    );

    const [chosen, setChosen] = React.useState<string | undefined>(undefined);
    const [comments, setComments] = React.useState<string>("");
    const [sending, setSending] = React.useState<boolean>(false);
    const [results, setResults] = React.useState<SelfSpotResult[] | undefined>(undefined);

    // The frequency and mode boxes are the log screen's own, and both read the form rather than
    // props, so the modal stands a form up for them: retuning here behaves exactly like retuning
    // there — kHz, the band derived in front of it, the favourite modes behind the star.
    const methods = useForm<QSO>({ defaultValues: {} });
    const frequency = useWatch({ control: methods.control, name: "frequency" });
    const mode = useWatch({ control: methods.control, name: "mode" });

    // Opening the modal re-reads the radio: the frequency and mode being spotted are whatever the
    // session or the last QSO says now, not what they said the last time it was opened.
    const [openedWith, setOpenedWith] = React.useState<boolean>(open);
    if (openedWith !== open) {
        setOpenedWith(open);
        if (open) {
            methods.reset({
                frequency: session?.defaults.frequency ?? last?.frequency,
                // What the radio is on, and failing that the first favourite: on a summit the mode
                // is usually the one thing that hasn't changed since the last outing.
                mode: session?.defaults.mode ?? last?.mode ?? settings.favouriteModes[0] ?? "SSB",
            });
            setChosen(options[0]?.reference);
            setComments("");
            setResults(undefined);
        }
    }

    const target = options.find((option) => option.reference === chosen);
    const targets = settings.selfSpotTargets;
    const canSend = !!settings.myCallsign && !!target && !!frequency && !!mode && targets.length > 0;

    const send = async (text: string) => {
        if (!canSend) return;
        setSending(true);
        setResults(undefined);
        const sent = await selfSpot(
            targets,
            {
                callsign: settings.myCallsign,
                programme: (target as SelfSpotReference).programme,
                reference: (target as SelfSpotReference).reference,
                frequency: frequency as number,
                mode: mode as string,
                comments: text,
            },
            settings,
        );
        setResults(sent);
        setSending(false);
    };

    return (
        <Modal open={open} onClose={onClose}>
            <Stack gap="xxl" style={styles.modal}>
                <Typography variant="h2">Spot me</Typography>
                {!settings.myCallsign && <Alert severity="warning">Set your callsign in settings first.</Alert>}
                {!options.length && (
                    <Alert severity="warning">
                        <Typography>
                            Nothing to spot: start a POTA, WWFF or SOTA session, or log a QSO with your reference on it.
                        </Typography>
                    </Alert>
                )}
                {options.length > 1 && (
                    <Stack direction="row" gap="lg" style={{ flexWrap: "wrap" }}>
                        {options.map((option) => (
                            <View key={option.reference}>
                                <Button
                                    variant={option.reference === chosen ? "contained" : "chip"}
                                    text={`${capitalise(option.programme)} ${option.reference}`}
                                    onPress={() => setChosen(option.reference)}
                                />
                            </View>
                        ))}
                    </Stack>
                )}
                {options.length === 1 && (
                    <Typography variant="em">
                        {capitalise(options[0].programme)} {options[0].reference}
                    </Typography>
                )}
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
                            text={sending ? "Sending..." : "Spot me"}
                            disabled={!canSend || sending}
                            onPress={() => void send(comments)}
                        />
                    </View>
                    <View>
                        {/* The other half of self-spotting: telling the chasers the frequency is free
                            again, which is the spot everybody forgets to send. */}
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
                    text={compact ? undefined : "Spot me"}
                    onPress={() => setOpen(true)}
                />
            </View>
            <SpotMe open={open} onClose={() => setOpen(false)} />
        </>
    );
};
