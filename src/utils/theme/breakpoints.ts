import { useWindowDimensions } from "react-native";

export const breakpoints = {
    xs: 0,
    sm: 576,
    md: 768,
    lg: 992,
    xl: 1200,
    xxl: 1536,
} as const;

export const getScreenSize = (width: number): keyof typeof breakpoints => {
    if (width >= breakpoints.xs && width < breakpoints.sm) return "xs";
    if (width >= breakpoints.sm && width < breakpoints.md) return "sm";
    if (width >= breakpoints.md && width < breakpoints.lg) return "md";
    if (width >= breakpoints.lg && width < breakpoints.xl) return "lg";
    if (width >= breakpoints.xl && width < breakpoints.xxl) return "xl";
    return "xxl";
};

export const spacing: Record<keyof typeof breakpoints, number> = {
    xs: 5,
    sm: 6,
    md: 7,
    lg: 8,
    xl: 9,
    xxl: 10,
};

export const widthMatches = (from?: keyof typeof breakpoints, to?: keyof typeof breakpoints): boolean => {
    const { width } = useWindowDimensions();
    const fromWidth = from ? breakpoints[from] : 0;
    const toWidth = to ? breakpoints[to] : Infinity;
    return width > fromWidth && width < toWidth;
};
