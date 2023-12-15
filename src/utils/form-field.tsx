import React from "react";
import { Control, useController } from "react-hook-form";
import { Text, View } from "react-native";
import RNPickerSelect from "react-native-picker-select";
import { QSO } from "./qso";
import { Input } from "./theme/components/input";

export type FormFieldProps = {
    name: keyof QSO;
    label?: string;
    placeholder?: string;
    numberOfLines?: number;
    role?: "text" | "select" | "textarea";
    options?: Record<string, string>;
    control: Control<QSO, string>;
};

export type FormFieldComponent = React.FC<FormFieldProps>;

export const FormField: FormFieldComponent = ({
    role = "text",
    name,
    label,
    placeholder,
    numberOfLines = 4,
    options,
    control,
}): JSX.Element => {
    const { field } = useController({ name, control });

    const value = String(field.value || "");

    return (
        <View>
            {label && (
                <Text aria-label={`Label for ${field.name}`} nativeID={`label${field.name}`}>
                    {label}
                </Text>
            )}

            {(role === "text" || role === "textarea") && (
                <Input
                    value={value}
                    onChangeText={field.onChange}
                    placeholder={placeholder}
                    aria-label="input"
                    multiline={role === "textarea"}
                    numberOfLines={numberOfLines}
                    {...(label ? { "aria-labelledby": `label${field.name}` } : {})}
                />
            )}

            {role === "select" && (
                <RNPickerSelect
                    style={{
                        inputWeb: {
                            borderWidth: 1,
                            borderStyle: "solid",
                            borderColor: "black",
                            borderRadius: 3,
                            padding: 8,
                            backgroundColor: "inherit",
                        },
                    }}
                    value={value}
                    onValueChange={field.onChange}
                    items={Object.entries(options || {}).map(([value, label]) => ({ label, value }))}
                />
            )}
        </View>
    );
};
