import { UnistylesRegistry } from "react-native-unistyles";
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

UnistylesRegistry.addConfig({
    adaptiveThemes: true,
    initialTheme: "light",
})
    .addThemes({
        light: theme("light"),
        dark: theme("dark"),
    })
    .addBreakpoints(breakpoints);
