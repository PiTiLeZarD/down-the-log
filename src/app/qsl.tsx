import { DateTime } from "luxon";
import { View } from "react-native";
import { showImportError, styles } from "../lib/components/adif/import";
import { Dropzone, FileWithPreview } from "../lib/components/dropzone";
import { PageLayout } from "../lib/components/page-layout";
import { confirmQso, qslRecordKey } from "../lib/components/qsl";
import { QSO, findMatchingQso, useQsos } from "../lib/components/qso";
import { Stack } from "../lib/components/stack";
import { TabsLayout } from "../lib/components/tabs-layout";
import { baseCallsign } from "../lib/utils/callsign";
import { downloadQsos, getFileApiFromFilename, record2qso } from "../lib/utils/file-format";
import { useStore } from "../lib/utils/store";
import { Alert } from "../lib/ui/alert";
import { Button } from "../lib/ui/button";
import { Typography } from "../lib/ui/typography";
import { showDialog } from "../lib/ui/dialog";
import { useSettings } from "../lib/utils/use-settings";

const Qsl = () => {
    const qsos = useQsos();
    const log = useStore((state) => state.log);
    const today = DateTime.local().toFormat("yyyyMMdd");
    const settings = useSettings();
    // qsos comes newest first, so copy before reversing to reach the oldest one: reverse()
    // is in-place and would flip the store's own array.
    const fromDate = (
        [...qsos].reverse().find((q) => q.myCallsign === settings.myCallsign) || {
            date: DateTime.local().minus({ month: 1 }),
        }
    ).date;

    // The download is the only part of the upload we can see happen, so it is what ticks the QSOs
    // off — same order as the TOTA activation flow. Marking first meant a download the browser
    // refused left the log permanently claiming those QSOs were sent, with no way to clear the flag.
    const handleQslDownload = (type: "lotw" | "eqsl") => () => {
        const toSend = qsos.filter((q) => (type === "lotw" ? !q.lotw_sent : !q.eqsl_sent));
        try {
            downloadQsos(`${today}_${type}.adif`, toSend);
        } catch (e) {
            showDialog({
                title: "Download failed",
                text: `The ${type.toUpperCase()} file could not be created, so nothing has been marked as sent: ${
                    e instanceof Error ? e.message : String(e)
                }`,
                icon: "error",
                confirmButtonText: "Ok",
            });
            return;
        }
        log(toSend.map((q): QSO => ({ ...q, ...(type === "lotw" ? { lotw_sent: true } : { eqsl_sent: true }) })));
    };
    const handleQSLImport = (files: FileWithPreview[]) => {
        files.forEach((file) => {
            const fr = new FileReader();
            fr.onerror = () => showImportError(file.name, fr.error);
            fr.onload = () => {
                try {
                    if (!fr.result) return;
                    const content =
                        typeof fr.result == "string" ? fr.result : new TextDecoder("utf-8").decode(fr.result);

                    // Read the log as it is now, not as it was when this page rendered: FileReader
                    // callbacks land one after the other, so dropping two files at once used to
                    // have the second one match against pre-import QSOs and overwrite the first
                    // import's confirmations.
                    const currentQsos = useStore.getState().qsos;

                    // The duplicate pass used to be a findIndex() inside a filter(), so a download
                    // cost records² comparisons — the shape that makes a big file look hung. A Set
                    // of the record keys answers the same question in one pass.
                    const records: { key: string; record: QSO }[] = [];
                    const seen = new Set<string>();
                    for (const r of getFileApiFromFilename(file.name).parseFile(content)) {
                        const key = qslRecordKey(r);
                        if (seen.has(key)) continue;
                        seen.add(key);
                        const record = record2qso(r);
                        // A record with no callsign can't be matched against anything.
                        if (record.callsign) records.push({ key, record });
                    }

                    // The matched QSO is copied rather than edited in place: the store's own
                    // objects are what the rest of the app renders from, and mutating one
                    // changes what is on screen without zustand ever hearing about it.
                    const matches = records.map(({ key, record }) => ({
                        key,
                        record,
                        matching: findMatchingQso(currentQsos, record),
                    }));

                    const toImport = matches
                        .map(({ record, matching }) => (matching ? confirmQso(matching, record) : null))
                        .filter((q): q is QSO => !!q);
                    const unmatched = matches.filter(({ matching }) => !matching);
                    const known = matches.length - unmatched.length - toImport.length;

                    // Nothing new in the file means nothing written at all: re-importing the same
                    // download is a no-op rather than a full rewrite of every QSO it mentions.
                    if (toImport.length) log(toImport);

                    showDialog({
                        title: "Done!",
                        text: [
                            `${toImport.length} new confirmation${toImport.length === 1 ? "" : "s"}`,
                            ...(known ? [`${known} already confirmed`] : []),
                            ...(unmatched.length ? [`${unmatched.length} unmatched`] : []),
                        ].join(", ") + ` out of ${records.length} records.`,
                        icon: "success",
                        confirmButtonText: "Ok",
                    });

                    if (unmatched.length) {
                        console.group("QSOs unmatched and possible matches:");
                        unmatched.forEach(({ record }) => {
                            console.info(`Callsign: ${record.callsign} Date: ${record.date.toFormat("yyyy-MM-dd HH:mm")}`);
                            currentQsos
                                .filter((qq) => baseCallsign(qq.callsign) === baseCallsign(record.callsign || ""))
                                .forEach((qq) =>
                                    console.info(
                                        `-> ${qq.callsign} > ${qq.date.toFormat("yyyy-MM-dd HH:mm")} ( /qso?qsoId=${qq.id} )`,
                                    ),
                                );
                        });
                        console.groupEnd();
                    }
                } catch (e) {
                    showImportError(file.name, e);
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
