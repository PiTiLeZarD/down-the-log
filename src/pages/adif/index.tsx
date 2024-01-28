import { StackScreenProps } from "@react-navigation/stack";
import React, { useEffect } from "react";
import { Platform } from "react-native";
import { createStyleSheet, useStyles } from "react-native-unistyles";
import Swal from "sweetalert2";
import { NavigationParamList } from "../../Navigation";
import { useStore } from "../../store";
import { adifFileToRecordList, adxFileToRecordList, downloadQsos, record2qso } from "../../utils/adif";
import { unique } from "../../utils/arrays";
import { Dropzone, FileWithPreview } from "../../utils/dropzone";
import { PageLayout } from "../../utils/page-layout";
import { QSO, findMatchingQso, qsoLocationFill, useQsos } from "../../utils/qso";
import { Stack } from "../../utils/stack";
import { Alert } from "../../utils/theme/components/alert";
import { Button } from "../../utils/theme/components/button";
import { Icon } from "../../utils/theme/components/icon";
import { Typography } from "../../utils/theme/components/typography";
import { SwalTheme } from "../../utils/theme/theme";
import { useSettings } from "../../utils/use-settings";
import { Filters, filterQsos } from "../home/filters";

const stylesheet = createStyleSheet((theme) => ({
    dropzone: {
        display: "flex",
        width: "100%",
        height: 300,
        backgroundColor: theme.colours.primary[theme.shades.light],
        borderRadius: 15,
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

export type AdifProps = {} & StackScreenProps<NavigationParamList, "Adif">;

export type AdifComponent = React.FC<AdifProps>;

export const Adif: AdifComponent = ({ navigation }): JSX.Element => {
    const { styles } = useStyles(stylesheet);
    const currentLocation = useStore((state) => state.currentLocation);
    const settings = useSettings();
    const resetStore = useStore((state) => state.resetStore);
    const filters = useStore((state) => state.filters);
    const [importRemaining, setImportRemaining] = React.useState<QSO[]>([]);
    const [importing, setImporting] = React.useState<boolean>(false);
    const qsos = useQsos();
    const honeypotFields = unique(
        qsos
            .map((q) => Object.keys(q.honeypot || {}))
            .flat()
            .filter((e) => !!e),
    );
    const log = useStore((state) => state.log);

    useEffect(() => {
        if (importRemaining.length) {
            let toImport = importRemaining[0];
            if (!toImport.myLocator) toImport.myLocator = currentLocation;
            if (!toImport.myCallsign) toImport.myCallsign = settings.myCallsign;
            toImport = qsoLocationFill(toImport);

            const newImportRemaining = importRemaining.slice(1);
            if (toImport) {
                const matching = findMatchingQso(qsos, toImport);
                if (matching) {
                    toImport.id = matching.id;
                    log({ ...matching, ...toImport });
                } else {
                    log(toImport);
                }
            }
            setImportRemaining(newImportRemaining);
        } else if (importing) {
            Swal.fire({
                ...SwalTheme,
                title: "Done!",
                text: "All records have been imported!",
                icon: "success",
                confirmButtonText: "Ok",
            });
            setImporting(false);
        }
    }, [importRemaining]);

    const handleImport = (files: FileWithPreview[]) => {
        files.map((file) => {
            const fr = new FileReader();
            fr.onload = () => {
                if (fr.result) {
                    const content =
                        typeof fr.result == "string" ? fr.result : new TextDecoder("utf-8").decode(fr.result);
                    setImportRemaining(
                        (file.name.endsWith("adx") ? adxFileToRecordList(content) : adifFileToRecordList(content)).map(
                            (r) => record2qso(r),
                        ),
                    );
                    setImporting(true);
                }
            };

            fr.readAsText(file);
        });
    };

    const handleErase = () => {
        resetStore();
        Swal.fire({
            ...SwalTheme,
            title: "Done!",
            text: "All records have been erased!",
            icon: "success",
            confirmButtonText: "Ok",
        });
    };

    return (
        <PageLayout title="Import/Export" navigate={navigation.navigate}>
            <Alert severity="info">
                <Typography variant="em">
                    Import/Export is lossless, if this app doesn't handle an attribute, it'll keep it so you don't lose
                    it on export
                </Typography>
            </Alert>
            {!!importRemaining.length && (
                <Stack>
                    <Typography variant="h1">QSOs left to import: {importRemaining.length}</Typography>
                    <Typography variant="subtitle">
                        It's slow because we're backfilling all missing data (zones (itu, cq, dxcc), country/state,
                        prefex, etc...)
                    </Typography>
                </Stack>
            )}
            <Filters />
            <Stack direction="row">
                <Button
                    startIcon="download-outline"
                    text="Download (ADIF)"
                    variant="outlined"
                    onPress={() => downloadQsos("adif_export.adif", filterQsos(qsos, filters))}
                />
                <Button
                    startIcon="download-outline"
                    text="Download (ADX)"
                    variant="outlined"
                    onPress={() => downloadQsos("adx_export.adx", filterQsos(qsos, filters), "adx")}
                />
            </Stack>
            {!["ios", "android"].includes(Platform.OS) && (
                <Dropzone onAcceptedFiles={handleImport} style={styles.dropzone}>
                    <Stack>
                        <Typography style={styles.dropzoneText} variant="h2">
                            Upload here by clicking or dropping a file
                        </Typography>
                        <Typography variant="subtitle" style={{ textAlign: "center" }}>
                            ADIF/ADX supported
                        </Typography>
                    </Stack>
                </Dropzone>
            )}

            {honeypotFields.length > 0 && (
                <Alert>
                    <Stack>
                        <Typography>A number of fields imported aren't handled by this application</Typography>
                        <Typography>
                            if they are important to you, see the about section of this app to reach me, I'll add them
                            to my todolist
                        </Typography>
                        {honeypotFields.map((f) => (
                            <Typography key={f} variant="subtitle">
                                <Icon name="arrow-forward" />
                                {f}
                            </Typography>
                        ))}
                    </Stack>
                </Alert>
            )}

            <Button colour="secondary" text="Erase data" onPress={handleErase} />
        </PageLayout>
    );
};
