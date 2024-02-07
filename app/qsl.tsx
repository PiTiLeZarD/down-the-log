import { DateTime } from "luxon";
import React from "react";
import { View } from "react-native";
import { useStyles } from "react-native-unistyles";
import Swal from "sweetalert2";
import { stylesheet } from "./lib/components/adif/import";
import { Dropzone, FileWithPreview } from "./lib/components/dropzone";
import { PageLayout } from "./lib/components/page-layout";
import { QSO, findMatchingQso, useQsos } from "./lib/components/qso";
import { Stack } from "./lib/components/stack";
import { TabsLayout } from "./lib/components/tabs-layout";
import { adifFileToRecordList, adxFileToRecordList, downloadQsos, record2qso } from "./lib/utils/adif";
import { baseCallsign } from "./lib/utils/callsign";
import { useStore } from "./lib/utils/store";
import { Alert } from "./lib/utils/theme/components/alert";
import { Button } from "./lib/utils/theme/components/button";
import { Typography } from "./lib/utils/theme/components/typography";
import { SwalTheme } from "./lib/utils/theme/theme";
import { useSettings } from "./lib/utils/use-settings";

export type QslProps = {};

export type QslComponent = React.FC<QslProps>;

const Qsl: QslComponent = (): JSX.Element => {
    const qsos = useQsos();
    const { styles } = useStyles(stylesheet);
    const log = useStore((state) => state.log);
    const today = DateTime.local().toFormat("yyyyMMdd");
    const settings = useSettings();
    const fromDate = (
        qsos.reverse().find((q) => q.myCallsign === settings.myCallsign) || {
            date: DateTime.local().minus({ month: 1 }),
        }
    ).date;

    const handleQslDownload = (type: "lotw" | "eqsl") => () => {
        const qslQsos = qsos.filter((q) => (type === "lotw" ? !q.lotw_sent : !q.eqsl_sent));
        qslQsos.forEach((q) => (q[`${type}_sent`] = true));
        log(qslQsos);
        downloadQsos(`${today}_${type}.adif`, qslQsos);
    };
    const handleQSLImport = (files: FileWithPreview[]) => {
        files.map((file) => {
            const fr = new FileReader();
            fr.onload = () => {
                if (fr.result) {
                    const content =
                        typeof fr.result == "string" ? fr.result : new TextDecoder("utf-8").decode(fr.result);

                    const updates = (
                        file.name.endsWith("adx") ? adxFileToRecordList(content) : adifFileToRecordList(content)
                    )
                        .map((r) => record2qso(r))
                        .filter((q) => !!q.callsign)
                        .map((q) => {
                            const matching = findMatchingQso(qsos, q);
                            if (matching) {
                                if ("app_lotw_owncall" in (q.honeypot || {})) {
                                    matching.lotw_received = true;
                                } else {
                                    matching.eqsl_received = true;
                                }
                            }
                            return [q, matching];
                        });

                    const toImport = updates
                        .filter(([q, matching]) => !!matching)
                        .map(([q, matching]) => matching) as QSO[];
                    log(toImport);

                    Swal.fire({
                        ...SwalTheme,
                        title: "Done!",
                        text: `${toImport.length} records have been matched! ${
                            toImport.length !== updates.length
                                ? `(${updates.length - toImport.length} couldn't be matched, check the logs)`
                                : ""
                        }`,
                        icon: "success",
                        confirmButtonText: "Ok",
                    });

                    if (toImport.length !== updates.length) {
                        console.group("QSOs unmatched and possible matches:");
                        updates.forEach(([q, matching]) => {
                            if (!matching) {
                                console.info(`Callsign: ${q?.callsign} Date: ${q?.date.toFormat("yyyy-MM-dd HH:mm")}`);
                                qsos.filter(
                                    (qq) => baseCallsign(qq.callsign) === baseCallsign(q?.callsign || ""),
                                ).forEach((qq) =>
                                    console.info(
                                        `-> ${qq.callsign} > ${qq.date.toFormat("yyyy-MM-dd HH:mm")} ( /qso?qsoId=${qq.id} )`,
                                    ),
                                );
                            }
                        });
                        console.groupEnd;
                    }
                }
            };

            fr.readAsText(file);
        });
    };

    return (
        <PageLayout title="QSLs">
            <Stack>
                <Typography>
                    You can download all qsos that aren't marked as sent for either lotw or eqsl here
                </Typography>
                <TabsLayout tabs={["LoTW", "eQSL"]}>
                    <Stack gap="xxl">
                        <Alert severity="info">
                            <Typography>QSOs will be altered and marked as sent</Typography>
                        </Alert>
                        <Button
                            startIcon="download-outline"
                            text={`LoTW file: ${qsos.filter((q) => !q.lotw_sent).length} qsos`}
                            variant="outlined"
                            onPress={handleQslDownload("lotw")}
                        />
                        <Stack direction="row">
                            <Typography>You will need to sign your QSOs using LoTW's tqsl app</Typography>
                            <View>
                                <Button
                                    variant="chip"
                                    url="https://www.arrl.org/tqsl-download"
                                    colour="grey"
                                    text="Click here to download"
                                />
                            </View>
                        </Stack>

                        <Typography variant="h3">Getting confirmations</Typography>
                        <Stack direction="row">
                            <Typography>Click on the link to get LoTW's qsl confirmations</Typography>
                            <View>
                                <Button
                                    variant="chip"
                                    colour="grey"
                                    text="Get from LoTW"
                                    url="https://lotw.arrl.org/lotwuser/qsos?qsoscmd=adif"
                                />
                            </View>
                        </Stack>
                        <Typography variant="subtitle">
                            Leave all fields as is and put the date "{fromDate.toFormat("yyyy-MM-dd")}"
                        </Typography>
                    </Stack>
                    <Stack>
                        <Alert severity="info">
                            <Typography>QSOs will be altered and marked as sent</Typography>
                        </Alert>

                        <Button
                            startIcon="download-outline"
                            text={`eQSL file: ${qsos.filter((q) => !q.eqsl_sent).length} qsos`}
                            variant="outlined"
                            onPress={handleQslDownload("eqsl")}
                        />
                        <Stack direction="row">
                            <Typography>You will need to upload this file to eQSL directly</Typography>
                            <View>
                                <Button
                                    url="https://eqsl.cc/qslcard/EnterADIF.cfm"
                                    variant="chip"
                                    colour="grey"
                                    text="Click here to upload to eQSL"
                                />
                            </View>
                        </Stack>

                        <Typography variant="h3">Getting confirmations</Typography>
                        <Stack direction="row">
                            <Typography>Click on the link to get eQSL's qsl confirmations</Typography>
                            <View>
                                <Button
                                    text="Get from eQSL"
                                    variant="chip"
                                    colour="grey"
                                    url={`https://www.eQSL.cc/qslcard/DownloadInBox.cfm?RcvdSince=${fromDate.toFormat(
                                        "yyyyMMdd",
                                    )}`}
                                />
                            </View>
                        </Stack>
                        <Typography variant="subtitle">Get the Adif file.</Typography>
                    </Stack>
                </TabsLayout>

                <Typography>
                    You can upload here the exported files from respectively eqsl and lotw, it'll be matched and
                    automatically update the records appropriately
                </Typography>

                <Dropzone onAcceptedFiles={handleQSLImport} style={styles.dropzone}>
                    <Stack>
                        <Typography style={styles.dropzoneText} variant="h2">
                            LoTW/eQSL File upload
                        </Typography>
                        <Typography variant="subtitle" style={{ textAlign: "center" }}>
                            Click or drop a file here
                        </Typography>
                    </Stack>
                </Dropzone>
            </Stack>
        </PageLayout>
    );
};

export default Qsl;
