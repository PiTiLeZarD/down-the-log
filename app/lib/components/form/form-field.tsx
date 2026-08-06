import { DateTime } from "luxon";
import React, { useEffect, useEffectEvent } from "react";
import { useController, useFormContext } from "react-hook-form";
import { countries } from "../../data/countries";
import { Input } from "../../utils/theme/components/input";
import { SelectInput } from "../../utils/theme/components/select-input";
import { Typography } from "../../utils/theme/components/typography";
import { useSettings } from "../../utils/use-settings";
import { QSO } from "../qso";
import { Stack } from "../stack";

export type FormFieldProps = {
    name: keyof QSO;
    label?: React.ReactNode;
    placeholder?: string;
    numberOfLines?: number;
    role?: "text" | "select" | "textarea" | "country" | "date" | "time";
    options?: Record<string, string>;
} & Record<string, unknown>;

export const FormField = ({
    role = "text",
    name,
    label,
    placeholder,
    numberOfLines = 4,
    options,
    ...otherProps
}: FormFieldProps) => {
    const { control, setValue } = useFormContext<QSO>();
    const { field } = useController({ name, control });
    const value = String(field.value || "");

    // A picker whose value isn't one of its items shows the first item instead, so the next change event
    // writes that over a perfectly good value. Always offer the current value back as an item.
    const withCurrentValue = (items: { label: string; value: string }[]) =>
        value === "" || items.some((item) => item.value === value) ? items : [...items, { label: value, value }];

    const settings = useSettings();
    const dtFormat = role === "date" ? (settings.datemonth ? "MM-dd-yyyy" : "dd/MM/yyyy") : "HH:mm:ss";
    const dtValue =
        ["date", "time"].includes(role) && value != "" ? (field.value as DateTime).toFormat(dtFormat) : undefined;
    const [userInput, setUserInput] = React.useState<string>(dtValue || "");
    const commitUserInput = useEffectEvent(() => {
        const dt = DateTime.fromFormat(userInput, dtFormat);
        if (!dt.isValid) return;

        const prev = field.value as DateTime;
        const values = dt.toObject();
        setValue(
            name,
            prev.set(
                role === "date"
                    ? { day: values.day, month: values.month, year: values.year }
                    : { hour: values.hour, minute: values.minute, second: values.second },
            ),
        );
    });
    useEffect(() => commitUserInput(), [userInput]);

    return (
        <Stack>
            {label &&
                (typeof label === "string" ? (
                    <Typography aria-label={`Label for ${field.name}`}>{label}</Typography>
                ) : (
                    label
                ))}

            {(role === "text" || role === "textarea") && (
                <Input
                    value={value}
                    onChangeText={field.onChange}
                    placeholder={placeholder}
                    multiline={role === "textarea"}
                    numberOfLines={numberOfLines}
                    aria-label={role === "text" ? "input" : "textarea"}
                    {...(label ? { "aria-labelledby": `label${field.name}` } : {})}
                    {...otherProps}
                />
            )}

            {(role === "date" || role === "time") && (
                <Input
                    value={userInput}
                    onChangeText={(t) => setUserInput(t)}
                    placeholder={placeholder}
                    aria-label={`${role} input`}
                    {...(label ? { "aria-labelledby": `label${field.name}` } : {})}
                    {...otherProps}
                />
            )}

            {role === "select" && (
                <SelectInput
                    value={value}
                    onValueChange={field.onChange}
                    items={withCurrentValue(Object.entries(options || {}).map(([value, label]) => ({ label, value })))}
                    {...(label ? { "aria-labelledby": `label${field.name}` } : {})}
                    {...otherProps}
                />
            )}

            {role === "country" && (
                <SelectInput
                    value={value}
                    onValueChange={field.onChange}
                    items={withCurrentValue(
                        Object.entries(countries).map(([value, { name, flag }]) => ({
                            label: `${flag} ${name}`,
                            value,
                        })),
                    )}
                    {...(label ? { "aria-labelledby": `label${field.name}` } : {})}
                    {...otherProps}
                />
            )}
        </Stack>
    );
};
