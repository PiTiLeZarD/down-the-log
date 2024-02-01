import React from "react";
import { useFormContext } from "react-hook-form";
import iotaData from "../../data/iota.json";
import potaData from "../../data/pota.json";
import wwffData from "../../data/wwff.json";
import { Grid } from "../../utils/grid";
import { Modal } from "../../utils/modal";
import { QSO, allEvents } from "../../utils/qso";
import { Stack } from "../../utils/stack";
import { Badge } from "../../utils/theme/components/badge";
import { Button } from "../../utils/theme/components/button";
import { Input } from "../../utils/theme/components/input";
import { Typography } from "../../utils/theme/components/typography";
import { ReferenceInfo } from "./reference-info";

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
                            <Input value={qso.pota} onChangeText={(v) => setValue("pota", v.toUpperCase())} />
                            <ReferenceInfo reference={qso.pota} data={potaData} />
                        </Grid>
                        <Grid item xs={5}>
                            <Input value={qso.myPota} onChangeText={(v) => setValue("myPota", v.toUpperCase())} />
                            <ReferenceInfo reference={qso.myPota} data={potaData} />
                        </Grid>
                    </Grid>
                    <Grid container>
                        <Grid item xs={2}>
                            <Typography variant="em">WWFF</Typography>
                        </Grid>
                        <Grid item xs={5}>
                            <Input value={qso.wwff} onChangeText={(v) => setValue("wwff", v.toUpperCase())} />
                            <ReferenceInfo reference={qso.wwff} data={wwffData} />
                        </Grid>
                        <Grid item xs={5}>
                            <Input value={qso.myWwff} onChangeText={(v) => setValue("myWwff", v.toUpperCase())} />
                            <ReferenceInfo reference={qso.myWwff} data={wwffData} />
                        </Grid>
                    </Grid>
                    <Grid container>
                        <Grid item xs={2}>
                            <Typography variant="em">SOTA</Typography>
                        </Grid>
                        <Grid item xs={5}>
                            <Input value={qso.sota} onChangeText={(v) => setValue("sota", v.toUpperCase())} />
                        </Grid>
                        <Grid item xs={5}>
                            <Input value={qso.mySota} onChangeText={(v) => setValue("mySota", v.toUpperCase())} />
                        </Grid>
                    </Grid>
                    <Grid container>
                        <Grid item xs={2}>
                            <Typography variant="em">IOTA</Typography>
                        </Grid>
                        <Grid item xs={5}>
                            <Input value={qso.iota} onChangeText={(v) => setValue("iota", v.toUpperCase())} />
                            <ReferenceInfo reference={qso.iota} data={iotaData} />
                        </Grid>
                        <Grid item xs={5}>
                            <Input value={qso.myIota} onChangeText={(v) => setValue("myIota", v.toUpperCase())} />
                            <ReferenceInfo reference={qso.myIota} data={iotaData} />
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
                            <Input value={qso.sigInfo} onChangeText={(v) => setValue("sigInfo", v.toUpperCase())} />
                        </Grid>
                        <Grid item xs={5}>
                            <Input value={qso.mySigInfo} onChangeText={(v) => setValue("mySigInfo", v.toUpperCase())} />
                        </Grid>
                    </Grid>
                    <Button colour="success" text="OK" onPress={() => setOpen(false)} />
                </Stack>
            </Modal>
        </>
    );
};
