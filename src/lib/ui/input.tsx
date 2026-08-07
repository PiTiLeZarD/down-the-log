import React from "react";
import {
    NativeSyntheticEvent,
    Pressable,
    TextInput,
    TextInputChangeEventData,
    TextInputProps,
    TextStyle,
    View,
} from "react-native";
import { StyleSheet } from "react-native-unistyles";
import { Stack } from "../components/stack";
import { useThrottle } from "../utils/use-throttle";
import { Icon } from "./icon";
import { Styles, mergeStyles } from "./styles";
import { Typography } from "./typography";

const styles = StyleSheet.create((theme) => ({
    input: {
        ...theme.components.typography,
        borderWidth: theme.margins.xs,
        borderStyle: "solid",
        borderColor: theme.colours.primary.light,
        borderRadius: theme.margins.md,
        padding: theme.margins.lg,
        flexGrow: 1,
        maxWidth: "100%",
        color: theme.text.main,
    },
    inputText: {
        backgroundColor: theme.colours.primary.light,
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

export const Input = ({
    style,
    textStyle,
    prefix,
    suffix,
    transformValue = (v) => v,
    numeric = false,
    password = false,
    ...otherProps
}: InputProps) => {
    const [secure, setSecure] = React.useState<boolean>(password);
    const [value, setValue] = React.useState<string>(transformValue(otherProps.value || ""));

    // Both bits of state mirror a prop. Resyncing during render (the supported pattern) instead of in
    // an effect means the input never paints one frame of the previous value.
    const [renderedFor, setRenderedFor] = React.useState<Pick<InputProps, "password" | "value">>({
        password,
        value: otherProps.value,
    });
    if (renderedFor.password !== password || renderedFor.value !== otherProps.value) {
        setRenderedFor({ password, value: otherProps.value });
        if (renderedFor.password !== password) setSecure(password);
        const transformed = transformValue(otherProps.value || "");
        if (transformed !== value) setValue(transformed);
    }

    if (password)
        suffix = (
            <Pressable onPress={() => setSecure(!secure)}>
                <Icon name={secure ? "eye-off" : "eye"} />
            </Pressable>
        );

    const launch = (ev: NativeSyntheticEvent<TextInputChangeEventData>, value: string) => {
        (otherProps.onChangeText || ((v: string) => {}))(value);
        (otherProps.onChange || ((ev: any) => {}))(ev);
    };
    const throttled = useThrottle(launch, 50);

    const handleChange = (ev: NativeSyntheticEvent<TextInputChangeEventData>) => {
        const elt = ev.target as any as HTMLInputElement;
        const caret = elt.selectionStart;
        const newValue = transformValue(elt.value);
        setValue(newValue);
        throttled(ev, newValue);
        requestAnimationFrame(() => {
            elt.selectionStart = caret;
            elt.selectionEnd = caret;
        });
    };

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
