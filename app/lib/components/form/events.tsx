import React from "react";
import { useFormContext } from "react-hook-form";
import { Modal } from "../../utils/modal";
import { Badge } from "../../utils/theme/components/badge";
import { Button } from "../../utils/theme/components/button";
import { Input } from "../../utils/theme/components/input";
import { Typography } from "../../utils/theme/components/typography";
import { Grid } from "../grid";
import { QSO, allEvents } from "../qso";
import { Stack } from "../stack";
import { ParkReferenceInput } from "./park-reference-input";
import { SiginfoReferenceInput } from "./siginfo-reference-input";

export type EventsProps = {};

export type EventsComponent = React.FC<EventsProps>;

export const Events: EventsComponent = (): JSX.Element => {
    const [open, setOpen] = React.useState<boolean>(false);
    const { getValues, setValue } = useFormContext<QSO>();
    const qso = getValues();
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
                    <Button colour="success" text="OK" onPress={() => setOpen(false)} />
                </Stack>
            </Modal>
        </>
    );
};
