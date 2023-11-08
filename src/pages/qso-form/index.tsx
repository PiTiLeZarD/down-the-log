import { Button, ButtonText, HStack, Text } from '@gluestack-ui/themed';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import React from 'react';
import { useForm } from 'react-hook-form';
import { RootStackParamList } from '../../RootStack';
import { freq2band } from '../../data/bands';
import { QSO, useStore } from '../../store';
import { FormField } from '../../utils/form-field';
import { Grid } from '../../utils/grid';

export type QsoFormProps = {} & NativeStackScreenProps<RootStackParamList, 'QsoForm'>;

export type QsoFormComponent = React.FC<QsoFormProps>;

export const QsoForm: QsoFormComponent = ({ navigation, route }): JSX.Element => {
    const { qsoId } = route.params;
    const qso = useStore((state) => state.qsos).filter((q) => q.id == qsoId)[0];
    const log = useStore((state) => state.log);
    const deleteLog = useStore((state) => state.deleteLog);

    const { handleSubmit, control, watch } = useForm<QSO>({
        defaultValues: qso,
    });

    const freq = watch('frequency');

    const onSubmit = (qso: QSO) => {
        log(qso);
        navigation.navigate('Home');
    };

    const onDelete = () => {
        deleteLog(qso);
        navigation.navigate('Home');
    };

    return (
        <>
            <Button onPress={() => navigation.navigate('Home')}>
                <ButtonText>Back</ButtonText>
            </Button>
            <Grid container>
                <Grid item xs={12} sm={6}>
                    <FormField name="callsign" label="Callsign:" control={control} />
                </Grid>
                <Grid item xs={12} sm={6}>
                    <FormField name="name" label="Name:" control={control} />
                </Grid>
            </Grid>
            <Grid container>
                <Grid item xs={12} sm={3}>
                    <FormField
                        role="select"
                        name="mode"
                        label="Mode:"
                        options={{ SSB: 'SSB', AM: 'AM', FM: 'FM', CW: 'CW' }}
                        control={control}
                    />
                </Grid>
                <Grid item xs={8} sm={4}>
                    <FormField name="frequency" label="Frequency:" control={control} placeholder="In Khz" />
                </Grid>
                <Grid item xs={4} sm={2}>
                    <Text>
                        Band: <br />
                        {freq2band(freq) || 'N/A'}
                    </Text>
                </Grid>
                <Grid item xs={12} sm={3}>
                    <FormField name="power" label="Power:" control={control} />
                </Grid>
            </Grid>
            <Grid container>
                <Grid item xs={12} sm={6}>
                    <FormField name="qth" label="QTH:" control={control} />
                </Grid>
                <Grid item xs={12} sm={6}>
                    <FormField name="locator" label="Locator:" control={control} />
                </Grid>
            </Grid>
            <FormField role="textarea" name="note" label="Note:" control={control} />
            <HStack>
                <Button onPress={handleSubmit(onSubmit)}>
                    <ButtonText>Submit</ButtonText>
                </Button>
                <Button onPress={() => onDelete()}>
                    <ButtonText>Delete</ButtonText>
                </Button>
            </HStack>
        </>
    );
};
