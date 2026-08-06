import React from "react";
import { useWindowDimensions, ViewStyle } from "react-native";
import { getScreenSize, spacing } from "../../utils/theme";

const generateStyles = (width: number, columns: number = 12): Record<string, ViewStyle> => {
    const colWidth = 100 / columns;

    const colSpacing = spacing[getScreenSize(width)];

    return {
        row: {
            flexDirection: "row",
            flexWrap: "wrap",
            marginRight: -colSpacing,
        },
        ...Object.fromEntries(
            new Array(columns)
                .fill(null)
                .map((_, c) => [
                    `col_${c + 1}`,
                    { width: `${colWidth * (c + 1)}%` as ViewStyle["width"], paddingRight: colSpacing },
                ]),
        ),
    };
};

export const useGeneratedStyles = (columns: number = 12) => {
    const windowDimensions = useWindowDimensions();

    const gridStyles = React.useMemo(
        () => generateStyles(windowDimensions.width, columns),
        [windowDimensions.width, columns],
    );

    return { gridStyles, screenSize: getScreenSize(windowDimensions.width), columns };
};
