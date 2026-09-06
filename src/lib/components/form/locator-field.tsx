import React, { useEffect, useEffectEvent } from "react";
import { useController, useFormContext } from "react-hook-form";
import cqzones from "../../data/cqzones.json";
import ituzones from "../../data/ituzones.json";
import { Input } from "../../ui/input";
import { Typography } from "../../ui/typography";
import { isLocator, maidenDistance, maidenhead2Latlong, normalise } from "../../utils/locator";
import { findZone } from "../../utils/polydec";
import { QSO } from "../qso";
import { Stack } from "../stack";

export type LocatorFieldProps = {
    name: "locator" | "myLocator";
    label: string;
};

export const LocatorField = ({ name, label }: LocatorFieldProps) => {
    const { control, watch, getValues, setValue } = useFormContext<QSO>();
    const { field } = useController({ name, control });
    const locator = watch("locator");
    const myLocator = watch("myLocator");
    const fieldValue = String(field.value || "");

    // The box holds what was typed, not what a normalise of a half written grid makes of it. Tidying
    // every keystroke rewrote "IO9" mid-word and fought a paste over a selected grid, so the case is
    // only fixed once the whole thing reads as a locator.
    const [text, setText] = React.useState<string>(fieldValue);
    const [editing, setEditing] = React.useState<boolean>(false);
    const [renderedFor, setRenderedFor] = React.useState<string>(fieldValue);
    if (!editing && renderedFor !== fieldValue) {
        setRenderedFor(fieldValue);
        if (fieldValue !== text) setText(fieldValue);
    }

    // Autofill from the callsign, a park reference or the geocoder writes the form field, and while
    // the operator is in the box those writes stay out of sight until they leave it: clearing a grid
    // to paste another one used to hand the old one straight back.
    const handleChange = (value: string) => {
        setText(value);
        setValue(name, (isLocator(value) ? normalise(value) : value) || undefined);
    };

    const measure = useEffectEvent(() => {
        const values = getValues();
        if (isLocator(values.myLocator) && isLocator(values.locator))
            setValue("distance", maidenDistance(values.myLocator as string, values.locator as string));
    });
    useEffect(() => measure(), [locator, myLocator]);

    const fillZones = useEffectEvent(() => {
        const gs = getValues("locator");
        if (!isLocator(gs)) return;

        const cqzone = findZone(cqzones, maidenhead2Latlong(gs as string));
        const ituzone = findZone(ituzones, maidenhead2Latlong(gs as string));
        if (+cqzone != getValues("cqzone")) setValue("cqzone", +cqzone);
        if (+ituzone != getValues("ituzone")) setValue("ituzone", +ituzone);
    });
    useEffect(() => fillZones(), [locator]);

    // No map chip here: the QSO map further down the form already plots both gridsquares.
    return (
        <Stack>
            <Typography aria-label={`Label for ${name}`}>{label}</Typography>
            <Input
                value={text}
                onChangeText={handleChange}
                onFocus={() => setEditing(true)}
                onBlur={() => setEditing(false)}
                aria-label="input"
                aria-labelledby={`label${name}`}
            />
        </Stack>
    );
};
