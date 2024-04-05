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

export type StateFieldComponent = React.FC<StateFieldProps>;

export const StateField: StateFieldComponent = ({ name }): JSX.Element => {
    const { watch, setValue } = useFormContext<QSO>();
    const value = watch(name);
    const callsign = watch("callsign");
    const country = watch(name == "state" ? "country" : "myCountry");
    const stateName =
        country && value && country in states && value in states[country] ? states[country][value] : undefined;
    const [inputValue, setInputValue] = React.useState<string>(stateName || value || "");

    useEffect(() => {
        if (value != inputValue) setInputValue(value || "");
    }, [value]);

    useEffect(() => {
        const cs = withState(
            callsign,
            callsigns.find((c) => c.iso3 === country),
        );
        if (cs && cs.state != value) setValue("state", cs.state);
    }, [callsign]);

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
