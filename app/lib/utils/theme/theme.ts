import { PixelRatio } from "react-native";
import colours from "./colours.json";

export type Colour = Record<"100" | "200" | "300" | "400" | "500" | "600" | "700" | "800" | "900", string>;
export type Colours = Record<
    "gray" | "red" | "orange" | "yellow" | "green" | "teal" | "blue" | "indigo" | "purple" | "pink",
    Colour
>;
export type Shade = "lighter" | "light" | "main" | "dark" | "darker";
export type ColourVariant = "primary" | "secondary" | "grey" | "success";
// Numeric keys plus the shade aliases resolved for the current light/dark mode.
export type ShadedColour = Colour & Record<Shade, string>;

export const colour = (name: keyof Colours, shade: keyof Colour) =>
    ((colours as Colours)[name] || {})[shade] || "#FF0000";

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

const shadeKeys = (shade: "light" | "dark") =>
    (shade === "light"
        ? {
              lighter: "100",
              light: "300",
              main: "500",
              dark: "700",
              darker: "900",
          }
        : {
              lighter: "900",
              light: "700",
              main: "500",
              dark: "300",
              darker: "100",
          }) as Record<Shade, keyof Colour>;

// Unistyles resolves theme strings to CSS variables on web, so a theme value can never be used as a
// lookup key inside StyleSheet.create. Bake the shade aliases into every palette instead.
const withShades = (palette: Colour, shade: "light" | "dark"): ShadedColour => {
    const keys = shadeKeys(shade);
    return {
        ...palette,
        lighter: palette[keys.lighter],
        light: palette[keys.light],
        main: palette[keys.main],
        dark: palette[keys.dark],
        darker: palette[keys.darker],
    };
};

export const theme = (shade: "light" | "dark") =>
    ({
        colours: {
            primary: withShades(colours.blue, shade),
            secondary: withShades(colours.orange, shade),
            grey: withShades(colours.gray, shade),
            success: withShades(colours.green, shade),
        } as Record<ColourVariant, ShadedColour>,
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
        background: shade == "light" ? colours.gray[100] : colours.gray[900],
        text: {
            main: shade == "light" ? colours.gray[900] : colours.gray[100],
            contrast: shade == "light" ? colours.gray[100] : colours.gray[900],
        },
        margins: {
            xs: 1,
            sm: 2,
            md: 4,
            lg: 8,
            xl: 12,
            xxl: 16,
        },
        rowShade: shade === "light" ? (odd: boolean) => (odd ? "200" : "100") : (odd: boolean) => (odd ? "800" : "900"),
    }) as const;

export type ThemeType = ReturnType<typeof theme>;
