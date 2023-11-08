import React from 'react';

import { Box, Text } from '@gluestack-ui/themed';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { DateTime } from 'luxon';
import uuid from 'react-native-uuid';
import { RootStackParamList } from '../../RootStack';
import { QSO, useStore } from '../../store';
import { CallsignInput } from './callsign-input';
import { LocationHeader } from './location-header';
import { QsoList } from './qso-list';

const classes: Record<string, object> = {
    container: {
        display: 'flex',
        width: '100%',
        height: '100%',
    },
    table: {
        flexGrow: 1,
    },
};

export type HomeProps = {} & NativeStackScreenProps<RootStackParamList, 'Home'>;

export type HomeComponent = React.FC<HomeProps>;

export const Home: HomeComponent = ({ navigation }): JSX.Element => {
    const [callsign, setCallsign] = React.useState<string>('');
    const qsos = useStore((state) => state.qsos).filter((q) => q.callsign.includes(callsign));
    const log = useStore((state) => state.log);

    const handleAdd = () => {
        const qso: QSO = { callsign, id: uuid.v4() as string, date: DateTime.now() };
        log(qso);
        setCallsign('');
        navigation.navigate('QsoForm', { qsoId: qso.id });
    };

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
        <Box sx={classes.container}>
            <Box sx={classes.top}>
                <LocationHeader navigation={navigation} />
            </Box>
            <Box sx={classes.table}>
                <QsoList qsos={qsos} onQsoPress={(qso) => navigation.navigate('QsoForm', { qsoId: qso.id })} />
            </Box>
            <Box sx={classes.inputs}>
                <CallsignInput handleAdd={handleAdd} setCallsign={setCallsign} callsign={callsign} />
            </Box>
        </Box>
    );
};
