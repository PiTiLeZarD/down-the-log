import React from "react";
import { Linking, Pressable, PressableProps, Text, TextProps, TextStyle, ViewStyle } from "react-native";
import { createStyleSheet, useStyles } from "react-native-unistyles";
import { Stack } from "../../../components/stack";
import { ColourVariant } from "../theme";
import { Icon, IconName } from "./icon";
import { Styles, mergeStyles } from "./styles";

export type ButtonVariants = "contained" | "outlined" | "chip";
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
    button_chip: (colour: ColourVariant) => ({
        backgroundColor: theme.colours[colour][theme.shades.light],
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
        color: theme.colours[colour][theme.shades.lighter],
    }),
    buttonText_outlined: (colour: ColourVariant) => ({
        color: theme.colours[colour][theme.shades.dark],
    }),
    buttonText_chip: (colour: ColourVariant) => ({
        color: theme.colours[colour][theme.shades.darker],
        fontSize: theme.components.typography.fontSize - 4,
    }),
}));

export type ButtonTextProps = TextProps & {
    variant?: ButtonVariants;
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
    variant?: ButtonVariants;
    colour?: ColourVariant;
    url?: string;
};

export type ButtonComponent = React.FC<React.PropsWithChildren<ButtonProps>>;

export const Button: ButtonComponent = ({
    style,
    textStyle,
    variant = "contained",
    colour = "primary",
    text,
    url,
    startIcon,
    endIcon,
    children,
    ...otherProps
}): JSX.Element => {
    const handleLink = (url: string) => async () => {
        const supported = await Linking.canOpenURL(url);
        if (supported) await Linking.openURL(url);
    };

    const { styles } = useStyles(stylesheet);
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
