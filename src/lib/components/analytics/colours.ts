import React from "react";
import { useUnistyles } from "react-native-unistyles";
import { colour, theme } from "../../ui/theme";
import { UnitStatus } from "../../utils/award-progress";

/**
 * SVG fills need literal colours: on web Unistyles hands theme strings out as CSS variables, which a
 * `fill` attribute doesn't resolve. Rebuild the palette off the active theme's name instead.
 */
export const useAnalyticsColours = () => {
    const { rt } = useUnistyles();
    const shade = rt.themeName === "dark" ? "dark" : "light";
    return React.useMemo(() => {
        const t = theme(shade);
        const status: Record<UnitStatus, string> = {
            // Orange reads as the finished state, the cooler teal as still waiting on a QSL.
            worked: colour("teal", "400"),
            confirmed: colour("orange", "500"),
            missing: colour("gray", shade === "dark" ? "700" : "300"),
        };
        return {
            status,
            background: t.background,
            text: t.text.main,
        };
    }, [shade]);
};
