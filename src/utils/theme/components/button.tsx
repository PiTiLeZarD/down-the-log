import React from "react";
import { Pressable, PressableProps, Text, TextProps, TextStyle, ViewStyle } from "react-native";
import { createStyleSheet, useStyles } from "react-native-unistyles";
import { Stack } from "../../stack";
import { ColourVariant } from "../theme";
import { Icon, IconName } from "./icon";
import { Styles, mergeStyles } from "./styles";

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

export type ButtonProps = Omit<PressableProps, "style"> & {
    text?: React.ReactNode;
    style?: Styles<ViewStyle>;
    textStyle?: Styles<TextStyle>;
    startIcon?: IconName;
    endIcon?: IconName;
    variant?: "contained" | "outlined";
    colour?: ColourVariant;
};

export type ButtonComponent = React.FC<React.PropsWithChildren<ButtonProps>>;

export const Button: ButtonComponent = ({
    style,
    textStyle,
    variant = "contained",
    colour = "primary",
    text,
    startIcon,
    endIcon,
    children,
    ...otherProps
}): JSX.Element => {
    const { styles } = useStyles(stylesheet);
    return (
        <Pressable
            style={mergeStyles<ViewStyle>(styles.button, styles[`button_${variant}`](colour), style)}
            {...otherProps}
        >
            <Stack direction="row" style={{ justifyContent: "center" }}>
                {startIcon && (
                    <ButtonText style={textStyle} variant={variant} colour={colour}>
                        <Icon name={startIcon} color={colour} contrast={variant == "contained"} />
                    </ButtonText>
                )}
                {text !== undefined ? (
                    <ButtonText style={textStyle} variant={variant} colour={colour}>
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
