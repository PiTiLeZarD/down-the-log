import { Picker, PickerProps } from "@react-native-picker/picker";
import React from "react";
import { Platform, Pressable, TextStyle } from "react-native";
import { useUnistyles } from "react-native-unistyles";
import { Modal } from "../../modal";
import { Button } from "./button";
import { Typography } from "./typography";

export type SelectInputItem = { label: string; value: string };

export type SelectInputProps = Omit<PickerProps<string>, "selectedValue" | "children"> & {
    value?: string;
    items: SelectInputItem[];
};

export const SelectInput = ({ value, items, onValueChange, style, ...otherProps }: SelectInputProps) => {
    // The picker isn't a unistyles-processed component, so a StyleSheet.create value would arrive with
    // its properties hidden behind non-enumerable descriptors. Build a plain object off the live theme.
    const { theme } = useUnistyles();
    const [open, setOpen] = React.useState<boolean>(false);
    const input = React.useMemo(
        () =>
            ({
                ...theme.components.typography,
                borderWidth: theme.margins.xs,
                borderStyle: "solid",
                borderColor: theme.colours.primary.light,
                borderRadius: theme.margins.md,
                padding: theme.margins.lg,
                backgroundColor: theme.background,
                color: theme.text.main,
            }) as TextStyle,
        [theme],
    );

    const picker = (extraProps: PickerProps<string>) => (
        <Picker
            selectedValue={value}
            onValueChange={onValueChange}
            mode="dropdown"
            aria-label="select"
            {...otherProps}
            {...extraProps}
        >
            {items.map((item) => (
                <Picker.Item
                    key={item.value}
                    label={item.label}
                    value={item.value}
                    color={theme.text.main}
                    style={{ backgroundColor: theme.background, color: theme.text.main }}
                />
            ))}
        </Picker>
    );

    // iOS only knows how to render the picker as an inline wheel, which is far too tall to sit in a form.
    // Show the current label and move the wheel into a modal, the way react-native-picker-select did.
    if (Platform.OS === "ios") {
        const selected = items.find((item) => item.value === value);
        return (
            <>
                <Pressable onPress={() => setOpen(true)} style={[input, style as TextStyle]}>
                    <Typography>{selected ? selected.label : ""}</Typography>
                </Pressable>
                <Modal open={open} onClose={() => setOpen(false)}>
                    {picker({ itemStyle: { color: theme.text.main } })}
                    <Button colour="success" text="OK" onPress={() => setOpen(false)} />
                </Modal>
            </>
        );
    }

    return picker({ style: style ? [input, style] : input });
};
