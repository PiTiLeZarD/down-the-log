import React from "react";
import { Platform, View } from "react-native";
import { StyleSheet, useUnistyles } from "react-native-unistyles";
import { getFileApiFromFilename, record2qso } from "../../utils/file-format";
import { useStore } from "../../utils/store";
import { Typography } from "../../utils/theme/components/typography";
import { fireSwal } from "../../utils/theme/swal";
import { useSettings } from "../../utils/use-settings";
import { Dropzone, FileWithPreview } from "../dropzone";
import { QSO, findMatchingQso, prefillLocation, prefillMyStation, useQsos } from "../qso";
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

export type ImportProps = {};

export type ImportComponent = React.FC<ImportProps>;

export const Import: ImportComponent = (): React.JSX.Element => {
    const { theme } = useUnistyles();
    const qsos = useQsos();
    const log = useStore((state) => state.log);
    const currentLocation = useStore((state) => state.currentLocation);
    const settings = useSettings();

    const handleImport = (files: FileWithPreview[]) => {
        files.map((file) => {
            const fr = new FileReader();
            fr.onload = () => {
                if (fr.result) {
                    const content =
                        typeof fr.result == "string" ? fr.result : new TextDecoder("utf-8").decode(fr.result);

                    const toImport: QSO[] = getFileApiFromFilename(file.name)
                        .parseFile(content)
                        .map((r) => record2qso(r))
                        .map((q) =>
                            prefillLocation(
                                prefillMyStation(q, { myCallsign: settings.myCallsign, myLocator: currentLocation }),
                            ),
                        )
                        .map((q) => {
                            const matching = findMatchingQso(qsos, q);
                            if (matching) {
                                q.id = matching.id;
                            }
                            return q;
                        });
                    log(toImport);
                    fireSwal({
                        theme,
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
