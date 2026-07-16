import { StyleSheet } from "react-native-unistyles";
export { breakpoints, getScreenSize, spacing } from "./breakpoints";
export { colour, theme } from "./theme";

import { breakpoints } from "./breakpoints";
import { ThemeType, theme } from "./theme";

type AppBreakpoints = typeof breakpoints;
type AppThemes = {
    light: ThemeType;
    dark: ThemeType;
};

declare module "react-native-unistyles" {
    export interface UnistylesBreakpoints extends AppBreakpoints {}
    export interface UnistylesThemes extends AppThemes {}
}

StyleSheet.configure({
    themes: {
        light: theme("light"),
        dark: theme("dark"),
    },
    breakpoints,
    settings: {
        adaptiveThemes: true,
    },
});
