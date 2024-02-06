import { UnistylesRegistry } from "react-native-unistyles";
export { breakpoints, getScreenSize, spacing } from "./breakpoints";
export { colour, theme } from "./theme";

import { breakpoints } from "./breakpoints";
import { theme } from "./theme";

type AppBreakpoints = typeof breakpoints;
type AppThemes = {
    main: typeof theme;
};

declare module "react-native-unistyles" {
    export interface UnistylesBreakpoints extends AppBreakpoints {}
    export interface UnistylesThemes extends AppThemes {}
}

UnistylesRegistry.addThemes({
    main: theme,
}).addBreakpoints(breakpoints);
