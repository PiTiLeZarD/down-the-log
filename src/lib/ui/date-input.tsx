import { DateTime } from "luxon";
import React from "react";
import { useSettings } from "../utils/use-settings";
import { Input, InputProps } from "./input";

// The shape a day is held in outside a QSO — the same yyyyMMdd the log writes a UTC day in.
export const storedDateFormat = "yyyyMMdd";

export const userDateFormat = (datemonth: boolean): string => (datemonth ? "MM-dd-yyyy" : "dd/MM/yyyy");

export const parseUserDate = (typed: string, format: string): DateTime => {
    const padded = DateTime.fromFormat(typed, format, { zone: "utc" });
    // Luxon reads `dd` as exactly two digits, so 1/1/2026 doesn't parse against dd/MM/yyyy. Nobody
    // types the leading zeros, so the unpadded spelling gets a go too.
    return padded.isValid
        ? padded
        : DateTime.fromFormat(typed, format.replace("dd", "d").replace("MM", "M"), { zone: "utc" });
};

export type DateInputProps = Omit<InputProps, "value" | "onChange" | "onChangeText"> & {
    // yyyyMMdd, or nothing when the field is empty.
    value?: string;
    onChange: (value: string | undefined) => void;
};

// A date on its own, away from the QSO form and the react-hook-form field the QSO's dates go
// through. Typed in whichever order the operator picked in the settings, held as yyyyMMdd, and
// only reported once what's typed parses — half a date is one the operator hasn't finished typing.
export const DateInput = ({ value, onChange, ...otherProps }: DateInputProps) => {
    const format = userDateFormat(useSettings().datemonth);
    const shown = value ? DateTime.fromFormat(value, storedDateFormat, { zone: "utc" }).toFormat(format) : "";
    const [text, setText] = React.useState<string>(shown);

    // The prop wins when it changes underneath us — cleared elsewhere, or the date format flipped.
    // Resynced during render rather than in an effect, the same way Input mirrors its own value.
    const [renderedFor, setRenderedFor] = React.useState<string>(shown);
    if (renderedFor !== shown) {
        setRenderedFor(shown);
        setText(shown);
    }

    const handleChange = (typed: string) => {
        setText(typed);
        const dt = parseUserDate(typed, format);
        if (dt.isValid) onChange(dt.toFormat(storedDateFormat));
        else if (typed === "") onChange(undefined);
    };

    return <Input value={text} onChangeText={handleChange} placeholder={format.toLowerCase()} {...otherProps} />;
};
