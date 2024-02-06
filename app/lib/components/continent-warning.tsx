import React from "react";
import { useFormContext } from "react-hook-form";
import { getCallsignData } from "../utils/callsign";
import { Alert } from "../utils/theme/components/alert";
import { Typography } from "../utils/theme/components/typography";
import { QSO } from "./qso";

export type ContinentWarningProps = {};

export type ContinentWarningComponent = React.FC<ContinentWarningProps>;

export const ContinentWarning: ContinentWarningComponent = (): JSX.Element => {
    const { watch } = useFormContext<QSO>();
    const callsign = watch("callsign");
    const continent = watch("continent");

    const csdata = getCallsignData(callsign);
    if (!csdata || csdata.ctn == continent) return <></>;
    return (
        <Alert severity="warning">
            <Typography>Continent/Callsign mismatch</Typography>
        </Alert>
    );
};
