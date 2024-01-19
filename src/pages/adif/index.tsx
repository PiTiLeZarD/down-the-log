import { StackScreenProps } from "@react-navigation/stack";
import React, { useEffect } from "react";
import { Platform } from "react-native";
import { createStyleSheet, useStyles } from "react-native-unistyles";
import { NavigationParamList } from "../../Navigation";
import { useStore } from "../../store";
import { adifLine2Qso, downloadQsos, splitAdifInRecords } from "../../utils/adif";
import { Dropzone, FileWithPreview } from "../../utils/dropzone";
import { PageLayout } from "../../utils/page-layout";
import { findMatchingQso, useQsos } from "../../utils/qso";
import { Stack } from "../../utils/stack";
import { Button } from "../../utils/theme/components/button";
import { Typography } from "../../utils/theme/components/typography";

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
    const settings = useStore((state) => state.settings);
    const resetStore = useStore((state) => state.resetStore);
    const [importRemaining, setImportRemaining] = React.useState<string[]>([]);
    const qsos = useQsos();
    const log = useStore((state) => state.log);

    useEffect(() => {
        if (importRemaining.length) {
            const toImport = adifLine2Qso(importRemaining[0], currentLocation, settings.myCallsign);
            const newImportRemaining = importRemaining.slice(1);
            if (toImport) log(findMatchingQso(qsos, toImport) || toImport);
            setImportRemaining(newImportRemaining);
        }
    }, [importRemaining]);

    const handleImport = (files: FileWithPreview[]) => {
        files.map((file) => {
            const fr = new FileReader();
            fr.onload = () => {
                if (fr.result) {
                    const content =
                        typeof fr.result == "string" ? fr.result : new TextDecoder("utf-8").decode(fr.result);
                    setImportRemaining(splitAdifInRecords(content));
                }
            };

            fr.readAsText(file);
        });
    };

    const handleErase = () => {
        resetStore();
        alert("done!");
    };

    return (
        <PageLayout title="Import/Export" navigate={navigation.navigate}>
            {!!importRemaining.length && (
                <Stack>
                    <Typography variant="h1">QSOs left to import: {importRemaining.length}</Typography>
                    <Typography variant="subtitle">
                        It's slow because we're backfilling all missing data (zones (itu, cq, dxcc), country/state,
                        prefex, etc...)
                    </Typography>
                </Stack>
            )}
            <Button
                startIcon="download-outline"
                text="Download"
                variant="outlined"
                onPress={() => downloadQsos("adif_export.adif", qsos)}
            />
            {!["ios", "android"].includes(Platform.OS) && (
                <Dropzone onAcceptedFiles={handleImport} style={styles.dropzone}>
                    <Typography style={styles.dropzoneText} variant="h2">
                        Upload here
                    </Typography>
                </Dropzone>
            )}

            <Button colour="secondary" text="Erase data" onPress={handleErase} />
        </PageLayout>
    );
};
