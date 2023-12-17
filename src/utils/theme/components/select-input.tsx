import React from "react";
import RNPickerSelect, { PickerSelectProps } from "react-native-picker-select";
import { createStyleSheet, useStyles } from "../styles";

const stylesheet = createStyleSheet((theme) => ({
    web: {
        borderWidth: theme.margins.xs,
        borderStyle: "solid",
        borderColor: theme.colours.primary[theme.shades.light],
        borderRadius: theme.margins.sm,
        padding: theme.margins.lg,
        backgroundColor: "inherit",
    },
}));

export type SelectInputProps = PickerSelectProps;

export type SelectInputComponent = React.FC<SelectInputProps>;

export const SelectInput: SelectInputComponent = (props): JSX.Element => {
    const { styles } = useStyles(stylesheet);
    return (
        <RNPickerSelect
            style={{
                inputWeb: styles.web,
            }}
            aria-label="select"
            {...props}
        />
    );
};
