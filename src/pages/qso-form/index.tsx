import { DrawerScreenProps } from "@react-navigation/drawer";
import React, { useEffect } from "react";
import { useForm } from "react-hook-form";
import { createStyleSheet, useStyles } from "react-native-unistyles";
import { NavigationParamList } from "../../Navigation";
import { freq2band } from "../../data/bands";
import { useStore } from "../../store";
import { FormField } from "../../utils/form-field";
import { Grid } from "../../utils/grid";
import { PageLayout } from "../../utils/page-layout";
import { QSO, useQsos } from "../../utils/qso";
import { Stack } from "../../utils/stack";
import { Button } from "../../utils/theme/components/button";
import { Typography } from "../../utils/theme/components/typography";

const stylesheet = createStyleSheet((theme) => ({
    datetime: {
        borderStyle: "solid",
        borderBottomWidth: theme.margins.sm,
        borderBottomColor: theme.colours.grey[theme.shades.darker],
    },
}));

export type QsoFormProps = {} & DrawerScreenProps<NavigationParamList, "QsoForm">;

export type QsoFormComponent = React.FC<QsoFormProps>;

export const QsoForm: QsoFormComponent = ({ navigation, route }): JSX.Element => {
    const { styles } = useStyles(stylesheet);
    const { qsoId } = route.params;
    const qso = useQsos().filter((q) => q.id == qsoId)[0];
    const log = useStore((state) => state.log);
    const deleteLog = useStore((state) => state.deleteLog);

    const { handleSubmit, control, watch, reset } = useForm<QSO>({
        defaultValues: qso,
    });
    useEffect(() => reset(qso), [qsoId]);

    const freq = watch("frequency");

    const onSubmit = (q: QSO) => {
        log(q);
        navigation.navigate("Home");
    };

    const onDelete = () => {
        deleteLog(qso);
        navigation.navigate("Home");
    };

    return (
        <PageLayout title={<FormField name="callsign" control={control} />} navigation={navigation}>
            <Stack style={styles.datetime}>
                <Stack direction="row">
                    <Typography variant="subtitle" style={{ flex: 1, textAlign: "center" }}>
                        CQ: {qso.cqzone}
                    </Typography>
                    <Typography variant="subtitle" style={{ flex: 1, textAlign: "center" }}>
                        ITU: {qso.ituzone}
                    </Typography>
                    <Typography variant="subtitle" style={{ flex: 1, textAlign: "center" }}>
                        ITU: {qso.dxcc}
                    </Typography>
                    <Typography variant="subtitle" style={{ flex: 1, textAlign: "center" }}>
                        QRB: {qso.distance}km
                    </Typography>
                </Stack>
                <Stack direction="row">
                    <Typography variant="h6" style={{ flex: 1 }}>
                        {qso.date.toFormat("dd/MM/yyyy")}
                    </Typography>
                    <Typography variant="h6" style={{ flex: 1, textAlign: "right" }}>
                        {qso.date.toFormat("HH:mm:ss")}
                    </Typography>
                </Stack>
            </Stack>
            <Grid container>
                <Grid item xs={6} md={3}>
                    <FormField name="rst_received" label="RST Received:" control={control} />
                </Grid>
                <Grid item xs={6} md={3}>
                    <FormField name="rst_sent" label="RST Sent:" control={control} />
                </Grid>
                <Grid item xs={12} md={6}>
                    <FormField name="name" label="Name:" control={control} />
                </Grid>
            </Grid>
            <Grid container>
                <Grid item xs={8}>
                    <FormField name="qth" label="QTH:" control={control} />
                </Grid>
                <Grid item xs={4}>
                    <FormField name="locator" label="Locator:" control={control} />
                </Grid>
            </Grid>
            <Grid container>
                <Grid item xs={12} md={6}>
                    <Stack>
                        <Grid container>
                            <Grid item xs={8}>
                                <FormField name="frequency" label="Frequency:" control={control} placeholder="In Khz" />
                            </Grid>
                            <Grid item xs={4}>
                                <Typography>Band:</Typography>
                                <Typography>{freq2band(freq) || "N/A"}</Typography>
                            </Grid>
                        </Grid>
                        <Grid container>
                            <Grid item xs={8}>
                                <FormField
                                    role="select"
                                    name="mode"
                                    label="Mode:"
                                    options={{ SSB: "SSB", AM: "AM", FM: "FM", CW: "CW" }}
                                    control={control}
                                />
                            </Grid>
                            <Grid item xs={4}>
                                <FormField name="power" label="Power:" control={control} />
                            </Grid>
                        </Grid>
                    </Stack>
                </Grid>
                <Grid item xs={12} md={6}>
                    <Stack>
                        <FormField name="country" label="Country:" control={control} />
                        <Grid container>
                            <Grid item xs={6}>
                                <FormField name="state" label="State:" control={control} />
                            </Grid>
                            <Grid item xs={6}>
                                <FormField name="continent" label="Continent:" control={control} />
                            </Grid>
                        </Grid>
                    </Stack>
                </Grid>
            </Grid>
            <FormField role="textarea" name="note" label="Note:" control={control} />
            <Stack direction="row">
                <Button variant="outlined" text="Submit" onPress={handleSubmit(onSubmit)} />
                <Button variant="outlined" text="Delete" colour="secondary" onPress={() => onDelete()} />
            </Stack>
        </PageLayout>
    );
};
