import React from "react";
import RNPickerSelect, { PickerSelectProps } from "react-native-picker-select";
import { createStyleSheet, useStyles } from "../styles";

const stylesheet = createStyleSheet((theme) => ({
    web: {
        borderWidth: 1,
        borderStyle: "solid",
        borderColor: theme.colours.primary[theme.shades.light],
        borderRadius: 3,
        padding: 8,
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
