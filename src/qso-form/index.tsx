import { Input, InputField, Text, VStack } from '@gluestack-ui/themed';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import React from 'react';
import { useForm } from 'react-hook-form';
import { RootStackParamList } from '../RootStack';
import { QSO, useStore } from '../store';

export type QsoFormProps = {} & NativeStackScreenProps<RootStackParamList, 'QsoForm'>;

export type QsoFormComponent = React.FC<QsoFormProps>;

export const QsoForm: QsoFormComponent = ({ route }): JSX.Element => {
    const { qsoId } = route.params;
    const qso = useStore((state) => state.qsos).filter((q) => q.id == qsoId)[0];

    const { register } = useForm<QSO>({
        defaultValues: qso,
    });

    return (
        <VStack>
            <Text>
                QsoForm display {qsoId} for {qso.callsign}
            </Text>
            <Input>
                <InputField {...register('callsign')} placeholder="Enter Text here" />
            </Input>
        </VStack>
    );
};
