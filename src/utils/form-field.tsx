import React from "react";
import { useController, useFormContext } from "react-hook-form";
import { Text, View } from "react-native";
import { QSO } from "./qso";
import { Input } from "./theme/components/input";
import { SelectInput } from "./theme/components/select-input";

export type FormFieldProps = {
    name: keyof QSO;
    label?: string;
    placeholder?: string;
    numberOfLines?: number;
    role?: "text" | "select" | "textarea";
    options?: Record<string, string>;
};

export type FormFieldComponent = React.FC<FormFieldProps>;

export const FormField: FormFieldComponent = ({
    role = "text",
    name,
    label,
    placeholder,
    numberOfLines = 4,
    options,
}): JSX.Element => {
    const { control } = useFormContext();
    const { field } = useController({ name, control });

    const value = String(field.value || "");

    return (
        <View>
            {label && (
                <Text aria-label={`Label for ${field.name}`} id={`label${field.name}`}>
                    {label}
                </Text>
            )}

            {(role === "text" || role === "textarea") && (
                <Input
                    value={value}
                    onChangeText={field.onChange}
                    placeholder={placeholder}
                    multiline={role === "textarea"}
                    numberOfLines={numberOfLines}
                    aria-label={role === "text" ? "input" : "textarea"}
                    {...(label ? { "aria-labelledby": `label${field.name}` } : {})}
                />
            )}

            {role === "select" && (
                <SelectInput
                    value={value}
                    onValueChange={field.onChange}
                    items={Object.entries(options || {}).map(([value, label]) => ({ label, value }))}
                    {...(label ? { "aria-labelledby": `label${field.name}` } : {})}
                />
            )}
        </View>
    );
};
