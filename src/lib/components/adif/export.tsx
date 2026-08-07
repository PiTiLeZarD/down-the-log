import { DateTime } from "luxon";
import { downloadQsos } from "../../utils/file-format";
import { Button } from "../../ui/button";
import { Filters, useFilteredQsos } from "../filters";
import { Stack } from "../stack";

export const Export = () => {
    const filteredQsos = useFilteredQsos();
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
            </Stack>
            <Stack direction="row">
                <Button
                    startIcon="download-outline"
                    text="Download (WSJTX)"
                    variant="outlined"
                    onPress={() => downloadQsos(`wsjtx.log`, filteredQsos, "wsjtx")}
                />
                <Button
                    startIcon="download-outline"
                    text="Download (Cabrillo)"
                    variant="outlined"
                    onPress={() => downloadQsos(`${today}_export.cab`, filteredQsos, "cabrillo")}
                />
            </Stack>
        </Stack>
    );
};
