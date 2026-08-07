import { useEffect, useEffectEvent } from "react";
import { useFormContext } from "react-hook-form";
import cqzones from "../../data/cqzones.json";
import ituzones from "../../data/ituzones.json";
import { maidenDistance, maidenhead2Latlong, normalise } from "../../utils/locator";
import { findZone } from "../../utils/polydec";
import { QSO } from "../qso";
import { FormField } from "./form-field";

export type LocatorFieldProps = {
    name: "locator" | "myLocator";
    label: string;
};

export const LocatorField = ({ name, label }: LocatorFieldProps) => {
    const { watch, getValues, setValue } = useFormContext<QSO>();
    const locator = watch("locator");
    const myLocator = watch("myLocator");

    const normaliseAndMeasure = useEffectEvent(() => {
        const values = getValues();
        setValue(name, normalise(values[name]));
        if (values.myLocator && values.locator) setValue("distance", maidenDistance(values.myLocator, values.locator));
    });
    useEffect(() => normaliseAndMeasure(), [locator, myLocator]);

    const fillZones = useEffectEvent(() => {
        const gs = getValues("locator");
        if (!gs) return;

        const cqzone = findZone(cqzones, maidenhead2Latlong(gs));
        const ituzone = findZone(ituzones, maidenhead2Latlong(gs));
        if (+cqzone != getValues("cqzone")) setValue("cqzone", +cqzone);
        if (+ituzone != getValues("ituzone")) setValue("ituzone", +ituzone);
    });
    useEffect(() => fillZones(), [locator]);

    // No map chip here: the QSO map further down the form already plots both gridsquares.
    return <FormField name={name} label={label} />;
};
