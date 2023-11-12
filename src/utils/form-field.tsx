import {
    ChevronDownIcon,
    FormControl,
    FormControlLabel,
    Icon,
    Input,
    InputField,
    Select,
    SelectBackdrop,
    SelectContent,
    SelectDragIndicator,
    SelectDragIndicatorWrapper,
    SelectIcon,
    SelectInput,
    SelectItem,
    SelectPortal,
    SelectTrigger,
    Text,
    Textarea,
    TextareaInput,
} from "@gluestack-ui/themed";
import React from "react";
import { Control, useController } from "react-hook-form";
import { QSO } from "./qso";

export type FormFieldProps = {
    name: keyof QSO;
    label?: string;
    placeholder?: string;
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
    options,
    control,
}): JSX.Element => {
    const { field } = useController({ name, control });

    const value = String(field.value || "");
    return (
        <FormControl>
            {label && (
                <FormControlLabel>
                    <Text>{label}</Text>
                </FormControlLabel>
            )}
            {role === "text" && (
                <Input>
                    <InputField value={value} onChangeText={field.onChange} placeholder={placeholder} />
                </Input>
            )}
            {role === "select" && (
                <Select selectedValue={value} onValueChange={field.onChange}>
                    <SelectTrigger variant="outline" size="md">
                        <SelectInput placeholder={placeholder || "Select option"} />
                        <SelectIcon mr="$3">
                            <Icon as={ChevronDownIcon} />
                        </SelectIcon>
                    </SelectTrigger>
                    <SelectPortal>
                        <SelectBackdrop />
                        <SelectContent>
                            <SelectDragIndicatorWrapper>
                                <SelectDragIndicator />
                            </SelectDragIndicatorWrapper>
                            {Object.entries(options || {}).map(([key, value]) => (
                                <SelectItem label={value} value={key} key={`${name}_${key}`} />
                            ))}
                        </SelectContent>
                    </SelectPortal>
                </Select>
            )}
            {role === "textarea" && (
                <Textarea>
                    <TextareaInput value={value} onChangeText={field.onChange} placeholder={placeholder} />
                </Textarea>
            )}
        </FormControl>
    );
};
