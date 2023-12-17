import React from "react";
import { Pressable, PressableProps, Text, TextProps, ViewStyle } from "react-native";
import { createStyleSheet, useStyles } from "../styles";
import { ColourVariant } from "../theme";

const stylesheet = createStyleSheet((theme) => ({
    button: {
        ...theme.components.button,
    },
    button_contained: (colour: ColourVariant) => ({
        backgroundColor: theme.colours[colour][theme.shades.dark],
    }),
    button_outlined: (colour: ColourVariant) => ({
        borderStyle: "solid",
        borderWidth: theme.margins.sm,
        borderColor: theme.colours[colour][theme.shades.dark],
    }),
    buttonText: {
        ...theme.components.buttonText,
    },
    buttonText_contained: (colour: ColourVariant) => ({
        color: theme.colours[colour][theme.shades.lighter],
    }),
    buttonText_outlined: (colour: ColourVariant) => ({
        color: theme.colours[colour][theme.shades.dark],
    }),
}));

export type ButtonTextProps = TextProps & {
    variant?: "contained" | "outlined";
    colour?: ColourVariant;
};

export type ButtonTextComponent = React.FC<React.PropsWithChildren<ButtonTextProps>>;

export const ButtonText: ButtonTextComponent = ({
    style,
    variant = "contained",
    colour = "primary",
    children,
    ...otherProps
}): JSX.Element => {
    const { styles } = useStyles(stylesheet);
    return (
        <Text style={[styles.buttonText, styles[`buttonText_${variant}`](colour), style]} {...otherProps}>
            {children}
        </Text>
    );
};

export type ButtonProps = Omit<PressableProps, "style"> & {
    text?: React.ReactNode;
    style?: ViewStyle;
    variant?: "contained" | "outlined";
    colour?: ColourVariant;
};

export type ButtonComponent = React.FC<React.PropsWithChildren<ButtonProps>>;

export const Button: ButtonComponent = ({
    style,
    variant = "contained",
    colour = "primary",
    text,
    children,
    ...otherProps
}): JSX.Element => {
    const { styles } = useStyles(stylesheet);
    return (
        <Pressable style={[styles.button, styles[`button_${variant}`](colour), style]} {...otherProps}>
            {text ? (
                <ButtonText variant={variant} colour={colour}>
                    {text}
                </ButtonText>
            ) : (
                children
            )}
        </Pressable>
    );
};
