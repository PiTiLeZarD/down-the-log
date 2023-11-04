import { View } from '@gluestack-ui/themed';
import React from 'react';
import { merge } from '../merge';
import { SxProps, useStyles } from './styles';

export type ColProps = {
    sx?: SxProps;
    xs?: number;
    sm?: number;
    md?: number;
    lg?: number;
    xl?: number;
};

export type ColComponent = React.FC<React.PropsWithChildren<ColProps>>;

export const Col: ColComponent = ({ sx = {}, xs, sm, md, lg, xl, children }): JSX.Element => {
    const [gridStyles, screenSize] = useStyles();

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
    const colStyles = (gridStyles as SxProps)[`col_${colSpan}`];

    return <View sx={merge(colStyles, sx)}>{children}</View>;
};
