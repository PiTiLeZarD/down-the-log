import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { useStyles } from "../styles";
import { ColourVariant } from "../theme";

export type IconProps = {
    name: string;
    size?: number;
    contrast?: boolean;
    variant?: ColourVariant;
};

export type IconComponent = React.FC<IconProps>;

export const Icon: IconComponent = ({ name, variant = "primary", size = 20, contrast = false }): JSX.Element => {
    const { theme } = useStyles();
    return (
        <Ionicons
            name={name as any}
            size={size}
            color={theme.colours[variant][theme.shades[contrast ? "lighter" : "dark"]]}
        />
    );
};
