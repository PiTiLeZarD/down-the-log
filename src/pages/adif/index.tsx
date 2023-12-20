import { DrawerScreenProps } from "@react-navigation/drawer";
import React from "react";
import { createStyleSheet, useStyles } from "react-native-unistyles";
import uuid from "react-native-uuid";
import { NavigationParamList } from "../../Navigation";
import { useStore } from "../../store";
import { adifFile2Qso, downloadQsos } from "../../utils/adif";
import { Dropzone, FileWithPreview } from "../../utils/dropzone";
import { PageLayout } from "../../utils/page-layout";
import { QSO, findMatchingQso, useQsos } from "../../utils/qso";
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

export type AdifProps = {} & DrawerScreenProps<NavigationParamList, "Adif">;

export type AdifComponent = React.FC<AdifProps>;

export const Adif: AdifComponent = ({ navigation }): JSX.Element => {
    const { styles } = useStyles(stylesheet);
    const resetStore = useStore((state) => state.resetStore);
    const qsos = useQsos();
    const log = useStore((state) => state.log);

    const handleImport = (files: FileWithPreview[]) => {
        files.map((file) => {
            const fr = new FileReader();
            fr.onload = () => {
                if (fr.result) {
                    const qsos: QSO[] = adifFile2Qso(
                        typeof fr.result == "string" ? fr.result : new TextDecoder("utf-8").decode(fr.result),
                    );
                    qsos.forEach((q) => {
                        const matchingQso = findMatchingQso(qsos, q) || { id: uuid.v4() as string };
                        log({ ...matchingQso, ...q });
                    });
                    alert("done!");
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
        <PageLayout title="Import/Export">
            <Button
                startIcon="download-outline"
                text="Download"
                variant="outlined"
                onPress={() => downloadQsos("adif_export.adif", qsos)}
            />

            <Dropzone onAcceptedFiles={handleImport} style={styles.dropzone}>
                <Typography style={styles.dropzoneText} variant="h2">
                    Upload here
                </Typography>
            </Dropzone>

            <Button colour="secondary" text="Erase data" onPress={handleErase} />

            <Button text="Back" onPress={() => navigation.goBack()} />
        </PageLayout>
    );
};
