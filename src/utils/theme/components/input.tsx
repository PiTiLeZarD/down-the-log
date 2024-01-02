import React from "react";
import { TextInput, TextInputProps } from "react-native";
import { createStyleSheet, useStyles } from "react-native-unistyles";

const stylesheet = createStyleSheet((theme) => ({
    input: {
        ...theme.components.typography,
        borderWidth: theme.margins.xs,
        borderStyle: "solid",
        borderColor: theme.colours.primary[theme.shades.light],
        borderRadius: theme.margins.md,
        padding: theme.margins.lg,
    },
}));

export type InputProps = TextInputProps & {};

export type InputComponent = React.FC<InputProps>;

export const Input: InputComponent = ({ style, ...otherProps }): JSX.Element => {
    const { styles } = useStyles(stylesheet);
    return <TextInput style={[styles.input, style]} {...otherProps} />;
};
