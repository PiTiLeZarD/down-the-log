import { PixelRatio } from "react-native";
import colours from "./colours.json";

export const colour = (name: string, shade: number) =>
    ((colours as Record<string, Record<string, string>>)[name] || {})[String(shade)] || "#FF0000";

const reverseColour = (colour: Record<string, string>) =>
    Object.fromEntries(
        new Array(9).fill(null).map((_, i) => [String((i + 1) * 100), colour[String(1000 - (i + 1) * 100)]]),
    );

const cToHex = (c: number) => c.toString(16).padStart(2, "0");
export const rgbToHex = (r: number, g: number, b: number) => "#" + cToHex(r) + cToHex(g) + cToHex(b);
export const hexToRgb = (hex: string) => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result
        ? {
              r: parseInt(result[1], 16),
              g: parseInt(result[2], 16),
              b: parseInt(result[3], 16),
          }
        : null;
};

export const hexToCssRgb = (hex: string) => {
    const rgb = hexToRgb(hex);
    return `rgb(${rgb?.r}, ${rgb?.g}, ${rgb?.b})`;
};

export const theme = (shade: "light" | "dark") =>
    ({
        colours: {
            // primary: reverseColour(colours.blue),
            // secondary: reverseColour(colours.orange),
            // grey: reverseColour(colours.gray),
            // success: reverseColour(colours.green),
            primary: colours.blue,
            secondary: colours.orange,
            grey: colours.gray,
            success: colours.green,
        },
        components: {
            typography: {
                color: "black",
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
    }) as const;

export type ThemeType = ReturnType<typeof theme>;
export type ColourVariant = keyof ThemeType["colours"];
