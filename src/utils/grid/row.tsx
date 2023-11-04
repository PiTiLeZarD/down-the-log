import { View } from '@gluestack-ui/themed';
import React from 'react';
import { merge } from '../merge';
import { SxProps, useStyles } from './styles';

export type RowProps = {
    sx?: SxProps;
};

export type RowComponent = React.FC<React.PropsWithChildren<RowProps>>;

export const Row: RowComponent = ({ sx = {}, children }): JSX.Element => {
    const [gridStyles] = useStyles();

    return <View sx={merge((gridStyles as SxProps).row, sx)}>{children}</View>;
};
