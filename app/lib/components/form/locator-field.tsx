import React, { useEffect } from "react";
import { useFormContext } from "react-hook-form";
import cqzones from "../../data/cqzones.json";
import ituzones from "../../data/ituzones.json";
import { maidenDistance, maidenhead2Latlong, normalise } from "../../utils/locator";
import { findZone } from "../../utils/polydec";
import { Typography } from "../../utils/theme/components/typography";
import { GmapsChip } from "../gmaps-chip";
import { QSO } from "../qso";
import { Stack } from "../stack";
import { FormField } from "./form-field";

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

    useEffect(() => {
        const gs = getValues("locator");
        if (gs) {
            const cqzone = findZone(cqzones, maidenhead2Latlong(gs));
            const ituzone = findZone(ituzones, maidenhead2Latlong(gs));
            if (+cqzone != getValues("cqzone")) setValue("cqzone", +cqzone);
            if (+ituzone != getValues("ituzone")) setValue("ituzone", +ituzone);
        }
    }, [watch("locator")]);

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
