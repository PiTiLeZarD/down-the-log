import { HStack, Pressable, Text } from '@gluestack-ui/themed';
import React from 'react';
import { merge } from './utils/merge';

const classes: Record<string, object> = {
    cell: {
        flex: 1,
        paddingHorizontal: 5,
        paddingVertical: 3,
    },
    header: {
        fontWeight: 'bold',
    },
    rowHighlight: {
        backgroundColor: '#ddd',
    },
};

export type QsoProps = {
    header?: boolean;
    position: string;
    band: string;
    callsign: string;
    onPress?: () => void;
};

export type QsoComponent = React.FC<QsoProps>;

export const Qso: QsoComponent = ({ onPress, header = false, position, band, callsign }): JSX.Element => {
    const cellStyles = merge(classes.cell, header ? classes.header : {});

    return (
        <Pressable onPress={onPress}>
            <HStack sx={+position % 2 || header ? classes.rowHighlight : {}}>
                <Text sx={cellStyles}>{position}</Text>
                <Text sx={cellStyles}>{band}</Text>
                <Text sx={cellStyles}>{callsign}</Text>
            </HStack>
        </Pressable>
    );
};
