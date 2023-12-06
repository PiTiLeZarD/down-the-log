import React from "react";
import { useWindowDimensions } from "react-native";
import { createStyleSheet, getScreenSize } from "../theme";

const generateStyles = (width: number, nbCols: number = 12) => {
    const colWidth = 100 / nbCols;

    const spacing = {
        xs: 5,
        sm: 6,
        md: 7,
        lg: 8,
        xl: 9,
        xxl: 10,
    }[getScreenSize(width)];

    return createStyleSheet({
        row: {
            flexDirection: "row",
            flexWrap: "wrap",
            marginRight: -spacing,
        },
        ...Object.fromEntries(
            new Array(nbCols)
                .fill(null)
                .map((_, c) => [`col_${c + 1}`, { width: `${colWidth * (c + 1)}%`, paddingRight: spacing }])
        ),
    });
};

export const useGeneratedStyles = () => {
    const windowDimensions = useWindowDimensions();

    const [gridStyles, setGridStyles] = React.useState<ReturnType<typeof generateStyles>>(
        generateStyles(windowDimensions.width)
    );

    React.useEffect(() => {
        setGridStyles(generateStyles(windowDimensions.width));
    }, [windowDimensions]);

    return { gridStyles, screenSize: getScreenSize(windowDimensions.width) };
};
