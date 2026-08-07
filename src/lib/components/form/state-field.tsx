import React, { useEffect } from "react";
import { useFormContext } from "react-hook-form";
import { callsigns } from "../../data/callsigns";
import { states } from "../../data/states";
import { withState } from "../../utils/callsign";
import { QSO } from "../qso";
import { FormField } from "./form-field";

export type StateFieldProps = {
    name: "state" | "myState";
};

export const StateField = ({ name }: StateFieldProps) => {
    const { watch, setValue, getValues } = useFormContext<QSO>();
    const value = watch(name);
    const callsign = watch("callsign");
    const country = watch(name == "state" ? "country" : "myCountry");
    const stateName =
        country && value && country in states && value in states[country] ? states[country][value] : undefined;
    const [inputValue, setInputValue] = React.useState<string>(stateName || value || "");

    // The box mirrors the form field, so it resyncs during render instead of from an effect.
    const [renderedFor, setRenderedFor] = React.useState<string | undefined>(value);
    if (renderedFor !== value) {
        setRenderedFor(value);
        if (value != inputValue) setInputValue(value || "");
    }

    useEffect(() => {
        // Only the worked station's state can be read off a callsign. `myState` comes from the
        // operator's own settings, so this must not write into the form when that's what we render.
        if (name !== "state") return;

        const cs = withState(
            callsign,
            callsigns.find((c) => c.iso3 === country),
        );
        if (cs && cs.state != getValues("state")) setValue("state", cs.state);
    }, [callsign, country, name, getValues, setValue]);

    return (
        <FormField
            name={name}
            label={name === "state" ? "State:" : "My State:"}
            value={inputValue}
            onFocus={() => setInputValue(value || "")}
            onBlur={() => setInputValue(stateName || value || "")}
        />
    );
};
