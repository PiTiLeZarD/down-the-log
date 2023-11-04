import React from 'react';
import { useWindowDimensions } from 'react-native';

export type SxProps = Record<string, object>;
export type ScreenSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

const getScreenSize = (width: number): ScreenSize => {
    if (width >= 0 && width < 600) return 'xs';
    if (width >= 600 && width < 900) return 'sm';
    if (width >= 900 && width < 1200) return 'md';
    if (width >= 1200 && width < 1536) return 'md';
    return 'xl';
};

const generateStyles = (width: number, nbCols: number = 12) => {
    const colWidth = 100 / nbCols;

    const spacing = {
        xs: 5,
        sm: 6,
        md: 7,
        lg: 8,
        xl: 9,
    }[getScreenSize(width)];

    return {
        row: {
            flexDirection: 'row',
            flexWrap: 'wrap',
            marginRight: -spacing,
        },
        ...Object.fromEntries(
            new Array(nbCols)
                .fill(null)
                .map((_, c) => [`col_${c + 1}`, { width: `${colWidth * (c + 1)}%`, paddingRight: spacing }])
        ),
    };
};

export const useStyles = () => {
    const windowDimensions = useWindowDimensions();

    const [gridStyles, setGridStyles] = React.useState<ReturnType<typeof generateStyles>>(
        generateStyles(windowDimensions.width)
    );

    React.useEffect(() => {
        setGridStyles(generateStyles(windowDimensions.width));
    }, [windowDimensions]);

    return [gridStyles, getScreenSize(windowDimensions.width)];
};
