import { DateTime } from "luxon";
import React from "react";
import { useStore } from "../../store";
import { downloadQsos } from "../../utils/adif";
import { useQsos } from "../../utils/qso";
import { Stack } from "../../utils/stack";
import { Alert } from "../../utils/theme/components/alert";
import { Button } from "../../utils/theme/components/button";
import { Typography } from "../../utils/theme/components/typography";
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
            <Typography variant="h3">QSL</Typography>
            <Typography>You can download all qsos that aren't marked as sent for either lotw or eqsl here</Typography>
            <Alert severity="info">
                <Typography>QSOs will be altered and marked as sent</Typography>
            </Alert>
            <Stack direction="row">
                <Button
                    startIcon="download-outline"
                    text={`LoTW file: ${qsos.filter((q) => !q.lotw_sent).length} qsos`}
                    variant="outlined"
                    onPress={handleQslDownload("lotw")}
                />
                <Button
                    startIcon="download-outline"
                    text={`eQSL file: ${qsos.filter((q) => !q.eqsl_sent).length} qsos`}
                    variant="outlined"
                    onPress={handleQslDownload("eqsl")}
                />
            </Stack>
            <Button
                variant="chip"
                url="https://www.arrl.org/tqsl-download"
                colour="grey"
                text="Click here to download LoTW tqsl app"
            />
            <Button
                variant="chip"
                url="https://eqsl.cc/qslcard/EnterADIF.cfm"
                colour="grey"
                text="Click here to upload to eQSL"
            />
        </Stack>
    );
};
