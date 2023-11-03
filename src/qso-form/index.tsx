import { Box, Button, ButtonText, HStack, VStack } from '@gluestack-ui/themed';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import React from 'react';
import { useForm } from 'react-hook-form';
import { RootStackParamList } from '../RootStack';
import { QSO, useStore } from '../store';
import { FormField } from '../utils/form-field';

const classes = {
    container: {
        padding: 10,
    },
    hstackElt: {
        flex: 1,
    },
};

export type QsoFormProps = {} & NativeStackScreenProps<RootStackParamList, 'QsoForm'>;

export type QsoFormComponent = React.FC<QsoFormProps>;

export const QsoForm: QsoFormComponent = ({ route }): JSX.Element => {
    const { qsoId } = route.params;
    const qso = useStore((state) => state.qsos).filter((q) => q.id == qsoId)[0];

    const { handleSubmit, control } = useForm<QSO>({
        defaultValues: qso,
    });

    const onSubmit = (qso: QSO) => {
        alert(JSON.stringify(qso));
    };

    return (
        <VStack space="md" sx={classes.container}>
            <HStack space="md">
                <Box sx={classes.hstackElt}>
                    <FormField name="callsign" label="Callsign:" control={control} />
                </Box>

                <Box sx={classes.hstackElt}>
                    <FormField name="name" label="Name:" control={control} />
                </Box>
            </HStack>

            <HStack space="md">
                <FormField
                    role="select"
                    name="mode"
                    label="Mode:"
                    options={{ SSB: 'SSB', AM: 'AM', FM: 'FM', CW: 'CW' }}
                    control={control}
                />
                <FormField name="frequency" label="Frequency:" control={control} />
                <FormField name="power" label="Power:" control={control} />
            </HStack>

            <HStack space="md">
                <FormField name="qth" label="QTH:" control={control} />
                <FormField name="locator" label="Locator:" control={control} />
            </HStack>

            <FormField role="textarea" name="note" label="Note:" control={control} />

            <Button onPress={handleSubmit(onSubmit)}>
                <ButtonText>Submit</ButtonText>
            </Button>
        </VStack>
    );
};
