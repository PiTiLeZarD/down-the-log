import { Text } from '@gluestack-ui/themed';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import React from 'react';
import { RootStackParamList } from '../RootStack';
import { useStore } from '../store';

export type QsoFormProps = {} & NativeStackScreenProps<RootStackParamList, 'QsoForm'>;

export type QsoFormComponent = React.FC<QsoFormProps>;

export const QsoForm: QsoFormComponent = ({ route }): JSX.Element => {
    const { qsoId } = route.params;
    const qso = useStore((state) => state.qsos).filter((q) => q.id == qsoId)[0];

    return (
        <Text>
            QsoForm display {qsoId} for {qso.callsign}
        </Text>
    );
};
