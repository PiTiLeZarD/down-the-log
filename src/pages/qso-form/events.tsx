import React from "react";
import { useFormContext } from "react-hook-form";
import { Grid } from "../../utils/grid";
import { Modal } from "../../utils/modal";
import { QSO } from "../../utils/qso";
import { Stack } from "../../utils/stack";
import { Button } from "../../utils/theme/components/button";
import { Input } from "../../utils/theme/components/input";
import { Typography } from "../../utils/theme/components/typography";

export type EventsProps = {};

export type EventsComponent = React.FC<EventsProps>;

export const Events: EventsComponent = (): JSX.Element => {
    const [open, setOpen] = React.useState<boolean>(false);
    const { getValues, setValue } = useFormContext<QSO>();
    const qso = getValues();
    return (
        <>
            <Button startIcon="earth" text="Events" variant="outlined" onPress={() => setOpen(true)} />
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
                            <Input value={qso.pota} onChangeText={(v) => setValue("pota", v)} />
                        </Grid>
                        <Grid item xs={5}>
                            <Input value={qso.myPota} onChangeText={(v) => setValue("myPota", v)} />
                        </Grid>
                    </Grid>
                    <Grid container>
                        <Grid item xs={2}>
                            <Typography variant="em">WWFF</Typography>
                        </Grid>
                        <Grid item xs={5}>
                            <Input value={qso.wwff} onChangeText={(v) => setValue("wwff", v)} />
                        </Grid>
                        <Grid item xs={5}>
                            <Input value={qso.myWwff} onChangeText={(v) => setValue("myWwff", v)} />
                        </Grid>
                    </Grid>
                    <Grid container>
                        <Grid item xs={2}>
                            <Typography variant="em">SOTA</Typography>
                        </Grid>
                        <Grid item xs={5}>
                            <Input value={qso.sota} onChangeText={(v) => setValue("sota", v)} />
                        </Grid>
                        <Grid item xs={5}>
                            <Input value={qso.mySota} onChangeText={(v) => setValue("mySota", v)} />
                        </Grid>
                    </Grid>
                    <Grid container>
                        <Grid item xs={2}>
                            <Typography variant="em">IOTA</Typography>
                        </Grid>
                        <Grid item xs={5}>
                            <Input value={qso.iota} onChangeText={(v) => setValue("iota", v)} />
                        </Grid>
                        <Grid item xs={5}>
                            <Input value={qso.myIota} onChangeText={(v) => setValue("myIota", v)} />
                        </Grid>
                    </Grid>
                    <Grid container>
                        <Grid item xs={2}>
                            <Typography variant="em">SIG</Typography>
                        </Grid>
                        <Grid item xs={5}>
                            <Input value={qso.sig} onChangeText={(v) => setValue("sig", v)} />
                        </Grid>
                        <Grid item xs={5}>
                            <Input value={qso.mySig} onChangeText={(v) => setValue("mySig", v)} />
                        </Grid>
                    </Grid>
                    <Button colour="success" text="OK" onPress={() => setOpen(false)} />
                </Stack>
            </Modal>
        </>
    );
};
