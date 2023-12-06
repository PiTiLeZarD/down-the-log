import React from "react";
import { useWindowDimensions } from "react-native";
import { createStyleSheet, getScreenSize, spacing } from "../theme";

const generateStyles = (width: number, nbCols: number = 12) => {
    const colWidth = 100 / nbCols;

    const colSpacing = spacing[getScreenSize(width)];

    return createStyleSheet({
        row: {
            flexDirection: "row",
            flexWrap: "wrap",
            marginRight: -colSpacing,
        },
        ...Object.fromEntries(
            new Array(nbCols)
                .fill(null)
                .map((_, c) => [`col_${c + 1}`, { width: `${colWidth * (c + 1)}%`, paddingRight: colSpacing }])
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
