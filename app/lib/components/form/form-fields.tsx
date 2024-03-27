import { DateTime } from "luxon";
import React, { useEffect, useRef } from "react";
import { useFormContext } from "react-hook-form";
import { Pressable, View } from "react-native";
import { Switch } from "react-native-gesture-handler";
import { createStyleSheet, useStyles } from "react-native-unistyles";
import { continents } from "../../data/callsigns";
import { getCallsignData } from "../../utils/callsign";
import { Modal } from "../../utils/modal";
import { useStore } from "../../utils/store";
import { Alert } from "../../utils/theme/components/alert";
import { Button } from "../../utils/theme/components/button";
import { Typography } from "../../utils/theme/components/typography";
import { fireSwal } from "../../utils/theme/swal";
import { useGoBack } from "../../utils/use-go-back";
import { useSettings } from "../../utils/use-settings";
import { ButtonOffset } from "../button-offset";
import { ContinentWarning } from "../continent-warning";
import { CountryWarning } from "../country-warning";
import { DxccStats } from "../dxcc-stats";
import { GeocodeButton } from "../geocode-button";
import { Grid } from "../grid";
import { PageLayout } from "../page-layout";
import { PreviousQsos } from "../previous-qsos";
import { QrzChip } from "../qrz-chip";
import { QSO, duration, useQsos } from "../qso";
import { QsoMap } from "../qso/qso-map";
import { Stack } from "../stack";
import { BandFreqInput } from "./band-freq-input";
import { Events } from "./events";
import { FormField } from "./form-field";
import { LocatorField } from "./locator-field";
import { ModeInput } from "./mode-input";
import { MyStation } from "./my-station";
import { Signal } from "./signal";
import { StateField } from "./state-field";

const stylesheet = createStyleSheet((theme) => ({
    datetime: {
        borderStyle: "solid",
        borderBottomWidth: theme.margins.sm,
        borderBottomColor: theme.colours.grey[theme.shades.darker],
    },
    callsignInput: {
        textAlign: "center",
        color: theme.colours.primary[theme.shades.darker],
        fontWeight: "700",
        fontSize: 20,
        borderBottomWidth: 3,
        borderBottomColor: theme.colours.primary[theme.shades.dark],
        borderStyle: "dashed",
    },
    locsubtitle: (alert: boolean = false) => ({
        flex: 1,
        textAlign: "center",
        borderRadius: theme.margins.md,
        ...(alert
            ? {
                  backgroundColor: theme.colours.secondary[theme.shades.dark],
                  color: theme.background,
              }
            : {}),
    }),
}));

export type FormFieldsProps = {
    qso: QSO;
};

const diffTimeInMinutes = (qso: QSO, dt: DateTime) => dt.diff(qso.date, ["minutes"]).toObject().minutes || 0;

export type FormFieldsComponent = React.FC<FormFieldsProps>;

export const FormFields: FormFieldsComponent = ({ qso }): JSX.Element => {
    const isLastQso = useQsos()[0].id === qso.id;
    const timer = useRef<ReturnType<typeof setInterval>>();
    const [now, setNow] = React.useState<DateTime>(DateTime.utc());
    const { styles, theme } = useStyles(stylesheet);
    const [openTimeLocModal, setOpenTimeLocModal] = React.useState<boolean>(false);
    const deleteLog = useStore((state) => state.deleteLog);
    const settings = useSettings();
    const { setValue } = useFormContext<QSO>();
    const goBack = useGoBack();
    const csdata = getCallsignData(qso.callsign);

    const onDelete = () => {
        if (qso) deleteLog(qso);
        goBack();
    };

    const clearTimer = () => {
        if (timer.current) {
            clearInterval(timer.current);
            timer.current = undefined;
        }
    };
    const tick = () => {
        if (diffTimeInMinutes(qso, now) < settings.timeoffThreshold) {
            setNow(DateTime.utc());
        } else {
            clearTimer();
        }
    };

    useEffect(() => {
        if (isLastQso && !qso.dateOff && diffTimeInMinutes(qso, now) < settings.timeoffThreshold) {
            timer.current = setInterval(tick, 1000);
        }
        return clearTimer;
    }, [isLastQso, qso, settings.timeoffThreshold]);

    const qslInfo = () => {
        fireSwal({
            theme,
            title: "eQSL/LoTW",
            text: "If you've received a qsl, the button will light up green, if you've sent it, it'll be blue and grey otherwise",
            icon: "info",
            confirmButtonText: "Ok",
        });
    };

    return (
        <PageLayout
            title={
                <Stack direction="row">
                    <View style={{ flexGrow: 1 }}>
                        <FormField
                            name="callsign"
                            style={styles.callsignInput}
                            transformValue={(v: string) => v.toUpperCase()}
                        />
                    </View>
                    <View>
                        <QrzChip callsign={qso.callsign} />
                    </View>
                </Stack>
            }
            titleMargin={10}
        >
            <Pressable onPress={() => setOpenTimeLocModal(true)}>
                <Stack style={styles.datetime}>
                    {qso && (
                        <Stack direction="row">
                            <Typography variant="h6" style={{ flex: 1 }}>
                                {qso.date.toFormat(settings.datemonth ? "MM-dd-yyyy" : "dd/MM/yyyy")}
                            </Typography>
                            <Stack direction="row" style={{ flexGrow: 1 }}>
                                <Button
                                    variant="chip"
                                    colour={qso.eqsl_received ? "success" : qso.eqsl_sent ? "success" : "grey"}
                                    text="eQSL"
                                    onPress={qslInfo}
                                />
                                <Button
                                    variant="chip"
                                    colour={qso.lotw_received ? "success" : qso.lotw_sent ? "success" : "grey"}
                                    text="lotw"
                                    onPress={qslInfo}
                                />
                            </Stack>
                            <Stack direction="row" style={{ justifyContent: "flex-end", flex: 1 }}>
                                {timer.current && (
                                    <View>
                                        <Button
                                            variant="chip"
                                            colour="secondary"
                                            text={duration(qso, now)}
                                            onPress={() => {
                                                setValue("dateOff", now);
                                                clearTimer();
                                            }}
                                        />
                                    </View>
                                )}
                                {!timer.current && (
                                    <>
                                        <Typography variant="h6">
                                            {qso.dateOff ? qso.date.toFormat("HH:mm") : qso.date.toFormat("HH:mm:ss")}
                                        </Typography>
                                        {qso.dateOff && <Typography variant="subtitle">({duration(qso)})</Typography>}
                                    </>
                                )}
                            </Stack>
                        </Stack>
                    )}
                </Stack>
                {qso && (
                    <Stack direction="row">
                        <Typography variant="subtitle" style={styles.locsubtitle()}>
                            CQ: {qso.cqzone}
                        </Typography>
                        <Typography variant="subtitle" style={styles.locsubtitle()}>
                            ITU: {qso.ituzone}
                        </Typography>
                        <Typography variant="subtitle" style={styles.locsubtitle(!!csdata?.dxccAlt)}>
                            DXCC: {qso.dxcc}
                        </Typography>
                        <Typography variant="subtitle" style={styles.locsubtitle()}>
                            QRB: {qso.distance}km
                        </Typography>
                    </Stack>
                )}
            </Pressable>
            <Modal open={openTimeLocModal} onClose={() => setOpenTimeLocModal(false)}>
                <Stack>
                    <FormField role="date" name="date" label="Date:" />
                    <FormField role="time" name="date" label="Time:" />
                    {!qso.dateOff && (
                        <Button text="Set end qso as start" onPress={() => setValue("dateOff", qso.date)} />
                    )}
                    {qso.dateOff && (
                        <>
                            <FormField role="date" name="dateOff" label="End Date:" />
                            <FormField role="time" name="dateOff" label="End Time:" />
                            <Button text="Remove end" onPress={() => setValue("dateOff", undefined)} />
                        </>
                    )}
                    <FormField name="cqzone" label="CQZone:" />
                    <FormField name="ituzone" label="ITUZone:" />
                    <FormField name="dxcc" label="DXCC:" />
                    {csdata?.dxccAlt && (
                        <Alert severity="info">
                            <Typography>
                                Alertnate DXCC:{" "}
                                {[...csdata?.dxccAlt, csdata?.dxcc].filter((d) => +d !== qso.dxcc).join(", ")}
                            </Typography>
                        </Alert>
                    )}
                    <Typography variant="h3" underline>
                        QSL
                    </Typography>
                    <Grid container>
                        <Grid item xs={4} />
                        <Grid item xs={4}>
                            <Typography>Sent</Typography>
                        </Grid>
                        <Grid item xs={4}>
                            <Typography>Received</Typography>
                        </Grid>
                    </Grid>
                    <Grid container>
                        <Grid item xs={4}>
                            <Typography>LoTW</Typography>
                        </Grid>
                        <Grid item xs={4}>
                            <Switch value={qso.lotw_sent} onValueChange={(v) => setValue("lotw_sent", v)} />
                        </Grid>
                        <Grid item xs={4}>
                            <Switch value={qso.lotw_received} onValueChange={(v) => setValue("lotw_received", v)} />
                        </Grid>
                    </Grid>
                    <Grid container>
                        <Grid item xs={4}>
                            <Typography>eQSL</Typography>
                        </Grid>
                        <Grid item xs={4}>
                            <Switch value={qso.eqsl_sent} onValueChange={(v) => setValue("eqsl_sent", v)} />
                        </Grid>
                        <Grid item xs={4}>
                            <Switch value={qso.eqsl_received} onValueChange={(v) => setValue("eqsl_received", v)} />
                        </Grid>
                    </Grid>
                    <Button text="OK" colour="success" onPress={() => setOpenTimeLocModal(false)} />
                </Stack>
            </Modal>
            <Grid container>
                <Grid item xs={12} md={6} xxl={6}>
                    <FormField name="name" label="Name:" />
                </Grid>
                <Grid item xs={4} md={2} xxl={2} style={{ justifyContent: "center" }}>
                    <View>
                        <Signal field="rst_received" />
                    </View>
                </Grid>
                <Grid item xs={4} md={2} xxl={2} style={{ justifyContent: "center" }}>
                    <View>
                        <Signal field="rst_sent" />
                    </View>
                </Grid>
                <Grid item xs={4} md={2} xxl={2} style={{ justifyContent: "center" }}>
                    <View>
                        <Events />
                    </View>
                </Grid>
            </Grid>
            <Grid container>
                <Grid item xs={7} xl={5}>
                    <FormField name="qth" label="QTH:" />
                </Grid>
                {settings.geocodeMapsCoKey && (
                    <Grid item xs={1}>
                        <ButtonOffset>
                            <GeocodeButton />
                        </ButtonOffset>
                    </Grid>
                )}
                <Grid item xs={settings.geocodeMapsCoKey ? 4 : 5}>
                    <LocatorField name="locator" label="Gridsquare:" />
                </Grid>
                <Grid item xs={12} xl={2}>
                    <ButtonOffset>
                        <MyStation />
                    </ButtonOffset>
                </Grid>
            </Grid>
            <Grid container>
                <Grid item xs={12} md={6}>
                    <Stack>
                        <BandFreqInput />
                        <Grid container>
                            <Grid item xs={8}>
                                <ModeInput />
                            </Grid>
                            <Grid item xs={4}>
                                <FormField name="power" label="Power:" />
                            </Grid>
                        </Grid>
                        <FormField role="textarea" name="note" label="Note:" numberOfLines={7} />
                    </Stack>
                </Grid>
                <Grid item xs={12} md={6}>
                    <Stack>
                        <FormField role="country" name="country" label="Country:" />
                        <CountryWarning />
                        <Grid container>
                            <Grid item xs={6}>
                                <StateField name="state" />
                            </Grid>
                            <Grid item xs={6}>
                                <FormField
                                    role="select"
                                    name="continent"
                                    label="Continent:"
                                    options={Object.fromEntries(continents.map((ctn) => [ctn, ctn]))}
                                />
                                <ContinentWarning />
                            </Grid>
                        </Grid>
                        {qso.dxcc && <DxccStats dxcc={qso.dxcc} />}
                    </Stack>
                </Grid>
            </Grid>

            <View style={{ alignItems: "center" }}>
                <QsoMap qso={qso} />
            </View>
            <PreviousQsos />
            <Stack direction="row">
                <Button variant="outlined" text="Delete" colour="secondary" onPress={() => onDelete()} />
            </Stack>
        </PageLayout>
    );
};
