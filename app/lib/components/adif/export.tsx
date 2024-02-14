import { DateTime } from "luxon";
import React from "react";
import { downloadQsos } from "../../utils/adif";
import { useStore } from "../../utils/store";
import { Button } from "../../utils/theme/components/button";
import { Filters, filterQsos } from "../filters";
import { useQsos } from "../qso";
import { Stack } from "../stack";

export type ExportProps = {};

export type ExportComponent = React.FC<ExportProps>;

export const Export: ExportComponent = (): JSX.Element => {
    const filters = useStore((state) => state.filters);
    const qsos = useQsos();
    const filteredQsos = filterQsos(qsos, filters);
    const today = DateTime.local().toFormat("yyyyMMdd");

    return (
        <Stack gap="xxl">
            <Filters />
            <Stack direction="row">
                <Button
                    startIcon="download-outline"
                    text="Download (ADIF)"
                    variant="outlined"
                    onPress={() => downloadQsos(`${today}_adif_export.adif`, filteredQsos)}
                />
                <Button
                    startIcon="download-outline"
                    text="Download (ADX)"
                    variant="outlined"
                    onPress={() => downloadQsos(`${today}_adx_export.adx`, filteredQsos, "adx")}
                />
                <Button
                    startIcon="download-outline"
                    text="Download (WSJTX)"
                    variant="outlined"
                    onPress={() => downloadQsos(`wsjtx.log`, filteredQsos, "wsjtx")}
                />
            </Stack>
        </Stack>
    );
};
