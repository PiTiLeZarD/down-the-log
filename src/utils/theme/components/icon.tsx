import { Ionicons } from "@expo/vector-icons";
import { IconProps as VIIconProps } from "@expo/vector-icons/build/createIconSet";
import React from "react";
import { useStyles } from "react-native-unistyles";
import { ColourVariant } from "../theme";

export type IconProps = {
    name: string;
    size?: number;
    contrast?: boolean;
    colour?: ColourVariant;
} & VIIconProps<string>;

export type IconComponent = React.FC<IconProps>;

export const Icon: IconComponent = ({
    name,
    colour = "primary",
    size = 20,
    contrast = false,
    ...otherProps
}): JSX.Element => {
    const { theme } = useStyles();
    return (
        <Ionicons
            name={name as any}
            size={size}
            color={theme.colours[colour][theme.shades[contrast ? "lighter" : "dark"]]}
            {...otherProps}
        />
    );
};
