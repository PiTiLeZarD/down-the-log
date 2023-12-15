import { NativeStackScreenProps } from "@react-navigation/native-stack";
import React from "react";
import { View } from "react-native";
import uuid from "react-native-uuid";
import { RootStackParamList } from "../../RootStack";
import { useStore } from "../../store";
import { adifFile2Qso, downloadQsos } from "../../utils/adif";
import { Dropzone, FileWithPreview } from "../../utils/dropzone";
import { QSO, findMatchingQso, useQsos } from "../../utils/qso";
import { Button } from "../../utils/theme/components/button";
import { Typography } from "../../utils/theme/components/typography";

export type AdifProps = {} & NativeStackScreenProps<RootStackParamList, "Adif">;

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
        <View>
            <Typography>Adif</Typography>
            <Button text="Download" onPress={() => downloadQsos("adif_export.adif", qsos)} />

            <Dropzone onAcceptedFiles={handleImport} sx={{ margin: 5, padding: 5 }}>
                <Typography style={{ fontWeight: "bold", textAlign: "center" }}>Upload here</Typography>
            </Dropzone>

            <Button text="Back" onPress={() => navigation.goBack()} />
        </View>
    );
};
