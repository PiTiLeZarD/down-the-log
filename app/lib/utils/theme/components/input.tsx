import React, { useEffect } from "react";
import { Pressable, TextInput, TextInputProps, TextStyle, View } from "react-native";
import { createStyleSheet, useStyles } from "react-native-unistyles";
import { Stack } from "../../../components/stack";
import { Icon } from "./icon";
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
        color: theme.text.main,
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
    password?: boolean;
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
    password = false,
    ...otherProps
}): JSX.Element => {
    const [secure, setSecure] = React.useState<boolean>(password);
    useEffect(() => setSecure(password), [password]);

    if (password)
        suffix = (
            <Pressable onPress={() => setSecure(!secure)}>
                <Icon name={secure ? "eye-off" : "eye"} />
            </Pressable>
        );

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
                secureTextEntry={secure}
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
                    <View style={[styles.inputText, styles.leftFlatBorders]}>{suffix}</View>
                ))}
        </Stack>
    );
};
