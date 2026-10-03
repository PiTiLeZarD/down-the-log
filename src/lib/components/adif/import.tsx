import { Platform, View } from "react-native";
import { StyleSheet } from "react-native-unistyles";
import { getFileApiFromFilename, record2qso } from "../../utils/file-format";
import { SESSIONS_HEADER_FIELD } from "../../utils/file-format/common";
import { parseSessions, sessionsToRestore } from "../../utils/session";
import { useStore } from "../../utils/store";
import { Typography } from "../../ui/typography";
import { showDialog } from "../../ui/dialog";
import { useSettings } from "../../utils/use-settings";
import { Dropzone, FileWithPreview } from "../dropzone";
import { QSO, findMatchingQso, mergeImported, prefillLocation, prefillMyStation, useQsos } from "../qso";
import { Stack } from "../stack";

export const styles = StyleSheet.create((theme) => ({
    dropzone: {
        display: "flex",
        width: "100%",
        height: 160,
        backgroundColor: theme.colours.primary.light,
        borderRadius: theme.margins.xxl,
        borderColor: theme.colours.primary.darker,
        borderStyle: "solid",
        borderWidth: 3,
        justifyContent: "center",
    },
    dropzoneText: {
        fontWeight: "bold",
        textAlign: "center",
    },
}));

// Everything below runs inside a FileReader callback, where a throw goes nowhere: no dialog, no
// message, and the drop looks to the operator exactly like it never registered. An unknown extension
// and a malformed file both throw by design, so both have to come back out as a dialog.
export const showImportError = (filename: string, e: unknown) =>
    showDialog({
        title: "Import failed",
        text: `${filename} could not be imported: ${e instanceof Error ? e.message : String(e)}`,
        icon: "error",
        confirmButtonText: "Ok",
    });

export const Import = () => {
    const qsos = useQsos();
    const log = useStore((state) => state.log);
    const adoptSessions = useStore((state) => state.adoptSessions);
    const currentLocation = useStore((state) => state.currentLocation);
    const settings = useSettings();

    const handleImport = (files: FileWithPreview[]) => {
        files.forEach((file) => {
            const fr = new FileReader();
            fr.onerror = () => showImportError(file.name, fr.error);
            fr.onload = () => {
                try {
                    if (!fr.result) return;
                    const content =
                        typeof fr.result == "string" ? fr.result : new TextDecoder("utf-8").decode(fr.result);

                    const api = getFileApiFromFilename(file.name);
                    const parsed: QSO[] = api
                        .parseFile(content)
                        .map((r) => record2qso(r))
                        // A record with no callsign is not a QSO: importing one puts a blank row in
                        // the log that nothing can match or sort.
                        .filter((q) => !!q.callsign)
                        .map((q) =>
                            prefillLocation(
                                prefillMyStation(q, { myCallsign: settings.myCallsign, myLocator: currentLocation }),
                            ),
                        );
                    // A match is merged into, never replaced: see mergeImported. Folded onto the
                    // running copy, so two records landing on the same QSO both get a say.
                    const fresh: QSO[] = [];
                    const stored = new Map<string, QSO>();
                    const merged = new Map<string, QSO>();
                    parsed.forEach((q) => {
                        const matching = findMatchingQso(qsos, q);
                        if (!matching) return fresh.push(q);
                        stored.set(matching.id, matching);
                        merged.set(matching.id, mergeImported(merged.get(matching.id) || matching, q));
                    });
                    const updated = [...merged.values()].filter((q) => q !== stored.get(q.id));
                    const toImport = [...fresh, ...updated];
                    // Read from the store now, not the render: several files dropped at once each
                    // land here in turn, and the earlier ones may have restored sessions already.
                    const restored = sessionsToRestore(
                        parseSessions(api.parseHeader?.(content)[SESSIONS_HEADER_FIELD]),
                        [...fresh, ...merged.values()],
                        useStore.getState().sessions,
                    );
                    if (restored.length) adoptSessions(restored, []);
                    log(toImport);
                    showDialog({
                        title: "Done!",
                        text:
                            `${fresh.length} new QSOs imported, ${merged.size} already in the log` +
                            (updated.length ? ` (${updated.length} filled in from the file).` : ".") +
                            (restored.length ? ` ${restored.length} sessions came back with them.` : ""),
                        icon: "success",
                        confirmButtonText: "Ok",
                    });
                } catch (e) {
                    showImportError(file.name, e);
                }
            };

            fr.readAsText(file);
        });
    };

    return (
        <View>
            {!["ios", "android"].includes(Platform.OS) && (
                <Stack gap="xxl">
                    <Dropzone onAcceptedFiles={handleImport} style={styles.dropzone}>
                        <Stack>
                            <Typography style={styles.dropzoneText} variant="h2">
                                QSO File upload
                            </Typography>
                            <Typography variant="subtitle" style={{ textAlign: "center" }}>
                                Click or drop a file here
                            </Typography>
                            <Typography variant="subtitle" style={{ textAlign: "center" }}>
                                ADIF/ADX/WSJTX supported
                            </Typography>
                        </Stack>
                    </Dropzone>
                </Stack>
            )}
        </View>
    );
};
