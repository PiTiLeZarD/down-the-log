import { DateTime } from "luxon";
import React from "react";
import { Platform, View } from "react-native";
import { createStyleSheet, useStyles } from "react-native-unistyles";
import Swal from "sweetalert2";
import { useStore } from "../../store";
import { adifFileToRecordList, adxFileToRecordList, record2qso } from "../../utils/adif";
import { Dropzone, FileWithPreview } from "../../utils/dropzone";
import { QSO, findMatchingQso, qsoLocationFill, useQsos } from "../../utils/qso";
import { Stack } from "../../utils/stack";
import { Button } from "../../utils/theme/components/button";
import { Typography } from "../../utils/theme/components/typography";
import { SwalTheme } from "../../utils/theme/theme";
import { useSettings } from "../../utils/use-settings";

const stylesheet = createStyleSheet((theme) => ({
    dropzone: {
        display: "flex",
        width: "100%",
        height: 160,
        backgroundColor: theme.colours.primary[theme.shades.light],
        borderRadius: theme.margins.xxl,
        borderColor: theme.colours.primary[theme.shades.darker],
        borderStyle: "solid",
        borderWidth: 3,
        justifyContent: "center",
    },
    dropzoneText: {
        fontWeight: "bold",
        textAlign: "center",
    },
}));

export type ImportProps = {};

export type ImportComponent = React.FC<ImportProps>;

export const Import: ImportComponent = (): JSX.Element => {
    const qsos = useQsos();
    const log = useStore((state) => state.log);
    const { styles } = useStyles(stylesheet);
    const currentLocation = useStore((state) => state.currentLocation);
    const settings = useSettings();

    const fromDate = DateTime.fromFormat("20050201", "yyyyMMdd");

    const handleImport = (files: FileWithPreview[]) => {
        files.map((file) => {
            const fr = new FileReader();
            fr.onload = () => {
                if (fr.result) {
                    const content =
                        typeof fr.result == "string" ? fr.result : new TextDecoder("utf-8").decode(fr.result);

                    const toImport: QSO[] = (
                        file.name.endsWith("adx") ? adxFileToRecordList(content) : adifFileToRecordList(content)
                    )
                        .map((r) => record2qso(r))
                        .map((q) => {
                            if (!q.myLocator) q.myLocator = currentLocation;
                            if (!q.myCallsign) q.myCallsign = settings.myCallsign;
                            return qsoLocationFill(q);
                        })
                        .map((q) => {
                            const matching = findMatchingQso(qsos, q);
                            if (matching) {
                                q.id = matching.id;
                            }
                            return q;
                        });
                    log(toImport);
                    Swal.fire({
                        ...SwalTheme,
                        title: "Done!",
                        text: `All ${toImport.length} records have been imported!`,
                        icon: "success",
                        confirmButtonText: "Ok",
                    });
                }
            };

            fr.readAsText(file);
        });
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
                                if ("APP_LoTW_OWNCALL" in (q.honeypot || {})) {
                                    q.lotw_received = true;
                                } else {
                                    q.eqsl_received = true;
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
                        text: `All ${toImport.length} records have been imported! ${
                            toImport.length !== updates.length
                                ? `(${updates.length - toImport.length} couldn't be matched, check the logs)`
                                : ""
                        }`,
                        icon: "success",
                        confirmButtonText: "Ok",
                    });

                    if (toImport.length !== updates.length) {
                        console.group("QSOs unmatched:");
                        updates.forEach(([q, matching]) => {
                            if (!matching)
                                console.info(`Callsign: ${q?.callsign} Date: ${q?.date.toFormat("yyyy-MM-dd HHmm")}`);
                        });
                        console.groupEnd;
                    }
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
                                ADIF/ADX supported
                            </Typography>
                        </Stack>
                    </Dropzone>
                    <Typography variant="h3">QSL</Typography>
                    <Typography>
                        You can upload here the exported files from respectively eqsl and lotw, it'll be matched and
                        automatically update the records appropriately
                    </Typography>
                    <Typography>First login to either service, then:</Typography>
                    <Stack direction="row">
                        <Button text="Get from LoTW" url="https://lotw.arrl.org/lotwuser/qsos?qsoscmd=adif" />
                        <Button
                            text="Get from eQSL"
                            url={`https://www.eQSL.cc/qslcard/DownloadInBox.cfm?RcvdSince=${fromDate.toFormat(
                                "yyyyMMdd",
                            )}`}
                        />
                    </Stack>
                    <Typography variant="subtitle">
                        For LoTW leave all fields as is and put the date "{fromDate.toFormat("yyyy-MM-dd")}". For eQSL
                        get the Adif file.
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
            )}
        </View>
    );
};
