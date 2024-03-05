import React from "react";
import RNPickerSelect, { PickerSelectProps } from "react-native-picker-select";
import { createStyleSheet, useStyles } from "react-native-unistyles";

const stylesheet = createStyleSheet((theme) => ({
    web: {
        ...theme.components.typography,
        borderWidth: theme.margins.xs,
        borderStyle: "solid",
        borderColor: theme.colours.primary[theme.shades.light],
        borderRadius: theme.margins.md,
        padding: theme.margins.lg,
        backgroundColor: theme.background,
        color: theme.text.main,
    },
}));

export type SelectInputProps = PickerSelectProps;

export type SelectInputComponent = React.FC<SelectInputProps>;

export const SelectInput: SelectInputComponent = ({ ...otherProps }): JSX.Element => {
    const { styles } = useStyles(stylesheet);
    return (
        <RNPickerSelect
            style={{
                inputWeb: styles.web,
                inputIOS: styles.web,
            }}
            aria-label="select"
            {...otherProps}
        />
    );
};
