import React from "react";
import { useFormContext, useWatch } from "react-hook-form";
import { View } from "react-native";
import { StyleSheet } from "react-native-unistyles";
import { Modal } from "../../utils/modal";
import { Badge } from "../../ui/badge";
import { Button } from "../../ui/button";
import { Input } from "../../ui/input";
import { Typography } from "../../ui/typography";
import { sessionLabel } from "../../utils/session";
import { useStore } from "../../utils/store";
import { useActiveSession } from "../../utils/use-session";
import { Grid } from "../grid";
import { QSO, allEvents } from "../qso";
import { Stack } from "../stack";
import { FormField } from "./form-field";
import { ParkReferenceInput } from "./park-reference-input";
import { SiginfoReferenceInput } from "./siginfo-reference-input";

const styles = StyleSheet.create((theme) => ({
    // Same box the Input draws for itself — border, padding and one line of text — so the chip row
    // stands as tall as a field's input and the two columns of the form keep the same rhythm.
    chipRow: {
        flexWrap: "wrap",
        minHeight: theme.margins.xs * 2 + theme.margins.lg * 2 + theme.components.typography.fontSize * 1.2,
    },
    // Chips crowd in from the left, the button that opens the modal sits at the far right of the row.
    spacer: {
        flexGrow: 1,
    },
}));

// Theirs first, then mine, in the order the modal lays its two columns out. "DE" marks the
// references being activated from this end, the same way the my-station strip does.
const eventChips = (qso: QSO): { label: string; value: string }[] =>
    (
        [
            ["POTA", qso.pota],
            ["WWFF", qso.wwff],
            ["SOTA", qso.sota],
            ["IOTA", qso.iota],
            ["SIG", qso.sig ? [qso.sig, qso.sigInfo].filter(Boolean).join(" ") : undefined],
            ["Contest", qso.contestId],
            ["DE POTA", qso.myPota],
            ["DE WWFF", qso.myWwff],
            ["DE SOTA", qso.mySota],
            ["DE IOTA", qso.myIota],
            ["DE SIG", qso.mySig ? [qso.mySig, qso.mySigInfo].filter(Boolean).join(" ") : undefined],
        ] as const
    )
        .filter(([, value]) => !!value)
        .map(([label, value]) => ({ label, value: value as string }));

// Watched by name rather than the whole form: this also sits in the input bar, where a bare
// useWatch() re-rendered it on every keystroke of the callsign.
const eventFields = [
    "pota",
    "wwff",
    "sota",
    "iota",
    "sig",
    "sigInfo",
    "contestId",
    "myPota",
    "myWwff",
    "mySota",
    "myIota",
    "mySig",
    "mySigInfo",
] as const satisfies readonly (keyof QSO)[];

export type EventsProps = {
    // The input bar has one narrow slot and no room for values, so it keeps the counted button. The
    // QSO form has the width to show what is actually attached, which is the whole point of the
    // field — a button there showed a number and hid the references behind a modal.
    variant?: "button" | "chips";
};

export const Events = ({ variant = "button" }: EventsProps) => {
    const [open, setOpen] = React.useState<boolean>(false);
    const { control, getValues, setValue } = useFormContext<QSO>();
    // Watched, not read once: a reference typed in the modal has to reach the chips behind it.
    const watched = useWatch({ control, name: eventFields as unknown as (keyof QSO)[] });
    const qso = {
        ...getValues(),
        ...Object.fromEntries(eventFields.map((field, i) => [field, watched[i]])),
    } as QSO;

    // The session and the contest exchange have no box anywhere else on the QSO page — the input bar
    // shows them while the session runs and nothing shows them afterwards. This is where a QSO's
    // own copy of them is read and corrected.
    const sessions = useStore((state) => state.sessions);
    const session = sessions.find((s) => s.id === qso.sessionId);
    const activeSession = useActiveSession();
    const showContest =
        !!activeSession?.contest || !!qso.contestId || !!qso.stx || !!qso.srx || !!qso.stxString || !!qso.srxString;
    const chips = eventChips(qso);

    return (
        <>
            {variant === "button" && (
                <Badge count={allEvents(qso).length} colour="secondary">
                    <Button
                        startIcon="earth"
                        text="Events"
                        variant="outlined"
                        colour="primary"
                        onPress={() => setOpen(true)}
                    />
                </Badge>
            )}
            {/* Label above, chips below — the same shape as a FormField, so this reads as a field of
                the form rather than a stray row of buttons. */}
            {variant === "chips" && (
                <Stack>
                    <Typography>Activations:</Typography>
                    <Stack direction="row" gap="sm" style={styles.chipRow}>
                        {/* An empty row read as a rendering bug — nothing but a button floating on the
                            right. Say the field is empty the way the station strip does. */}
                        {chips.length === 0 && <Typography variant="subtitle">None</Typography>}
                        {chips.map(({ label, value }) => (
                            <View key={`${label}-${value}`}>
                                <Button
                                    variant="chip"
                                    colour="grey"
                                    text={`${label} ${value}`}
                                    onPress={() => setOpen(true)}
                                />
                            </View>
                        ))}
                        <View style={styles.spacer} />
                        <View>
                            <Button
                                variant="chip"
                                colour="primary"
                                startIcon="earth"
                                text={chips.length > 0 ? "Edit" : "Add"}
                                onPress={() => setOpen(true)}
                            />
                        </View>
                    </Stack>
                </Stack>
            )}
            <Modal wide open={open} onClose={() => setOpen(false)}>
                <Stack>
                    <Grid container>
                        <Grid item xs={2}>
                            <Typography variant="em">Event</Typography>
                        </Grid>
                        <Grid item xs={5}>
                            <Typography variant="em">{qso.callsign}</Typography>
                        </Grid>
                        <Grid item xs={5}>
                            <Typography variant="em">Me</Typography>
                        </Grid>
                    </Grid>
                    <Grid container>
                        <Grid item xs={2}>
                            <Typography variant="em">POTA</Typography>
                        </Grid>
                        <Grid item xs={5}>
                            <ParkReferenceInput event="pota" />
                        </Grid>
                        <Grid item xs={5}>
                            <ParkReferenceInput event="pota" mine />
                        </Grid>
                    </Grid>
                    <Grid container>
                        <Grid item xs={2}>
                            <Typography variant="em">WWFF</Typography>
                        </Grid>
                        <Grid item xs={5}>
                            <ParkReferenceInput event="wwff" />
                        </Grid>
                        <Grid item xs={5}>
                            <ParkReferenceInput event="wwff" mine />
                        </Grid>
                    </Grid>
                    <Grid container>
                        <Grid item xs={2}>
                            <Typography variant="em">SOTA</Typography>
                        </Grid>
                        <Grid item xs={5}>
                            <ParkReferenceInput event="sota" />
                        </Grid>
                        <Grid item xs={5}>
                            <ParkReferenceInput event="sota" mine />
                        </Grid>
                    </Grid>
                    <Grid container>
                        <Grid item xs={2}>
                            <Typography variant="em">IOTA</Typography>
                        </Grid>
                        <Grid item xs={5}>
                            <ParkReferenceInput event="iota" />
                        </Grid>
                        <Grid item xs={5}>
                            <ParkReferenceInput event="iota" mine />
                        </Grid>
                    </Grid>
                    <Grid container>
                        <Grid item xs={2}>
                            <Typography variant="em">SIG</Typography>
                        </Grid>
                        <Grid item xs={5}>
                            <Input value={qso.sig} onChangeText={(v) => setValue("sig", v.toUpperCase())} />
                        </Grid>
                        <Grid item xs={5}>
                            <Input value={qso.mySig} onChangeText={(v) => setValue("mySig", v.toUpperCase())} />
                        </Grid>
                    </Grid>
                    <Grid container>
                        <Grid item xs={2}>
                            <Typography variant="em">SIG Info</Typography>
                        </Grid>
                        <Grid item xs={5}>
                            <SiginfoReferenceInput />
                        </Grid>
                        <Grid item xs={5}>
                            <SiginfoReferenceInput mine />
                        </Grid>
                    </Grid>
                    {(session || showContest) && (
                        <>
                            <Typography variant="em">Session</Typography>
                            {session && (
                                <Grid container>
                                    <Grid item xs={2}>
                                        <Typography variant="em">Logged in</Typography>
                                    </Grid>
                                    <Grid item xs={10}>
                                        <Typography>{sessionLabel(session)}</Typography>
                                    </Grid>
                                </Grid>
                            )}
                            {showContest && (
                                <>
                                    <Grid container>
                                        <Grid item xs={2}>
                                            <Typography variant="em">Contest</Typography>
                                        </Grid>
                                        <Grid item xs={10}>
                                            <FormField name="contestId" />
                                        </Grid>
                                    </Grid>
                                    <Grid container>
                                        <Grid item xs={2}>
                                            <Typography variant="em">Serial</Typography>
                                        </Grid>
                                        <Grid item xs={5}>
                                            <FormField name="srx" numeric />
                                        </Grid>
                                        <Grid item xs={5}>
                                            <FormField name="stx" numeric />
                                        </Grid>
                                    </Grid>
                                    <Grid container>
                                        <Grid item xs={2}>
                                            <Typography variant="em">Exchange</Typography>
                                        </Grid>
                                        <Grid item xs={5}>
                                            <FormField name="srxString" />
                                        </Grid>
                                        <Grid item xs={5}>
                                            <FormField name="stxString" />
                                        </Grid>
                                    </Grid>
                                </>
                            )}
                        </>
                    )}
                    <Button colour="success" text="OK" onPress={() => setOpen(false)} />
                </Stack>
            </Modal>
        </>
    );
};
