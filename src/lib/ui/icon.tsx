import { Ionicons } from "@expo/vector-icons";
import { IconProps as VIIconProps } from "@expo/vector-icons/build/createIconSet";
import { useUnistyles } from "react-native-unistyles";
import { ColourVariant } from "./theme";

export type IconName = keyof (typeof Ionicons)["glyphMap"];

export type IconProps = {
    name: IconName;
    size?: number;
    contrast?: boolean;
    colour?: ColourVariant;
} & VIIconProps<string>;

export const Icon = ({ name, colour = "primary", size = 20, contrast = false, ...otherProps }: IconProps) => {
    const { theme } = useUnistyles();
    return (
        <Ionicons
            name={name as any}
            size={size}
            color={theme.colours[colour][contrast ? "lighter" : "dark"]}
            {...otherProps}
        />
    );
};
