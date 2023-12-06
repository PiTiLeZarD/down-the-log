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
