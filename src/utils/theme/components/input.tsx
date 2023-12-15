import React from "react";
import { TextInput, TextInputProps } from "react-native";
import { createStyleSheet, useStyles } from "../styles";

const stylesheet = createStyleSheet((theme) => ({
    input: {
        borderWidth: 1,
        borderStyle: "solid",
        borderColor: theme.colours.primary[300],
        borderRadius: 3,
        padding: 8,
    },
}));

export type InputProps = TextInputProps & {};

export type InputComponent = React.FC<InputProps>;

export const Input: InputComponent = ({ style, ...otherProps }): JSX.Element => {
    const { styles } = useStyles(stylesheet);
    return <TextInput style={[styles.input, style]} {...otherProps} />;
};
