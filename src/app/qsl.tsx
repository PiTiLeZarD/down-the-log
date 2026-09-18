import { DateTime } from "luxon";
import { useState } from "react";
import { View } from "react-native";
import { showImportError, styles } from "../lib/components/adif/import";
import { Dropzone, FileWithPreview } from "../lib/components/dropzone";
import { PageLayout } from "../lib/components/page-layout";
import { QSL_IGNORED, UnmatchedQsl, confirmQso, qslRecordKey } from "../lib/components/qsl";
import { UnmatchedQsls } from "../lib/components/qsl/unmatched-qsls";
import { QSO, findMatchingQso, useQsos } from "../lib/components/qso";
import { Stack } from "../lib/components/stack";
import { TabsLayout } from "../lib/components/tabs-layout";
import { downloadQsos, getFileApiFromFilename, record2qso } from "../lib/utils/file-format";
import { useStore } from "../lib/utils/store";
import { Alert } from "../lib/ui/alert";
import { Button } from "../lib/ui/button";
import { Typography } from "../lib/ui/typography";
import { showDialog } from "../lib/ui/dialog";
import { useSettings } from "../lib/utils/use-settings";
import { LotwError, LotwStatus, fetchLotwConfirmations, nextQslSince } from "../lib/utils/lotw";

const Qsl = () => {
    const qsos = useQsos();
    const [unmatched, setUnmatched] = useState<UnmatchedQsl[]>([]);
    const [lotwStatus, setLotwStatus] = useState<LotwStatus>("idle");
    const log = useStore((state) => state.log);
    const updateSetting = useStore((state) => state.updateSetting);
    const today = DateTime.local().toFormat("yyyyMMdd");
    const settings = useSettings();
    // qsos comes newest first, so copy before reversing to reach the oldest one: reverse()
    // is in-place and would flip the store's own array.
    const fromDate = (
        [...qsos].reverse().find((q) => q.myCallsign === settings.myCallsign) || {
            date: DateTime.local().minus({ month: 1 }),
        }
    ).date;
    // A pull that has already happened moves the window forward; until then it's the whole log.
    const qslSince = settings.lotwQslSince || fromDate.toFormat("yyyy-MM-dd");

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

    // One importer for both ways a report arrives: a file the operator dropped, and the one pulled
    // straight from LoTW. `name` only picks the parser and names the error, so the pulled report
    // passes the extension it is rather than a file that exists.
    const importQslContent = (content: string, name: string) => {
        try {
            // Read the log as it is now, not as it was when this page rendered: FileReader
            // callbacks land one after the other, so dropping two files at once used to
            // have the second one match against pre-import QSOs and overwrite the first
            // import's confirmations.
            const currentQsos = useStore.getState().qsos;
            const resolutions = useStore.getState().qslResolutions;

            // The duplicate pass used to be a findIndex() inside a filter(), so a download
            // cost records² comparisons — the shape that makes a big file look hung. A Set
            // of the record keys answers the same question in one pass.
            const records: { key: string; record: QSO }[] = [];
            const seen = new Set<string>();
            for (const r of getFileApiFromFilename(name).parseFile(content)) {
                const key = qslRecordKey(r);
                if (seen.has(key)) continue;
                seen.add(key);
                const record = record2qso(r);
                // A record with no callsign can't be matched against anything.
                if (record.callsign) records.push({ key, record });
            }

            // Answers the operator has already given win over the time window: they are
            // about exactly this record, and they are held by QSO id, so editing the QSO
            // afterwards doesn't lose them. The index is only worth building when there is
            // something to look up.
            const byId = Object.keys(resolutions).length
                ? new Map(currentQsos.map((q) => [q.id, q]))
                : new Map<string, QSO>();

            // The matched QSO is copied rather than edited in place: the store's own
            // objects are what the rest of the app renders from, and mutating one
            // changes what is on screen without zustand ever hearing about it.
            const matches = records.map(({ key, record }) => {
                const resolved = resolutions[key];
                return {
                    key,
                    record,
                    ignored: resolved === QSL_IGNORED,
                    matching:
                        resolved && resolved !== QSL_IGNORED
                            ? byId.get(resolved) || null
                            : findMatchingQso(currentQsos, record),
                };
            });

            // Folded onto the running copy rather than onto the stored QSO: a download
            // holds a LoTW row and an eQSL row for the same contact, and two records
            // confirming one QSO from its stored state each produced a copy carrying only
            // their own flag — whichever landed last in log() won, and the other
            // confirmation was lost.
            const confirmed = new Map<string, QSO>();
            let newlyConfirmed = 0;
            for (const { record, matching } of matches) {
                if (!matching) continue;
                const next = confirmQso(confirmed.get(matching.id) || matching, record);
                if (!next) continue;
                confirmed.set(matching.id, next);
                newlyConfirmed++;
            }

            const toImport = [...confirmed.values()];
            const stillUnmatched = matches.filter(({ matching, ignored }) => !matching && !ignored);
            const ignored = matches.filter(({ ignored: i }) => i).length;
            const known = matches.length - stillUnmatched.length - ignored - newlyConfirmed;

            // Nothing new in the file means nothing written at all: re-importing the same
            // download is a no-op rather than a full rewrite of every QSO it mentions.
            if (toImport.length) log(toImport);

            showDialog({
                title: "Done!",
                text: [
                    `${newlyConfirmed} new confirmation${newlyConfirmed === 1 ? "" : "s"}`,
                    ...(known ? [`${known} already confirmed`] : []),
                    ...(stillUnmatched.length ? [`${stillUnmatched.length} unmatched`] : []),
                    ...(ignored ? [`${ignored} ignored`] : []),
                ].join(", ") + ` out of ${records.length} records.`,
                icon: "success",
                confirmButtonText: "Ok",
            });

            // Same file twice adds nothing to the list: the record key is what an answer
            // is remembered under, so it is what tells two copies of a record apart.
            setUnmatched((prev) => {
                const listed = new Set(prev.map((u) => u.key));
                return [
                    ...prev,
                    ...stillUnmatched.filter((u) => !listed.has(u.key)).map(({ key, record }) => ({ key, record })),
                ];
            });
            return true;
        } catch (e) {
            showImportError(name, e);
            return false;
        }
    };

    const handleQSLImport = (files: FileWithPreview[]) => {
        files.forEach((file) => {
            const fr = new FileReader();
            fr.onerror = () => showImportError(file.name, fr.error);
            fr.onload = () => {
                if (!fr.result) return;
                importQslContent(
                    typeof fr.result == "string" ? fr.result : new TextDecoder("utf-8").decode(fr.result),
                    file.name,
                );
            };

            fr.readAsText(file);
        });
    };

    // The window only moves on a clean import. A report that arrived but wouldn't parse leaves it
    // where it was, so the next pull covers the same period again rather than skipping it.
    const handleLotwFetch = async () => {
        const lotw = settings.lotw;
        if (!lotw?.user || !lotw?.password) return;
        setLotwStatus("loading");
        // Read before the await: a pull that succeeds writes the window it asked for, not one
        // computed after however long LoTW took to answer.
        const asked = nextQslSince();
        try {
            const content = await fetchLotwConfirmations({
                user: lotw.user,
                password: lotw.password,
                since: qslSince,
                callsign: settings.myCallsign || undefined,
            });
            const imported = importQslContent(content, "lotw.adi");
            if (imported) updateSetting("lotwQslSince", asked);
            setLotwStatus(imported ? "done" : "error");
        } catch (e) {
            setLotwStatus(e instanceof LotwError ? e.status : "error");
            showDialog({
                title: "LoTW",
                text: e instanceof Error ? e.message : String(e),
                icon: "error",
                confirmButtonText: "Ok",
            });
        }
    };

    const lotwConfigured = !!settings.lotw?.user && !!settings.lotw?.password;

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
                        {lotwConfigured ? (
                            <Stack>
                                <Button
                                    startIcon="cloud-download-outline"
                                    text={lotwStatus === "loading" ? "Loading from LoTW…" : "Load from LoTW"}
                                    variant="outlined"
                                    disabled={lotwStatus === "loading"}
                                    onPress={handleLotwFetch}
                                />
                                <Typography variant="subtitle">
                                    Asks LoTW for confirmations matched since {qslSince} and applies them to the
                                    log. Nothing is uploaded and your callsign certificate is never needed.
                                </Typography>
                            </Stack>
                        ) : (
                            <Stack>
                                <Alert severity="info">
                                    <Typography>
                                        Add your LoTW user name and password in Settings &gt; API&apos;s to pull
                                        confirmations straight into the log.
                                    </Typography>
                                </Alert>
                                <Stack direction="row">
                                    <Typography>Or download the file by hand</Typography>
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
                                    Leave all fields as is and put the date "{fromDate.toFormat("yyyy-MM-dd")}", then
                                    drop the file on the eQSL tab's upload box — it reads LoTW reports too.
                                </Typography>
                            </Stack>
                        )}
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

                        <Typography>
                            Upload the exported file here, it'll be matched and automatically update the records
                            appropriately. A LoTW report downloaded by hand works here too.
                        </Typography>

                        <Dropzone onAcceptedFiles={handleQSLImport} style={styles.dropzone}>
                            <Stack>
                                <Typography style={styles.dropzoneText} variant="h2">
                                    eQSL File upload
                                </Typography>
                                <Typography variant="subtitle" style={{ textAlign: "center" }}>
                                    Click or drop a file here
                                </Typography>
                            </Stack>
                        </Dropzone>
                    </Stack>
                </TabsLayout>

                {unmatched.length > 0 && <UnmatchedQsls unmatched={unmatched} onClear={() => setUnmatched([])} />}
            </Stack>
        </PageLayout>
    );
};

export default Qsl;
