import React, { PropsWithChildren } from "react";
import { Linking, Pressable, PressableProps, Text, TextProps, TextStyle, ViewStyle } from "react-native";
import { StyleSheet } from "react-native-unistyles";
import { Stack } from "../components/stack";
import { ColourVariant } from "./theme";
import { Icon, IconName } from "./icon";
import { Styles, mergeStyles } from "./styles";

export type ButtonVariants = "contained" | "outlined" | "chip";
const styles = StyleSheet.create((theme) => ({
    button: {
        ...theme.components.button,
    },
    button_contained: (colour: ColourVariant) => ({
        backgroundColor: theme.colours[colour].dark,
    }),
    button_outlined: (colour: ColourVariant) => ({
        borderStyle: "solid",
        borderWidth: theme.margins.sm,
        borderColor: theme.colours[colour].dark,
    }),
    button_chip: (colour: ColourVariant) => ({
        backgroundColor: theme.colours[colour].light,
        borderRadius: theme.margins.xxl,
        paddingTop: theme.margins.sm,
        paddingBottom: theme.margins.sm,
        paddingLeft: theme.margins.lg,
        paddingRight: theme.margins.lg,
    }),
    buttonText: {
        ...theme.components.buttonText,
    },
    buttonText_contained: (colour: ColourVariant) => ({
        color: theme.colours[colour].lighter,
    }),
    buttonText_outlined: (colour: ColourVariant) => ({
        color: theme.colours[colour].dark,
    }),
    buttonText_chip: (colour: ColourVariant) => ({
        color: theme.colours[colour].darker,
        fontSize: theme.components.typography.fontSize - 4,
    }),
}));

export type ButtonTextProps = PropsWithChildren<TextProps & {
    variant?: ButtonVariants;
    colour?: ColourVariant;
}>;

export const ButtonText = ({
    style,
    variant = "contained",
    colour = "primary",
    children,
    ...otherProps
}: ButtonTextProps) => {

    return (
        <Text
            style={mergeStyles<TextStyle>(
                styles.buttonText,
                styles[`buttonText_${variant}`](colour),
                style as Styles<TextStyle>,
            )}
            {...otherProps}
        >
            {children}
        </Text>
    );
};

export type ButtonProps = PropsWithChildren<Omit<PressableProps, "style"> & {
    text?: React.ReactNode;
    style?: Styles<ViewStyle>;
    textStyle?: Styles<TextStyle>;
    startIcon?: IconName;
    endIcon?: IconName;
    variant?: ButtonVariants;
    colour?: ColourVariant;
    url?: string;
    // Caps the label's height; 1 keeps a squeezed button on a single line rather than wrapping it.
    numberOfLines?: number;
}>;

export const Button = ({
    style,
    textStyle,
    variant = "contained",
    colour = "primary",
    text,
    url,
    startIcon,
    endIcon,
    numberOfLines,
    children,
    ...otherProps
}: ButtonProps) => {
    const handleLink = (url: string) => async () => {
        const supported = await Linking.canOpenURL(url);
        if (supported) await Linking.openURL(url);
    };

    return (
        <Pressable
            style={mergeStyles<ViewStyle>(styles.button, styles[`button_${variant}`](colour), style)}
            {...otherProps}
            {...(url ? { onPress: handleLink(url) } : {})}
        >
            <Stack direction="row" style={{ justifyContent: "center" }}>
                {startIcon && (
                    <ButtonText style={textStyle} variant={variant} colour={colour}>
                        <Icon name={startIcon} color={colour} contrast={variant == "contained"} />
                    </ButtonText>
                )}
                {text !== undefined ? (
                    <ButtonText
                        style={textStyle}
                        variant={variant}
                        colour={colour}
                        numberOfLines={numberOfLines}
                    >
                        {String(text)}
                    </ButtonText>
                ) : (
                    children
                )}
                {endIcon && (
                    <ButtonText style={textStyle} variant={variant} colour={colour}>
                        <Icon name={endIcon} color={colour} contrast={variant == "contained"} />
                    </ButtonText>
                )}
            </Stack>
        </Pressable>
    );
};
