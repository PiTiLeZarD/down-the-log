import { useFormContext } from "react-hook-form";
import { callsigns } from "../data/callsigns";
import { Alert } from "../utils/theme/components/alert";
import { Typography } from "../utils/theme/components/typography";
import { QSO } from "./qso";

export type ContinentWarningProps = {};

export type ContinentWarningComponent = React.FC<ContinentWarningProps>;

export const ContinentWarning: ContinentWarningComponent = (): JSX.Element => {
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
