import { Box, Text, VStack } from '@gluestack-ui/themed';
import React from 'react';
import { FlatList } from 'react-native';
import { freq2band } from '../../data/bands';
import { QSO } from '../../utils/qso';
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
            <Qso header position="ID" time="Time" callsign="Callsign" name="Name" band="Band" mode="Mode" />
            <FlatList
                data={qsos}
                renderItem={(datum) => (
                    <>
                        {separator(datum.item, datum.index)}
                        <Qso
                            position={String(datum.index + 1)}
                            band={datum.item.frequency ? freq2band(+datum.item.frequency) || 'N/A' : 'N/A'}
                            time={datum.item.date.toFormat('HH:mm')}
                            {...datum.item}
                            mode={datum.item.mode || 'N/A'}
                            name={datum.item.name || 'N/A'}
                            onPress={() => onQsoPress(datum.item)}
                        />
                    </>
                )}
            />
        </VStack>
    );
};
