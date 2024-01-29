import React, { useEffect } from "react";
import { useFormContext } from "react-hook-form";
import { FormField } from "../../utils/form-field";
import { maidenDistance, normalise } from "../../utils/locator";
import { QSO } from "../../utils/qso";
import { Stack } from "../../utils/stack";
import { Typography } from "../../utils/theme/components/typography";
import { GmapsChip } from "./gmaps-chip";

export type LocatorFieldProps = {
    name: "locator" | "myLocator";
    label: string;
};

export type LocatorFieldComponent = React.FC<LocatorFieldProps>;

export const LocatorField: LocatorFieldComponent = ({ name, label }): JSX.Element => {
    const { watch, getValues, setValue } = useFormContext<QSO>();
    useEffect(() => {
        const values = getValues();
        setValue(name, normalise(values[name]));
        if (values.myLocator && values.locator) setValue("distance", maidenDistance(values.myLocator, values.locator));
    }, [watch("locator"), watch("myLocator")]);
    return (
        <FormField
            name={name}
            label={
                <Stack direction="row">
                    <Typography style={{ flexGrow: 1 }}>{label}</Typography>
                    <GmapsChip locator={getValues().locator} />
                </Stack>
            }
        />
    );
};
