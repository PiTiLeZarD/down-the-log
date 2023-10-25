import { HStack, Text } from '@gluestack-ui/themed';
import React from 'react';

export type QsoProps = {
    id: string;
    band: string;
    callsign: string;
};

export type QsoComponent = React.FC<QsoProps>;

export const Qso: QsoComponent = ({ id, band, callsign }): JSX.Element => {
    return (
        <HStack>
            <Text flex={1}>{id}</Text>
            <Text flex={1}>{band}</Text>
            <Text flex={2}>{callsign}</Text>
        </HStack>
    );
};
