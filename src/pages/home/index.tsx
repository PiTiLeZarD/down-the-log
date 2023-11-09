import React from 'react';

import { Box } from '@gluestack-ui/themed';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../RootStack';
import { useStore } from '../../store';
import { Clocks } from '../../utils/clocks';
import { newQso, useQsos } from '../../utils/qso';
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
    const qsos = useQsos();
    const currentLocation = useStore((state) => state.currentLocation);
    const log = useStore((state) => state.log);

    const handleAdd = () => {
        const qso = newQso(callsign, currentLocation, qsos);
        log(qso);
        setCallsign('');
        navigation.navigate('QsoForm', { qsoId: qso.id });
    };

    return (
        <Box sx={classes.container}>
            <Box sx={classes.top}>
                <LocationHeader navigation={navigation} />
                <Clocks />
            </Box>
            <Box sx={classes.table}>
                <QsoList
                    qsos={qsos.filter((q) => q.callsign.includes(callsign))}
                    onQsoPress={(qso) => navigation.navigate('QsoForm', { qsoId: qso.id })}
                />
            </Box>
            <Box sx={classes.inputs}>
                <CallsignInput handleAdd={handleAdd} setCallsign={setCallsign} callsign={callsign} />
            </Box>
        </Box>
    );
};
