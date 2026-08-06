import { useEffect, useEffectEvent } from "react";
import { useFormContext } from "react-hook-form";
import { collapseCallsign, getCallsignData } from "../utils/callsign";
import { Alert } from "../utils/theme/components/alert";
import { Typography } from "../utils/theme/components/typography";
import { QSO } from "./qso";

export const CountryWarning = () => {
    const { watch, setValue, getValues } = useFormContext<QSO>();
    const callsign = watch("callsign");
    const country = watch("country");
    const csdata = getCallsignData(collapseCallsign(callsign));

    // Both of these read the callsign data but must only fire on the field named in the dependency
    // array, otherwise they undo what the operator just typed. Effect events keep that split explicit.
    const fillFromCallsign = useEffectEvent(() => {
        if (!csdata) return;
        if (csdata.ctn != getValues("continent")) setValue("continent", csdata.ctn);
        if (+csdata.dxcc != getValues("dxcc")) setValue("dxcc", +csdata.dxcc);
        if (csdata.gs != getValues("locator")) setValue("locator", csdata.gs);
    });
    useEffect(() => fillFromCallsign(), [country]);

    const fillCountry = useEffectEvent(() => {
        if (csdata?.iso3 && csdata.iso3 != country) setValue("country", csdata.iso3);
    });
    useEffect(() => fillCountry(), [callsign]);

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
