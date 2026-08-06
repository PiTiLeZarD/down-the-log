import { useFormContext } from "react-hook-form";
import { callsigns } from "../data/callsigns";
import { Alert } from "../ui/alert";
import { Typography } from "../ui/typography";
import { QSO } from "./qso";

export const ContinentWarning = () => {
    const { watch } = useFormContext<QSO>();
    const country = watch("country");
    const continent = watch("continent");

    const ctn = callsigns.find((c) => c.iso3 === country)?.ctn;
    if (!ctn || ctn === continent) return <></>;

    return (
        <Alert severity="warning">
            <Typography>Continent/Country mismatch</Typography>
        </Alert>
    );
};
