import { DateTime } from "luxon";
import React, { useEffect } from "react";
import { useFormContext } from "react-hook-form";
import { Pressable, View } from "react-native";
import { Switch } from "react-native-gesture-handler";
import { StyleSheet } from "react-native-unistyles";
import { continents } from "../../data/callsigns";
import { getCallsignData } from "../../utils/callsign";
import { roundTo } from "../../utils/math";
import { Modal } from "../../utils/modal";
import { useStore } from "../../utils/store";
import { useWidthMatches } from "../../ui/breakpoints";
import { Alert } from "../../ui/alert";
import { Button } from "../../ui/button";
import { Typography } from "../../ui/typography";
import { showDialog, useDialogOpen } from "../../ui/dialog";
import { useGoBack } from "../../utils/use-go-back";
import { useKeyPress } from "../../utils/use-key-press";
import { useSettings } from "../../utils/use-settings";
import { ButtonOffset } from "../button-offset";
import { CallsignAutofill } from "../callsign-autofill";
import { DxccStats } from "../dxcc-stats";
import { GeocodeButton } from "../geocode-button";
import { Grid } from "../grid";
import { PageLayout } from "../page-layout";
import { PreviousQsos } from "../previous-qsos";
import { QrzChip } from "../qrz-chip";
import { QSO, duration, useQsos, withBand } from "../qso";
import { QsoIgnoredIssues, QsoIssues } from "../qso-issues";
import { QsoMap } from "../qso/qso-map";
import { Stack } from "../stack";
import { BandFreqInput } from "./band-freq-input";
import { useCallsignFocus } from "./callsign-focus";
import { Events } from "./events";
import { FormField } from "./form-field";
import { LocatorField } from "./locator-field";
import { ModeInput } from "./mode-input";
import { MyStation } from "./my-station";
import { Signal } from "./signal";
import { StateField } from "./state-field";

const styles = StyleSheet.create((theme) => ({
    datetime: {
        borderStyle: "solid",
        borderBottomWidth: theme.margins.sm,
        borderBottomColor: theme.colours.grey.darker,
    },
    callsignInput: {
        textAlign: "center",
        color: theme.colours.primary.darker,
        fontWeight: "700",
        fontSize: 20,
        borderBottomWidth: 3,
        borderBottomColor: theme.colours.primary.dark,
        borderStyle: "dashed",
    },
    qslChip: {
        paddingLeft: theme.margins.lg,
        paddingRight: theme.margins.lg,
        paddingTop: theme.margins.xs,
        paddingBottom: theme.margins.xs,
    },
    locsubtitle: (alert: boolean = false) => ({
        flex: 1,
        textAlign: "center",
        borderRadius: theme.margins.md,
        ...(alert
            ? {
                  backgroundColor: theme.colours.secondary.dark,
                  color: theme.background,
              }
            : {}),
    }),
}));

export type FormFieldsProps = {
    qso: QSO;
};

const diffTimeInMinutes = (qso: QSO, dt: DateTime) => dt.diff(qso.date, ["minutes"]).toObject().minutes || 0;

export const FormFields = ({ qso }: FormFieldsProps) => {
    const isLastQso = useQsos()[0].id === qso.id;
    const [now, setNow] = React.useState<DateTime>(DateTime.utc());
    const [openTimeLocModal, setOpenTimeLocModal] = React.useState<boolean>(false);
    const deleteLog = useStore((state) => state.deleteLog);
    const log = useStore((state) => state.log);
    const settings = useSettings();
    const { setValue, getValues } = useFormContext<QSO>();
    const goBack = useGoBack();
    const dialogOpen = useDialogOpen();
    // Narrow screens: the date row already carries date, QSL chips and clock — the duration
    // suffix wraps and squashes the lot, so drop it there (still visible in the time/loc modal).
    const showDuration = useWidthMatches("md");
    // Single column: the note is a tall block, and leaving it where the two-column layout puts it
    // would push QTH/gridsquare/country far down the scroll. Move it below them instead.
    const twoColumns = useWidthMatches("md");
    const requestCallsignFocus = useCallsignFocus((state) => state.request);
    const csdata = getCallsignData(qso.callsign);

    const onDelete = async () => {
        if (!qso) return;

        const confirmed = await showDialog({
            title: `Delete QSO with ${qso.callsign}?`,
            icon: "question",
            text: "This action cannot be reverted!",
            confirmButtonText: "Yes, Delete it!",
            cancelButtonText: "Cancel",
            confirmColour: "danger",
        });
        if (!confirmed) return;

        deleteLog(qso);
        goBack();
    };
    const handleClipboard = () => {
        const msg: string[] = [];

        msg.push(
            `${qso.date.toFormat("yyMMdd HH:mm")} [${qso.callsign} ${(qso.name || "").padStart(21 - qso.callsign.length, " ")}] DXCC:${String(qso.dxcc || 0).padStart(3, "0")}`,
        );
        const operating = `${String((qso.frequency || 0) * 1000).padStart(6, ".")} [${qso.band}/${qso.mode}] ${String(qso.power || 0).padStart(4, "0")}W`;
        const qsl = `[${qso.lotw_received ? "LoTW" : "L̶o̶T̶W̶"}/${qso.eqsl_received ? "eQSL" : "e̶Q̶S̶L̶"}]`;
        const rst = `↑${qso.rst_received} ↓${qso.rst_sent}`;
        msg.push(`${operating.padEnd(26, " ")} ${qsl} ${rst}`);

        const distance = String(roundTo(qso.distance || 0, 0));

        msg.push(
            `${qso.myLocator} ${"-".padStart(Math.ceil((27 - distance.length) / 2), "-")} ${distance}km ${"-".padStart(Math.floor((27 - distance.length) / 2), "-")}> ${qso.locator}`,
        );

        // Events
        // POTA:AU-1234  SOTA:VK2/CT-003  WWFF:VKFF-1234

        navigator.clipboard.writeText(`\`\`\`${msg.join("\n")}\`\`\``);
        showDialog({
            title: "Clipboard",
            text: "QSO successfully copied to clipboard",
            icon: "success",
            confirmButtonText: "OK",
        });
    };

    // Whether the QSO is still running is derived, not held in a ref: the chip below reads it during
    // render, and a ref wouldn't re-render when the timer stopped. `now` ticking is what drives it.
    const isRunning = isLastQso && !qso.dateOff && diffTimeInMinutes(qso, now) < settings.timeoffThreshold;

    useEffect(() => {
        if (!isRunning) return;
        const timer = setInterval(() => setNow(DateTime.utc()), 1000);
        return () => clearInterval(timer);
    }, [isRunning]);

    // Escape is "done with this contact": it ends the QSO at the moment the key went down and puts
    // the operator back on the log, typing the next callsign. Written straight to the store rather
    // than left to the auto-save, which wouldn't get its effect in before the screen unmounts.
    // Stands down while a modal or a dialog is up — the key belongs to whatever is on top.
    useKeyPress(
        "Escape",
        () => {
            if (isRunning) {
                const dateOff = DateTime.utc();
                setValue("dateOff", dateOff);
                log(withBand({ ...getValues(), dateOff }));
            }
            requestCallsignFocus();
            goBack();
        },
        !openTimeLocModal && !dialogOpen,
    );

    const qslInfo = () => {
        showDialog({
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
                            {/* Each chip is wrapped so it hugs its label — a bare Button carries flex:1
                                and stretched the pair across half the row. */}
                            <Stack direction="row" style={{ flexGrow: 1, justifyContent: "center" }}>
                                <View>
                                    <Button
                                        variant="chip"
                                        style={styles.qslChip}
                                        colour={qso.eqsl_received ? "success" : qso.eqsl_sent ? "primary" : "grey"}
                                        text="eQSL"
                                        onPress={qslInfo}
                                    />
                                </View>
                                <View>
                                    <Button
                                        variant="chip"
                                        style={styles.qslChip}
                                        colour={qso.lotw_received ? "success" : qso.lotw_sent ? "primary" : "grey"}
                                        text="LoTW"
                                        onPress={qslInfo}
                                    />
                                </View>
                            </Stack>
                            <Stack direction="row" style={{ justifyContent: "flex-end", flex: 1 }}>
                                {isRunning && (
                                    <View>
                                        <Button
                                            variant="chip"
                                            colour="secondary"
                                            text={duration(qso, now)}
                                            onPress={() => setValue("dateOff", now)}
                                        />
                                    </View>
                                )}
                                {!isRunning && (
                                    <>
                                        <Typography variant="h6">
                                            {qso.dateOff ? qso.date.toFormat("HH:mm") : qso.date.toFormat("HH:mm:ss")}
                                        </Typography>
                                        {qso.dateOff && showDuration && (
                                            <Typography variant="subtitle">({duration(qso)})</Typography>
                                        )}
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
            <QsoIssues />
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
                {/* Left column is the operating side of the contact (who/what/how), right column is
                    the location side. On narrow screens the right column drops under the left, so the
                    operating fields stay above the fold. */}
                <Grid item xs={12} md={6}>
                    <Stack>
                        <FormField name="name" label="Name:" />
                        <BandFreqInput />
                        <Grid container>
                            <Grid item xs={4} style={{ justifyContent: "center" }}>
                                <View>
                                    <Signal field="rst_received" />
                                </View>
                            </Grid>
                            <Grid item xs={4} style={{ justifyContent: "center" }}>
                                <View>
                                    <Signal field="rst_sent" />
                                </View>
                            </Grid>
                            <Grid item xs={4} style={{ justifyContent: "center" }}>
                                <View>
                                    <Events />
                                </View>
                            </Grid>
                        </Grid>
                        <Grid container>
                            <Grid item xs={8}>
                                <ModeInput />
                            </Grid>
                            <Grid item xs={4}>
                                <FormField name="power" label="Power:" />
                            </Grid>
                        </Grid>
                        {twoColumns && <FormField role="textarea" name="note" label="Note:" numberOfLines={7} />}
                    </Stack>
                </Grid>
                <Grid item xs={12} md={6}>
                    <Stack>
                        <Grid container>
                            <Grid item xs={settings.geocodeMapsCoKey ? 10 : 12}>
                                <FormField name="qth" label="QTH:" />
                            </Grid>
                            {settings.geocodeMapsCoKey && (
                                <Grid item xs={2}>
                                    <ButtonOffset>
                                        <GeocodeButton />
                                    </ButtonOffset>
                                </Grid>
                            )}
                        </Grid>
                        <Grid container>
                            <Grid item xs={8}>
                                <LocatorField name="locator" label="Gridsquare:" />
                            </Grid>
                            <Grid item xs={4}>
                                <ButtonOffset>
                                    <MyStation />
                                </ButtonOffset>
                            </Grid>
                        </Grid>
                        <FormField role="country" name="country" label="Country:" />
                        <CallsignAutofill />
                        <Grid container>
                            <Grid item xs={6}>
                                <StateField name="state" />
                            </Grid>
                            <Grid item xs={6}>
                                <FormField role="select" name="continent" label="Continent:" options={continents} />
                            </Grid>
                        </Grid>
                        {qso.dxcc && <DxccStats dxcc={qso.dxcc} />}
                    </Stack>
                </Grid>
                {!twoColumns && (
                    <Grid item xs={12}>
                        <FormField role="textarea" name="note" label="Note:" numberOfLines={7} />
                    </Grid>
                )}
            </Grid>

            <View style={{ alignItems: "center" }}>
                <QsoMap qso={qso} />
            </View>
            <PreviousQsos />
            <Stack direction="row">
                <Button variant="outlined" text="Clipboard" onPress={() => handleClipboard()} />
                <Button variant="outlined" text="Delete" colour="secondary" onPress={() => onDelete()} />
            </Stack>
            <QsoIgnoredIssues />
        </PageLayout>
    );
};
