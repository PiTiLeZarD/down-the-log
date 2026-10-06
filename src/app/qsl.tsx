import { DateTime } from "luxon";
import { useEffect, useState } from "react";
import { View } from "react-native";
import { showImportError } from "../lib/components/adif/import";
import { PageLayout } from "../lib/components/page-layout";
import { QSL_IGNORED, UnmatchedQsl, confirmQso, qslRecordKey } from "../lib/components/qsl";
import { UnmatchedQsls } from "../lib/components/qsl/unmatched-qsls";
import { QSO, findMatchingQso, useQsos } from "../lib/components/qso";
import { Stack } from "../lib/components/stack";
import { downloadQsos, getFileApiFromFilename, record2qso } from "../lib/utils/file-format";
import { useStore } from "../lib/utils/store";
import { Alert } from "../lib/ui/alert";
import { Button } from "../lib/ui/button";
import { Typography } from "../lib/ui/typography";
import { showDialog } from "../lib/ui/dialog";
import { SelectInput } from "../lib/ui/select-input";
import { useSettings } from "../lib/utils/use-settings";
import { LotwError, LotwStatus, fetchLotwConfirmations, nextQslSince } from "../lib/utils/lotw";
import { EqslError, EqslStatus, fetchEqslConfirmations, nextRcvdSince, uploadToEqsl } from "../lib/utils/eqsl";
import { TqslLocation, fetchTqslLocations, locationFor, tqslAvailable, uploadWithTqsl } from "../lib/utils/tqsl";
import { CLUBLOG_API_KEY, ClublogError, ClublogStatus, uploadToClublog } from "../lib/utils/clublog";

const Qsl = () => {
    const qsos = useQsos();
    const [unmatched, setUnmatched] = useState<UnmatchedQsl[]>([]);
    const [lotwStatus, setLotwStatus] = useState<LotwStatus>("idle");
    const [eqslStatus, setEqslStatus] = useState<EqslStatus>("idle");
    const [eqslUploading, setEqslUploading] = useState(false);
    const [clublogStatus, setClublogStatus] = useState<ClublogStatus>("idle");
    // Desktop only. Undefined until TQSL's station_data has been read; a string is why it couldn't be.
    const [tqslLocations, setTqslLocations] = useState<TqslLocation[] | string>();
    const [tqslUploading, setTqslUploading] = useState(false);
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
    const qslSince = settings.lotwConfirmedSince || fromDate.toFormat("yyyy-MM-dd");
    const rcvdSince = settings.eqslRcvdSince || fromDate.toFormat("yyyyMMdd");

    useEffect(() => {
        if (!tqslAvailable()) return;
        fetchTqslLocations()
            .then(setTqslLocations)
            .catch((e) => setTqslLocations(e instanceof Error ? e.message : String(e)));
    }, []);

    // Same shape as the Club Log upload, with TQSL doing the signing and sending on this machine.
    const handleTqslUpload = async () => {
        if (!Array.isArray(tqslLocations)) return;
        const toSend = qsos.filter((q) => !q.lotw_sent);
        if (!toSend.length) return;
        setTqslUploading(true);
        const markSent = (sent: QSO[]) => {
            // The log as it is now: a QSO edited while the upload ran keeps the edit.
            const ids = new Set(sent.map((q) => q.id));
            log(
                useStore
                    .getState()
                    .qsos.filter((q) => ids.has(q.id))
                    .map((q) => ({ ...q, lotw_sent: true })),
            );
        };
        try {
            const result = await uploadWithTqsl(toSend, tqslLocations, settings.tqslLocations, markSent);
            const unplaced = Object.entries(result.unplaced);
            const partial = result.sent.length < toSend.length;
            showDialog({
                title: partial ? "Partly uploaded" : "Done!",
                text: [
                    `${result.sent.length} sent out of ${toSend.length} QSOs.`,
                    ...unplaced.map(([call, count]) => `${count} as ${call}, which has no Station Location in TQSL`),
                    ...result.problems,
                ].join("\n"),
                icon: partial ? "warning" : "success",
                confirmButtonText: "Ok",
            });
        } finally {
            setTqslUploading(false);
        }
    };

    // The download is the only part of the upload we can see happen, so it is what ticks the QSOs
    // off — same order as the TOTA activation flow. Marking first meant a download the browser
    // refused left the log permanently claiming those QSOs were sent, with no way to clear the flag.
    const handleQslDownload = () => {
        const toSend = qsos.filter((q) => !q.lotw_sent);
        try {
            downloadQsos(`${today}_lotw.adif`, toSend);
        } catch (e) {
            showDialog({
                title: "Download failed",
                text: `The LoTW file could not be created, so nothing has been marked as sent: ${
                    e instanceof Error ? e.message : String(e)
                }`,
                icon: "error",
                confirmButtonText: "Ok",
            });
            return;
        }
        log(toSend.map((q): QSO => ({ ...q, lotw_sent: true })));
    };

    // One importer for both services' reports. `name` only picks the parser and names the error, so
    // each pulled report passes the extension it is rather than a file that exists.
    const importQslContent = (content: string, name: string) => {
        try {
            // Read the log as it is now, not as it was when this page rendered: a pull lands
            // after an await, and matching against pre-import QSOs overwrote the confirmations
            // an earlier import had just written.
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
                text:
                    [
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
            if (imported) updateSetting("lotwConfirmedSince", asked);
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

    // Same shape as the LoTW pull. An empty inbox is a clean import of nothing, so it moves the window.
    const handleEqslFetch = async () => {
        const eqsl = settings.eqsl;
        if (!eqsl?.user || !eqsl?.password) return;
        setEqslStatus("loading");
        const asked = nextRcvdSince();
        try {
            const content = await fetchEqslConfirmations({ ...eqsl, since: rcvdSince });
            if (!content) {
                updateSetting("eqslRcvdSince", asked);
                setEqslStatus("done");
                showDialog({
                    title: "eQSL",
                    text: `Nothing new in your eQSL inbox since ${rcvdSince}.`,
                    icon: "info",
                    confirmButtonText: "Ok",
                });
                return;
            }
            const imported = importQslContent(content, "eqsl.adi");
            if (imported) updateSetting("eqslRcvdSince", asked);
            setEqslStatus(imported ? "done" : "error");
        } catch (e) {
            setEqslStatus(e instanceof EqslError ? e.status : "error");
            showDialog({
                title: "eQSL",
                text: e instanceof Error ? e.message : String(e),
                icon: "error",
                confirmButtonText: "Ok",
            });
        }
    };

    // QSOs are only marked sent once eQSL has said it holds them, batch by batch, so a failure part way
    // through keeps what already landed and leaves the rest for next time.
    const handleEqslUpload = async () => {
        const eqsl = settings.eqsl;
        if (!eqsl?.user || !eqsl?.password) return;
        const toSend = qsos.filter((q) => !q.eqsl_sent);
        if (!toSend.length) return;
        setEqslUploading(true);
        const markSent = (sent: QSO[]) => {
            // The log as it is now: a QSO edited while the upload ran keeps the edit.
            const ids = new Set(sent.map((q) => q.id));
            log(
                useStore
                    .getState()
                    .qsos.filter((q) => ids.has(q.id))
                    .map((q) => ({ ...q, eqsl_sent: true })),
            );
        };
        try {
            const result = await uploadToEqsl(toSend, eqsl, markSent);
            showDialog({
                title: result.held ? "Partly uploaded" : "Done!",
                text: [
                    [
                        `${result.added} added`,
                        ...(result.duplicates ? [`${result.duplicates} already on eQSL`] : []),
                        ...(result.held ? [`${result.held} held back and not marked as sent`] : []),
                    ].join(", ") + ` out of ${toSend.length} QSOs.`,
                    ...result.problems.slice(0, 5),
                    ...(result.problems.length > 5 ? [`…and ${result.problems.length - 5} more`] : []),
                ].join("\n"),
                icon: result.held ? "warning" : "success",
                confirmButtonText: "Ok",
            });
        } catch (e) {
            showDialog({
                title: "eQSL",
                text: e instanceof Error ? e.message : String(e),
                icon: "error",
                confirmButtonText: "Ok",
            });
        } finally {
            setEqslUploading(false);
        }
    };

    // Same shape as the eQSL upload, one log at a time. A refused login leaves the button off until the
    // page is opened again — after the credentials have been fixed in Settings — so a wrong password
    // isn't retried against Club Log from the relay's shared address.
    const handleClublogUpload = async () => {
        const clublog = settings.clublog;
        if (!clublog?.email || !clublog?.password) return;
        const toSend = qsos.filter((q) => !q.clublog_sent);
        if (!toSend.length) return;
        setClublogStatus("loading");
        const markSent = (sent: QSO[]) => {
            // The log as it is now: a QSO edited while the upload ran keeps the edit.
            const ids = new Set(sent.map((q) => q.id));
            log(
                useStore
                    .getState()
                    .qsos.filter((q) => ids.has(q.id))
                    .map((q) => ({ ...q, clublog_sent: true })),
            );
        };
        try {
            const result = await uploadToClublog(toSend, clublog, markSent);
            const partial = result.problems.length > 0 || result.unplaced > 0;
            setClublogStatus(partial ? "error" : "done");
            showDialog({
                title: partial ? "Partly uploaded" : "Done!",
                text: [
                    [
                        `${result.sent.length} sent`,
                        ...(result.unplaced ? [`${result.unplaced} with no callsign to file them under`] : []),
                    ].join(", ") + ` out of ${toSend.length} QSOs. Club Log processes uploads in its own time.`,
                    ...result.problems,
                ].join("\n"),
                icon: partial ? "warning" : "success",
                confirmButtonText: "Ok",
            });
        } catch (e) {
            setClublogStatus(e instanceof ClublogError ? e.status : "error");
            showDialog({
                title: "Club Log",
                text: e instanceof Error ? e.message : String(e),
                icon: "error",
                confirmButtonText: "Ok",
            });
        }
    };

    const lotwConfigured = !!settings.lotw?.user && !!settings.lotw?.password;
    const eqslConfigured = !!settings.eqsl?.user && !!settings.eqsl?.password;
    const eqslUnsent = qsos.filter((q) => !q.eqsl_sent).length;
    const clublogConfigured = !!settings.clublog?.email && !!settings.clublog?.password;
    const clublogUnsent = qsos.filter((q) => !q.clublog_sent).length;
    // A refused login keeps the button off until the page is opened again (see handleClublogUpload).
    const clublogUploadable =
        clublogConfigured && !!clublogUnsent && clublogStatus !== "loading" && clublogStatus !== "auth";
    const lotwUnsent = qsos.filter((q) => !q.lotw_sent).length;
    const tqsl = tqslAvailable();
    // The callsigns waiting to go to LoTW, each with the locations TQSL has for it.
    const unsentCalls = Array.isArray(tqslLocations)
        ? [...new Set(qsos.filter((q) => !q.lotw_sent).map((q) => q.myCallsign?.trim().toUpperCase()))]
              .filter((call): call is string => !!call)
              .map((call) => ({
                  call,
                  locations: tqslLocations.filter((l) => l.call?.toUpperCase() === call),
                  current: locationFor(call, tqslLocations, settings.tqslLocations),
              }))
        : [];

    return (
        <PageLayout title="QSLs">
            <Stack gap="xxl">
                <Alert severity="info">
                    <Typography>Uploading marks QSOs as sent</Typography>
                </Alert>

                <Stack>
                    <Stack direction="row">
                        <Typography variant="h3" style={{ flexGrow: 1 }}>
                            LoTW
                        </Typography>
                        <View>
                            <Button
                                variant="chip"
                                colour="grey"
                                text="TQSL"
                                endIcon="open-outline"
                                url="https://www.arrl.org/tqsl-download"
                            />
                        </View>
                    </Stack>
                    <Stack direction="row">
                        <Button
                            startIcon="cloud-download-outline"
                            text={lotwStatus === "loading" ? "Downloading…" : "Download"}
                            variant="outlined"
                            colour={lotwConfigured ? "primary" : "grey"}
                            numberOfLines={1}
                            disabled={!lotwConfigured || lotwStatus === "loading"}
                            onPress={handleLotwFetch}
                        />
                        {tqsl ? (
                            <Button
                                startIcon="cloud-upload-outline"
                                text={tqslUploading ? "Uploading…" : `Upload: ${lotwUnsent} qsos`}
                                variant="outlined"
                                colour={Array.isArray(tqslLocations) && lotwUnsent ? "primary" : "grey"}
                                numberOfLines={1}
                                disabled={!Array.isArray(tqslLocations) || !lotwUnsent || tqslUploading}
                                onPress={handleTqslUpload}
                            />
                        ) : (
                            <Button
                                startIcon="download-outline"
                                text={`ADIF: ${lotwUnsent} qsos`}
                                variant="outlined"
                                numberOfLines={1}
                                onPress={handleQslDownload}
                            />
                        )}
                    </Stack>
                    {typeof tqslLocations === "string" && (
                        <Typography variant="subtitle">
                            Could not read TQSL's Station Locations: {tqslLocations}
                        </Typography>
                    )}
                    {unsentCalls.map(({ call, locations, current }) =>
                        locations.length > 1 ? (
                            <Stack key={call} direction="row" style={{ alignItems: "center" }}>
                                <Typography>{call}</Typography>
                                <SelectInput
                                    style={{ flexGrow: 1 }}
                                    value={current?.name}
                                    items={locations.map((l) => ({ label: l.name, value: l.name }))}
                                    onValueChange={(name) =>
                                        updateSetting("tqslLocations", { ...settings.tqslLocations, [call]: name })
                                    }
                                />
                            </Stack>
                        ) : !locations.length ? (
                            <Typography key={call} variant="subtitle">
                                {call} has no Station Location in TQSL, so its QSOs will be skipped. Add one in TQSL.
                            </Typography>
                        ) : null,
                    )}
                    <Typography variant="subtitle">
                        {lotwConfigured
                            ? `Download pulls confirmations matched since ${qslSince}. `
                            : "Add your LoTW user name and password in Settings > API's to download confirmations. "}
                        {tqsl
                            ? "Upload signs and sends through TQSL on this computer. Each QSO's own grid and state override the Station Location's."
                            : "Uploading is an ADIF file for now: sign and send it with TQSL."}
                    </Typography>
                </Stack>

                <Stack>
                    <Typography variant="h3">eQSL</Typography>
                    <Stack direction="row">
                        <Button
                            startIcon="cloud-download-outline"
                            text={eqslStatus === "loading" ? "Downloading…" : "Download"}
                            variant="outlined"
                            colour={eqslConfigured ? "primary" : "grey"}
                            numberOfLines={1}
                            disabled={!eqslConfigured || eqslStatus === "loading"}
                            onPress={handleEqslFetch}
                        />
                        <Button
                            startIcon="cloud-upload-outline"
                            text={eqslUploading ? "Uploading…" : `Upload: ${eqslUnsent} qsos`}
                            variant="outlined"
                            colour={eqslConfigured && eqslUnsent ? "primary" : "grey"}
                            numberOfLines={1}
                            disabled={!eqslConfigured || eqslUploading || !eqslUnsent}
                            onPress={handleEqslUpload}
                        />
                    </Stack>
                    <Typography variant="subtitle">
                        {eqslConfigured
                            ? `Download pulls cards received since ${rcvdSince}. Upload sends every QSO not yet marked as sent and marks the ones eQSL accepts.`
                            : "Add your eQSL user name and password in Settings > API's to download and upload."}
                    </Typography>
                </Stack>

                {!!CLUBLOG_API_KEY && (
                    <Stack>
                        <Typography variant="h3">Club Log</Typography>
                        <Stack direction="row">
                            <Button
                                startIcon="cloud-download-outline"
                                text="No download"
                                variant="outlined"
                                colour="grey"
                                numberOfLines={1}
                                disabled
                            />
                            <Button
                                startIcon="cloud-upload-outline"
                                text={clublogStatus === "loading" ? "Uploading…" : `Upload: ${clublogUnsent} qsos`}
                                variant="outlined"
                                colour={clublogUploadable ? "primary" : "grey"}
                                numberOfLines={1}
                                disabled={!clublogUploadable}
                                onPress={handleClublogUpload}
                            />
                        </Stack>
                        <Typography variant="subtitle">
                            {clublogConfigured
                                ? `Upload sends every QSO not yet marked as sent${
                                      settings.clublog?.callsign
                                          ? `, into the ${settings.clublog.callsign} log`
                                          : ", each into the log of the callsign it was made under"
                                  }, and marks the ones it takes.`
                                : "Add your Club Log email and password in Settings > API's to upload."}
                        </Typography>
                    </Stack>
                )}

                {unmatched.length > 0 && <UnmatchedQsls unmatched={unmatched} onClear={() => setUnmatched([])} />}
            </Stack>
        </PageLayout>
    );
};

export default Qsl;
