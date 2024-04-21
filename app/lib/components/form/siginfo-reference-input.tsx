import React from "react";
import { useFormContext } from "react-hook-form";
import { Input } from "../../utils/theme/components/input";
import { QSO } from "../qso";
import { ReferenceInfo } from "../reference-info";
import { Stack } from "../stack";

export type SiginfoReferenceInputProps = {
    mine?: boolean;
};

export type SiginfoReferenceInputComponent = React.FC<SiginfoReferenceInputProps>;

export const SiginfoReferenceInput: SiginfoReferenceInputComponent = ({ mine }): JSX.Element => {
    const { getValues, setValue } = useFormContext<QSO>();
    const qso = getValues();
    const event = qso[(mine ? "mySig" : "sig") as keyof QSO] as string;
    const key = (mine ? "mySigInfo" : "sigInfo") as keyof QSO;
    const value = qso[key] as string;

    return (
        <Stack>
            <Input value={value} onChangeText={(v) => setValue(key, v.toUpperCase())} />
            <ReferenceInfo event="sig" reference={value} info={event} />
        </Stack>
    );
};
