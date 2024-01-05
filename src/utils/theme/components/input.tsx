import React from "react";
import { TextInput, TextInputProps, TextStyle } from "react-native";
import { createStyleSheet, useStyles } from "react-native-unistyles";
import { Stack } from "../../stack";
import { Styles, mergeStyles } from "./styles";
import { Typography } from "./typography";

const stylesheet = createStyleSheet((theme) => ({
    input: {
        ...theme.components.typography,
        borderWidth: theme.margins.xs,
        borderStyle: "solid",
        borderColor: theme.colours.primary[theme.shades.light],
        borderRadius: theme.margins.md,
        padding: theme.margins.lg,
        flexGrow: 1,
        maxWidth: "100%",
    },
    inputText: {
        backgroundColor: theme.colours.primary[theme.shades.light],
        borderRadius: theme.margins.md,
        padding: theme.margins.lg,
        height: "100%",
    },
    leftFlatBorders: {
        borderTopLeftRadius: 0,
        borderBottomLeftRadius: 0,
    },
    rightFlatBorders: {
        borderTopRightRadius: 0,
        borderBottomRightRadius: 0,
    },
}));

export type InputProps = TextInputProps & {
    numeric?: boolean;
    textStyle?: TextStyle;
    prefix?: React.ReactNode;
    suffix?: React.ReactNode;
};

export type InputComponent = React.FC<InputProps>;

export const Input: InputComponent = ({
    style,
    textStyle,
    prefix,
    suffix,
    numeric = false,
    ...otherProps
}): JSX.Element => {
    const { styles } = useStyles(stylesheet);

    return (
        <Stack direction="row" gap={0}>
            {prefix &&
                (typeof prefix == "string" ? (
                    <Typography variant="em" style={[styles.inputText, styles.rightFlatBorders, textStyle]}>
                        {prefix}
                    </Typography>
                ) : (
                    prefix
                ))}
            <TextInput
                style={mergeStyles<TextStyle>(
                    styles.input,
                    style as Styles<TextStyle>,
                    prefix ? styles.leftFlatBorders : [],
                    suffix ? styles.rightFlatBorders : [],
                )}
                {...(numeric
                    ? { keyboardType: "numeric", type: "number", pattern: "[0-9]*", inputmode: "numeric" }
                    : {})}
                {...otherProps}
            />
            {suffix &&
                (typeof suffix == "string" ? (
                    <Typography variant="em" style={[styles.inputText, styles.leftFlatBorders, textStyle]}>
                        {suffix}
                    </Typography>
                ) : (
                    suffix
                ))}
        </Stack>
    );
};
