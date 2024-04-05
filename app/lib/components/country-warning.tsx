import React, { useEffect } from "react";
import { useFormContext } from "react-hook-form";
import { callsigns } from "../data/callsigns";
import { collapseCallsign, getCallsignData } from "../utils/callsign";
import { Alert } from "../utils/theme/components/alert";
import { Typography } from "../utils/theme/components/typography";
import { QSO } from "./qso";

export type CountryWarningProps = {};

export type CountryWarningComponent = React.FC<CountryWarningProps>;

export const CountryWarning: CountryWarningComponent = (): JSX.Element => {
    const { watch, setValue, getValues } = useFormContext<QSO>();
    const callsign = watch("callsign");
    const country = watch("country");
    const csdata = getCallsignData(collapseCallsign(callsign));

    useEffect(() => {
        const cs = callsigns.find((c) => c.iso3 === country);
        if (cs) {
            if (cs.ctn != getValues("continent")) setValue("continent", cs.ctn);
            if (+cs.dxcc != getValues("dxcc")) setValue("dxcc", +cs.dxcc);
            if (cs.gs != getValues("locator")) setValue("locator", cs.gs);
        }
    }, [country]);

    useEffect(() => {
        if (csdata?.iso3 && csdata.iso3 != country) setValue("country", csdata.iso3);
    }, [callsign]);

    if (!csdata) return <></>;

    if (csdata.iso3 !== country)
        return (
            <Alert severity="warning">
                <Typography>The country selected doesn't match the callsign</Typography>
            </Alert>
        );
    if (+csdata.dxcc !== getValues("dxcc"))
        return (
            <Alert severity="warning">
                <Typography>The country selected doesn't match the dxcc</Typography>
            </Alert>
        );

    return <></>;
};
