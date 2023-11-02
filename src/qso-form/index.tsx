import { Box, HStack, Input, InputField, Text, Textarea, TextareaInput, VStack } from '@gluestack-ui/themed';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import React from 'react';
import { useForm } from 'react-hook-form';
import { RootStackParamList } from '../RootStack';
import { QSO, useStore } from '../store';

const classes = {
    title: {
        fontWeight: 'bold',
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

    const { register } = useForm<QSO>({
        defaultValues: qso,
    });

    return (
        <VStack space="md">
            <HStack space="md" sx={classes.hstack}>
                <Box sx={classes.hstackElt}>
                    <Text sx={classes.title}>Callsign:</Text>
                    <Input>
                        <InputField {...register('callsign')} />
                    </Input>
                </Box>

                <Box sx={classes.hstackElt}>
                    <Text sx={classes.title}>Name:</Text>
                    <Input>
                        <InputField {...register('name')} />
                    </Input>
                </Box>
            </HStack>

            <HStack space="md" sx={classes.hstack}>
                <Box sx={classes.hstackElt}>
                    <Text sx={classes.title}>Mode:</Text>
                    <Input>
                        <InputField {...register('mode')} />
                    </Input>
                </Box>

                <Box sx={{ flex: 3 }}>
                    <Text sx={classes.title}>Frequency:</Text>
                    <Input>
                        <InputField {...register('frequency')} />
                    </Input>
                </Box>

                <Box sx={classes.hstackElt}>
                    <Text sx={classes.title}>Power:</Text>
                    <Input>
                        <InputField {...register('power')} />
                    </Input>
                </Box>
            </HStack>

            <HStack space="md" sx={classes.hstack}>
                <Box sx={{ flex: 4 }}>
                    <Text sx={classes.title}>QTH:</Text>
                    <Input>
                        <InputField {...register('qth')} />
                    </Input>
                </Box>

                <Box sx={classes.hstackElt}>
                    <Text sx={classes.title}>Locator:</Text>
                    <Input>
                        <InputField {...register('locator')} />
                    </Input>
                </Box>
            </HStack>

            <Box>
                <Text sx={classes.title}>Note:</Text>
                <Textarea>
                    <TextareaInput {...register('note')} />
                </Textarea>
            </Box>
        </VStack>
    );
};
