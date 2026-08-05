import React from "react";
import { TextStyle } from "react-native";
import RNPickerSelect, { PickerSelectProps } from "react-native-picker-select";
import { useUnistyles } from "react-native-unistyles";

export type SelectInputProps = PickerSelectProps;

export const SelectInput = ({ ...otherProps }: SelectInputProps) => {
    // `inputWeb` is a nested style bag, not the `style` prop, so unistyles can never attach to it and a
    // StyleSheet.create value would arrive empty. Build a plain object off the live theme instead.
    const { theme } = useUnistyles();
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

    return (
        <RNPickerSelect
            style={{
                inputWeb: input,
                inputIOS: input,
                inputAndroid: input,
            }}
            aria-label="select"
            {...otherProps}
        />
    );
};
