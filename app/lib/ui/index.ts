import { StyleSheet } from "react-native-unistyles";

import { breakpoints } from "./breakpoints";
import { ThemeType, theme } from "./theme";
export { breakpoints, getScreenSize, spacing } from "./breakpoints";
export { colour, theme } from "./theme";

type AppBreakpoints = typeof breakpoints;
type AppThemes = {
    light: ThemeType;
    dark: ThemeType;
};

declare module "react-native-unistyles" {
    // Empty extending interfaces are how Unistyles wants its types augmented.
    /* eslint-disable @typescript-eslint/no-empty-object-type */
    export interface UnistylesBreakpoints extends AppBreakpoints {}
    export interface UnistylesThemes extends AppThemes {}
    /* eslint-enable @typescript-eslint/no-empty-object-type */
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
