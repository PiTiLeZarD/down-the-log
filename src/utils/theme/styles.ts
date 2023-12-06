import { createUnistyles } from "react-native-unistyles";
import { breakpoints } from "./breakpoints";
import { theme } from "./theme";

export const { createStyleSheet, useStyles } = createUnistyles<typeof breakpoints, typeof theme>(breakpoints);
