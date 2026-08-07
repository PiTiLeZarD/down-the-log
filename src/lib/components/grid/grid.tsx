import { PropsWithChildren } from "react";
import { View, ViewStyle } from "react-native";
import { useGeneratedStyles } from "./styles";

export type GridProps = PropsWithChildren<{
    container?: boolean;
    item?: boolean;
    style?: ViewStyle;
    xs?: number;
    sm?: number;
    md?: number;
    lg?: number;
    xl?: number;
    xxl?: number;
    columns?: number;
}>;

export const Grid = ({ container, item, style, xs, sm, md, lg, xl, xxl, columns = 12, children }: GridProps) => {
    const { gridStyles: styles, screenSize } = useGeneratedStyles(columns);

    if ((container && item) || (!container && !item)) throw Error("Pick one, container or item");

    if (container) return <View style={[styles.row, style || {}]}>{children}</View>;

    const colSpan: number =
        (screenSize === "xs"
            ? xs
            : screenSize === "sm"
              ? sm || xs
              : screenSize === "md"
                ? md || sm || xs
                : screenSize === "lg"
                  ? lg || md || sm || xs
                  : screenSize === "xl"
                    ? xl || lg || md || sm || xs
                    : screenSize === "xxl"
                      ? xxl || xl || lg || md || sm || xs
                      : columns) || columns;

    if (colSpan === -1) return <></>;

    const colStyles = (styles as Record<string, any>)[`col_${colSpan}`];

    return <View style={[colStyles, style || {}]}>{children}</View>;
};
