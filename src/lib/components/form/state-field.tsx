import React, { useEffect } from "react";
import { useFormContext, useWatch } from "react-hook-form";
import { callsigns } from "../../data/callsigns";
import { states } from "../../data/states";
import { withState } from "../../utils/callsign";
import { QSO } from "../qso";
import { FormField } from "./form-field";

export type StateFieldProps = {
    name: "state" | "myState";
};

export const StateField = ({ name }: StateFieldProps) => {
    const { control, setValue, getValues } = useFormContext<QSO>();
    // `useWatch` rather than `watch()`: the latter only re-renders through the component that owns
    // the form, and this one is handed to a memoised parent as an element with constant props — the
    // render gets skipped, and the box goes on showing whatever the field held when it mounted.
    const value = useWatch({ control, name }) as string | undefined;
    const callsign = useWatch({ control, name: "callsign" });
    const country = useWatch({ control, name: name == "state" ? "country" : "myCountry" });
    const stateName =
        country && value && country in states && value in states[country] ? states[country][value] : undefined;

    // Only the display is derived. What's typed goes straight into the form field, so there is one
    // copy of the string rather than a box mirroring a mirror: the full state name is a label put
    // over the code while the box is idle, and typing in it gets the code back.
    const [focused, setFocused] = React.useState<boolean>(false);

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
            value={focused ? value || "" : stateName || value || ""}
            onChangeText={(v: string) => setValue(name, v)}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
        />
    );
};
