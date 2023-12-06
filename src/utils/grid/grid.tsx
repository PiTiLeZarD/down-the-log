import React from "react";
import { View, ViewStyle } from "react-native";
import { merge } from "../merge";
import { useStyles } from "../theme";
import { useGeneratedStyles } from "./styles";

export type GridProps = {
    container?: boolean;
    item?: boolean;
    style?: ViewStyle;
    xs?: number;
    sm?: number;
    md?: number;
    lg?: number;
    xl?: number;
    xxl?: number;
};

export type GridComponent = React.FC<React.PropsWithChildren<GridProps>>;

export const Grid: GridComponent = ({ container, item, style, xs, sm, md, lg, xl, xxl, children }): JSX.Element => {
    const { gridStyles, screenSize } = useGeneratedStyles();
    const { styles } = useStyles(gridStyles);

    if ((container && item) || (!container && !item)) throw Error("Pick one, container or item");

    if (container) return <View style={merge(styles.row, style || {})}>{children}</View>;

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
            : 12) || 12;

    if (colSpan === -1) return <></>;

    const colStyles = (styles as Record<string, any>)[`col_${colSpan}`];

    return <View style={merge(colStyles, style || {})}>{children}</View>;
};
