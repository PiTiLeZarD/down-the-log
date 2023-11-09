import { Box, HStack, Image, Text, VStack } from '@gluestack-ui/themed';
import React from 'react';
import { FlatList } from 'react-native';
import { freq2band } from '../../data/bands';
import { useStore } from '../../store';
import { findCountry, getCallsignData } from '../../utils/callsign';
import { maidenDistance } from '../../utils/locator';
import { QSO } from '../../utils/qso';
import { Qso } from './qso';

export type QsoListProps = {
    qsos: QSO[];
    onQsoPress: (qso: QSO) => void;
};

export type QsoListComponent = React.FC<QsoListProps>;

export const QsoList: QsoListComponent = ({ qsos, onQsoPress }): JSX.Element => {
    const currentLocation = useStore((state) => state.currentLocation);
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

    const callsignCell = (qso: QSO) => {
        const callsignData = getCallsignData(qso.callsign);
        return (
            <HStack space="sm">
                <Image size="2xs" source={{ uri: findCountry(callsignData)?.flag }} alt={callsignData?.iso3} />
                <Text>{qso.callsign}</Text>
                <Text>({maidenDistance(currentLocation, qso.locator || callsignData?.gs || currentLocation)}km)</Text>
            </HStack>
        );
    };

    return (
        <VStack>
            <Qso header position="ID" time="Time" callsign="Callsign" name="Name" band="Band" />
            <FlatList
                data={qsos}
                renderItem={({ item, index }) => (
                    <>
                        {separator(item, index)}
                        <Qso
                            position={String(index + 1)}
                            time={item.date.toFormat('HH:mm')}
                            callsign={callsignCell(item)}
                            name={item.name || 'N/A'}
                            band={`${item.frequency ? freq2band(+item.frequency) || 'N/A' : 'N/A'} (${
                                item.mode || 'N/A'
                            })`}
                            onPress={() => onQsoPress(item)}
                        />
                    </>
                )}
            />
        </VStack>
    );
};
