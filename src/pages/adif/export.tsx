import { DateTime } from "luxon";
import React from "react";
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
    const qsos = useQsos();
    const filteredQsos = filterQsos(qsos, filters);
    const log = useStore((state) => state.log);
    const today = DateTime.local().toFormat("yyyyMMdd");

    const handleQslDownload = (type: "lotw" | "eqsl") => () => {
        const qslQsos = qsos.filter((q) => (type === "lotw" ? !q.lotw_sent : !q.eqsl_sent));
        qslQsos.forEach((q) => (q[`${type}_sent`] = true));
        log(qslQsos);
        downloadQsos(`${today}_${type}.adif`, qslQsos);
    };

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
        </Stack>
    );
};
