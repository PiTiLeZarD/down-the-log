import React from "react";
import { useController, useFormContext } from "react-hook-form";
import { countries } from "../data/countries";
import { QSO } from "./qso";
import { Stack } from "./stack";
import { Input } from "./theme/components/input";
import { SelectInput } from "./theme/components/select-input";
import { Typography } from "./theme/components/typography";

export type FormFieldProps = {
    name: keyof QSO;
    label?: string;
    placeholder?: string;
    numberOfLines?: number;
    role?: "text" | "select" | "textarea" | "country";
    options?: Record<string, string>;
} & Record<string, unknown>;

export type FormFieldComponent = React.FC<FormFieldProps>;

export const FormField: FormFieldComponent = ({
    role = "text",
    name,
    label,
    placeholder,
    numberOfLines = 4,
    options,
    ...otherProps
}): JSX.Element => {
    const { control } = useFormContext();
    const { field } = useController({ name, control });

    const value = String(field.value || "");

    return (
        <Stack>
            {label && <Typography aria-label={`Label for ${field.name}`}>{label}</Typography>}

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

            {role === "select" && (
                <SelectInput
                    value={value}
                    onValueChange={field.onChange}
                    items={Object.entries(options || {}).map(([value, label]) => ({ label, value }))}
                    {...(label ? { "aria-labelledby": `label${field.name}` } : {})}
                    {...otherProps}
                />
            )}

            {role === "country" && (
                <SelectInput
                    value={value}
                    onValueChange={field.onChange}
                    items={Object.entries(countries).map(([value, { name, flag }]) => ({
                        label: `${flag} ${name}`,
                        value,
                    }))}
                    {...(label ? { "aria-labelledby": `label${field.name}` } : {})}
                    {...otherProps}
                />
            )}
        </Stack>
    );
};
