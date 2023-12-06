import colours from "./colours.json";

export const colour = (name: string, shade: number) =>
    ((colours as Record<string, Record<string, string>>)[name] || {})[String(shade)] || "#FF0000";

export const theme = {
    colors: {
        primary: colours.blue,
        secondary: colours.orange,
    },
    margins: {
        sm: 2,
        md: 4,
        lg: 8,
        xl: 12,
    },
} as const;
