import { Box, Text, VStack } from '@gluestack-ui/themed';
import React from 'react';
import { FlatList } from 'react-native';
import { QSO } from '../store';
import { Qso } from './qso';

export type QsoListProps = {
    qsos: QSO[];
    onQsoPress: (qso: QSO) => void;
};

export type QsoListComponent = React.FC<QsoListProps>;

export const QsoList: QsoListComponent = ({ qsos, onQsoPress }): JSX.Element => {
    const separator = (qso: QSO, index: number): JSX.Element => {
        if (index === 0 || qso.date.diff(qsos[index - 1].date).days > 0) {
            return (
                <Box
                    sx={{
                        paddingHorizontal: 5,
                        paddingVertical: 3,
                        display: 'flex',
                        alignItems: 'center',
                    }}
                >
                    <Text sx={{ fontWeight: 'bold' }}>{qso.date.toFormat('dd/MM/yyyy')}</Text>
                </Box>
            );
        }
        return <></>;
    };

    return (
        <VStack>
            <Qso header position="ID" time="Time" callsign="Callsign" band="Band" mode="Mode" />
            <FlatList
                data={qsos}
                renderItem={(datum) => (
                    <>
                        {separator(datum.item, datum.index)}
                        <Qso
                            position={String(datum.index + 1)}
                            band="20m"
                            time={datum.item.date.toFormat('HH:mm')}
                            {...datum.item}
                            mode={datum.item.mode || 'N/A'}
                            onPress={() => onQsoPress(datum.item)}
                        />
                    </>
                )}
            />
        </VStack>
    );
};
