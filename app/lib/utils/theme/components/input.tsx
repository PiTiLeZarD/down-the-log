import React, { useEffect } from "react";
import {
    NativeSyntheticEvent,
    Pressable,
    TextInput,
    TextInputChangeEventData,
    TextInputProps,
    TextStyle,
    View,
} from "react-native";
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
    transformValue?: (v: string) => string;
    prefix?: React.ReactNode;
    suffix?: React.ReactNode;
};

export type InputComponent = React.FC<InputProps>;

export const Input: InputComponent = ({
    style,
    textStyle,
    prefix,
    suffix,
    transformValue = (v) => v,
    numeric = false,
    password = false,
    ...otherProps
}): JSX.Element => {
    const [secure, setSecure] = React.useState<boolean>(password);
    const [value, setValue] = React.useState<string>(otherProps.value || "");
    useEffect(() => setSecure(password), [password]);

    if (password)
        suffix = (
            <Pressable onPress={() => setSecure(!secure)}>
                <Icon name={secure ? "eye-off" : "eye"} />
            </Pressable>
        );

    useEffect(() => {
        const mv = transformValue(otherProps.value || "");
        if (otherProps.value && mv !== value) {
            setValue(mv);
        }
    }, [otherProps.value]);

    const handleChange = (ev: NativeSyntheticEvent<TextInputChangeEventData>) => {
        const elt = ev.target as any as HTMLInputElement;
        const caret = elt.selectionStart;
        const newValue = transformValue(elt.value);
        setValue(newValue);
        setTimeout(() => {
            (otherProps.onChangeText || ((v: string) => {}))(newValue);
            (otherProps.onChange || ((ev: any) => {}))(ev);
        }, 50);
        requestAnimationFrame(() => {
            elt.selectionStart = caret;
            elt.selectionEnd = caret;
        });
    };
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
                value={value}
                onChangeText={() => {}}
                onChange={handleChange}
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
