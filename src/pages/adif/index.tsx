import { Button, ButtonText, Text, VStack } from '@gluestack-ui/themed';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import React from 'react';
import { RootStackParamList } from '../../RootStack';
import { downloadQsos } from '../../utils/adif';
import { useQsos } from '../../utils/qso';

export type AdifProps = {} & NativeStackScreenProps<RootStackParamList, 'Adif'>;

export type AdifComponent = React.FC<AdifProps>;

export const Adif: AdifComponent = ({ navigation }): JSX.Element => {
    const qsos = useQsos();
    return (
        <VStack>
            <Text>Adif</Text>
            <Button onPress={() => downloadQsos('adif_export.adif', qsos)}>
                <ButtonText>Download</ButtonText>
            </Button>

            <Button onPress={() => navigation.goBack()}>
                <ButtonText>Back</ButtonText>
            </Button>
        </VStack>
    );
};
