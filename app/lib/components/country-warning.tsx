import React from "react";
import { useFormContext } from "react-hook-form";
import { collapseCallsign, getCallsignData } from "../utils/callsign";
import { Alert } from "../utils/theme/components/alert";
import { Typography } from "../utils/theme/components/typography";
import { QSO } from "./qso";

export type CountryWarningProps = {};

export type CountryWarningComponent = React.FC<CountryWarningProps>;

export const CountryWarning: CountryWarningComponent = (): JSX.Element => {
    const { watch } = useFormContext<QSO>();
    const callsign = watch("callsign");
    const country = watch("country");

    const csdata = getCallsignData(collapseCallsign(callsign));
    if (!csdata || csdata.iso3 == country) return <></>;
    return (
        <Alert severity="warning">
            <Typography>The country selected doesn't match the callsign</Typography>
        </Alert>
    );
};
