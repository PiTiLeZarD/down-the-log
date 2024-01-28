import React from "react";
import { View } from "react-native";
import { useStore } from "../../store";
import { downloadQsos } from "../../utils/adif";
import { useQsos } from "../../utils/qso";
import { Stack } from "../../utils/stack";
import { Button } from "../../utils/theme/components/button";
import { Filters, filterQsos } from "../home/filters";

export type ExportProps = {};

export type ExportComponent = React.FC<ExportProps>;

export const Export: ExportComponent = (): JSX.Element => {
    const filters = useStore((state) => state.filters);
    const qsos = filterQsos(useQsos(), filters);

    return (
        <View>
            <Filters />
            <Stack direction="row">
                <Button
                    startIcon="download-outline"
                    text="Download (ADIF)"
                    variant="outlined"
                    onPress={() => downloadQsos("adif_export.adif", qsos)}
                />
                <Button
                    startIcon="download-outline"
                    text="Download (ADX)"
                    variant="outlined"
                    onPress={() => downloadQsos("adx_export.adx", qsos, "adx")}
                />
            </Stack>
        </View>
    );
};
