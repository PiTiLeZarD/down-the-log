import { EventType } from "../../utils/event-rules";
import { sessionFieldLabel } from "../../utils/session";
import { Typography } from "../../ui/typography";
import { BandFreqInput } from "../form/band-freq-input";
import { FormField } from "../form/form-field";
import { ModeInput } from "../form/mode-input";
import { ParkReferenceInput } from "../form/park-reference-input";
import { SiginfoReferenceInput } from "../form/siginfo-reference-input";
import { StateField } from "../form/state-field";
import { QSO } from "../qso";
import { Stack } from "../stack";

// Session defaults are edited through the very same inputs the QSO form uses — the session's editor
// is a react-hook-form context over a Partial<QSO>, so a park reference still autocompletes and
// still fills in the QTH and gridsquare beside it.
const parkFields: Partial<Record<keyof QSO, EventType>> = {
    myPota: "pota",
    myWwff: "wwff",
    mySota: "sota",
    myIota: "iota",
};

export type SessionFieldProps = {
    field: keyof QSO;
};

export const SessionField = ({ field }: SessionFieldProps) => {
    const label = sessionFieldLabel(field);
    const park = parkFields[field];

    if (park)
        return (
            <Stack>
                <Typography>{label}:</Typography>
                <ParkReferenceInput event={park} mine />
            </Stack>
        );

    if (field === "mySigInfo")
        return (
            <Stack>
                <Typography>{label}:</Typography>
                <SiginfoReferenceInput mine />
            </Stack>
        );

    if (field === "myState") return <StateField name="myState" />;
    if (field === "myCountry") return <FormField role="country" name="myCountry" label={`${label}:`} />;
    if (field === "mode") return <ModeInput />;
    // One control covers both. A session holding band and frequency draws it once — see the dedupe
    // in the modal — because the input writes them as a pair anyway.
    if (field === "band" || field === "frequency") return <BandFreqInput />;

    return <FormField name={field} label={`${label}:`} numeric={field === "power"} />;
};
