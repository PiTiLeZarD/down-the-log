import React from "react";
import { useFormContext } from "react-hook-form";
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

export const Events = () => {
    const [open, setOpen] = React.useState<boolean>(false);
    const { getValues, setValue } = useFormContext<QSO>();
    const qso = getValues();

    // The session and the contest exchange have no box anywhere else on the QSO page — the input bar
    // shows them while the session runs and nothing shows them afterwards. This is where a QSO's
    // own copy of them is read and corrected.
    const sessions = useStore((state) => state.sessions);
    const session = sessions.find((s) => s.id === qso.sessionId);
    const activeSession = useActiveSession();
    const showContest =
        !!activeSession?.contest || !!qso.contestId || !!qso.stx || !!qso.srx || !!qso.stxString || !!qso.srxString;
    return (
        <>
            <Badge count={allEvents(qso).length} colour="secondary">
                <Button
                    startIcon="earth"
                    text="Events"
                    variant="outlined"
                    colour="primary"
                    onPress={() => setOpen(true)}
                />
            </Badge>
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
