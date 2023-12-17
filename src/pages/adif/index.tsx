import { Ionicons } from "@expo/vector-icons";
import { DrawerScreenProps } from "@react-navigation/drawer";
import React from "react";
import { Text } from "react-native";
import uuid from "react-native-uuid";
import { NavigationParamList } from "../../Navigation";
import { useStore } from "../../store";
import { adifFile2Qso, downloadQsos } from "../../utils/adif";
import { Dropzone, FileWithPreview } from "../../utils/dropzone";
import { PageLayout } from "../../utils/page-layout";
import { QSO, findMatchingQso, useQsos } from "../../utils/qso";
import { Stack } from "../../utils/stack";
import { Button } from "../../utils/theme/components/button";
import { Typography } from "../../utils/theme/components/typography";

export type AdifProps = {} & DrawerScreenProps<NavigationParamList, "Adif">;

export type AdifComponent = React.FC<AdifProps>;

export const Adif: AdifComponent = ({ navigation }): JSX.Element => {
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
                }
            };

            fr.readAsText(file);
        });
    };

    return (
        <PageLayout title="Import/Export">
            <Button
                text={
                    <Stack direction="row" style={{ justifyContent: "center" }}>
                        <Ionicons name="download-outline" size={24} color="black" />
                        <Text>Download</Text>
                    </Stack>
                }
                variant="outlined"
                onPress={() => downloadQsos("adif_export.adif", qsos)}
            />

            <Dropzone onAcceptedFiles={handleImport} sx={{ margin: 5, padding: 5 }}>
                <Typography style={{ fontWeight: "bold", textAlign: "center" }}>Upload here</Typography>
            </Dropzone>

            <Button text="Back" onPress={() => navigation.goBack()} />
        </PageLayout>
    );
};
