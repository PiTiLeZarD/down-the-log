import React from "react";
import { useFormContext } from "react-hook-form";
import { states } from "../../data/states";
import { QSO } from "../qso";
import { FormField } from "./form-field";

export type StateFieldProps = {
    name: "state" | "myState";
};

export type StateFieldComponent = React.FC<StateFieldProps>;

export const StateField: StateFieldComponent = ({ name }): JSX.Element => {
    const { watch } = useFormContext<QSO>();
    const value = watch(name);
    const country = watch(name == "state" ? "country" : "myCountry");
    const stateName =
        country && value && country in states && value in states[country] ? states[country][value] : undefined;
    const [inputValue, setInputValue] = React.useState<string>(stateName || value || "");

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
