import { PixelRatio } from "react-native";
import colours from "./colours.json";

export const colour = (name: string, shade: number) =>
    ((colours as Record<string, Record<string, string>>)[name] || {})[String(shade)] || "#FF0000";

export const theme = {
    colours: {
        primary: colours.blue,
        secondary: colours.orange,
        grey: colours.gray,
        success: colours.green,
    },
    components: {
        typography: {
            fontFamily: "Quicksand",
            fontWeight: "400",
            fontSize: PixelRatio.getFontScale() * 16,
        },
        button: {
            flex: 1,
            paddingTop: 8,
            paddingBottom: 8,
            paddingLeft: 16,
            paddingRight: 16,
            borderRadius: 4,
        },
        buttonText: {
            textAlign: "center",
            textTransform: "uppercase",
            fontWeight: "bold",
        },
    },
    margins: {
        xs: 1,
        sm: 2,
        md: 4,
        lg: 8,
        xl: 12,
        xxl: 16,
    },
    shades: {
        lighter: 100,
        light: 300,
        main: 500,
        dark: 700,
        darker: 900,
    },
} as const;

export type ColourVariant = keyof typeof theme.colours;
