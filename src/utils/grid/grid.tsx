import { Box } from '@gluestack-ui/themed';
import React from 'react';
import { merge } from '../merge';
import { SxProps, useStyles } from './styles';

export type GridProps = {
    container?: boolean;
    item?: boolean;
    sx?: SxProps;
    xs?: number;
    sm?: number;
    md?: number;
    lg?: number;
    xl?: number;
};

export type GridComponent = React.FC<React.PropsWithChildren<GridProps>>;

export const Grid: GridComponent = ({ container, item, sx, xs, sm, md, lg, xl, children }): JSX.Element => {
    const { gridStyles, screenSize } = useStyles();

    if ((container && item) || (!container && !item)) throw Error('Pick one, container or item');

    if (container) return <Box sx={merge(gridStyles.row, sx || {})}>{children}</Box>;

    const colSpan: number =
        (screenSize === 'xs'
            ? xs
            : screenSize === 'sm'
            ? sm || xs
            : screenSize === 'md'
            ? md || sm || xs
            : screenSize === 'lg'
            ? lg || md || sm || xs
            : screenSize === 'xl'
            ? xl || lg || md || sm || xs
            : 12) || 12;

    console.log({ gridStyles, screenSize, colSpan, sx });

    if (colSpan === -1) return <></>;

    const colStyles = (gridStyles as SxProps)[`col_${colSpan}`];

    return <Box sx={merge(colStyles, sx || {})}>{children}</Box>;
};
