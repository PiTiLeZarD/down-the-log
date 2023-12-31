import React from "react";
import { useFormContext } from "react-hook-form";
import { getCallsignData } from "../../utils/callsign";
import { QSO } from "../../utils/qso";
import { Alert } from "../../utils/theme/components/alert";
import { Typography } from "../../utils/theme/components/typography";

export type CountryWarningProps = {};

export type CountryWarningComponent = React.FC<CountryWarningProps>;

export const CountryWarning: CountryWarningComponent = (): JSX.Element => {
    const { watch } = useFormContext<QSO>();
    const callsign = watch("callsign");
    const country = watch("country");

    const csdata = getCallsignData(callsign);
    if (!csdata || csdata.iso3 == country) return <></>;
    return (
        <Alert severity="warning">
            <Typography>The country selected doesn't match the callsign</Typography>
        </Alert>
    );
};
