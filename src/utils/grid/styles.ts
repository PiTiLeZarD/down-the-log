import React from "react";
import { useWindowDimensions } from "react-native";
import { createStyleSheet } from "react-native-unistyles";
import { getScreenSize, spacing } from "../theme";

const generateStyles = (width: number, columns: number = 12) => {
    const colWidth = 100 / columns;

    const colSpacing = spacing[getScreenSize(width)];

    return createStyleSheet({
        row: {
            flexDirection: "row",
            flexWrap: "wrap",
            marginRight: -colSpacing,
        },
        ...Object.fromEntries(
            new Array(columns)
                .fill(null)
                .map((_, c) => [`col_${c + 1}`, { width: `${colWidth * (c + 1)}%`, paddingRight: colSpacing }]),
        ),
    });
};

export const useGeneratedStyles = (columns: number = 12) => {
    const windowDimensions = useWindowDimensions();

    const [gridStyles, setGridStyles] = React.useState<ReturnType<typeof generateStyles>>(
        generateStyles(windowDimensions.width, columns),
    );

    React.useEffect(() => {
        setGridStyles(generateStyles(windowDimensions.width, columns));
    }, [windowDimensions, columns]);

    return { gridStyles, screenSize: getScreenSize(windowDimensions.width), columns };
};
