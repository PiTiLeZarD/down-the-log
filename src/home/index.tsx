import React from 'react';

import {
    AddIcon,
    Box,
    Button,
    ButtonText,
    Input,
    InputField,
    InputIcon,
    InputSlot,
    Text,
    VStack,
} from '@gluestack-ui/themed';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { nanoid } from 'nanoid';

import { NativeSyntheticEvent, TextInputChangeEventData } from 'react-native/types';
import { Qso } from '../Qso';
import { RootStackParamList } from '../RootStack';
import { QSO, useStore } from '../store';

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
    const qsos = useStore((state) => state.qsos);
    const log = useStore((state) => state.log);

    const handleAdd = () => {
        const qso: QSO = { callsign, id: nanoid() };
        log(qso);
        setCallsign('');
        navigation.navigate('QsoForm', { qsoId: qso.id });
    };

    return (
        <Box sx={classes.container}>
            <Box sx={classes.top}>
                <Text>Here the top part </Text>
                <Button onPress={() => navigation.navigate('About')}>
                    <ButtonText>About</ButtonText>
                </Button>
            </Box>
            <Box sx={classes.table}>
                <VStack>
                    <Qso header position="ID" band="Band" callsign="Callsign" />
                    {qsos.map((qso, i) => (
                        <Qso
                            key={i}
                            position={String(i)}
                            band="20m"
                            {...qso}
                            onPress={() => navigation.navigate('QsoForm', { qsoId: qso.id })}
                        />
                    ))}
                </VStack>
            </Box>
            <Box sx={classes.inputs}>
                <Input size="lg">
                    <InputField
                        onChange={(e: NativeSyntheticEvent<TextInputChangeEventData>) =>
                            setCallsign(e.nativeEvent.text)
                        }
                        onKeyPress={(e) => {
                            if (e.keyCode === 13) handleAdd();
                        }}
                        value={callsign}
                        placeholder="Callsign"
                    />
                    <InputSlot pr="$4" onPress={handleAdd}>
                        <InputIcon as={AddIcon} />
                    </InputSlot>
                </Input>
            </Box>
        </Box>
    );
};
