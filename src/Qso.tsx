import { HStack, Text } from '@gluestack-ui/themed';
import React from 'react';
import { merge } from './utils/merge';

const classes: Record<string, object> = {
    cell: {
        flex: 1,
        padding: '3px 5px',
    },
    header: {
        fontWeight: 'bold',
    },
};

export type QsoProps = {
    header?: boolean;
    position: string;
    band: string;
    callsign: string;
};

export type QsoComponent = React.FC<QsoProps>;

export const Qso: QsoComponent = ({ header = false, position, band, callsign }): JSX.Element => {
    const cellStyles = merge(classes.cell, header ? classes.header : {});

    return (
        <HStack>
            <Text sx={cellStyles}>{position}</Text>
            <Text sx={cellStyles}>{band}</Text>
            <Text sx={cellStyles}>{callsign}</Text>
        </HStack>
    );
};
