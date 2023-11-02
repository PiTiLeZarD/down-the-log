import {
    ChevronDownIcon,
    FormControl,
    FormControlLabel,
    HStack,
    Icon,
    Input,
    InputField,
    Select,
    SelectBackdrop,
    SelectContent,
    SelectDragIndicator,
    SelectDragIndicatorWrapper,
    SelectIcon,
    SelectInput,
    SelectItem,
    SelectPortal,
    SelectTrigger,
    Text,
    Textarea,
    TextareaInput,
    VStack,
} from '@gluestack-ui/themed';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import React from 'react';
import { useForm } from 'react-hook-form';
import { RootStackParamList } from '../RootStack';
import { QSO, useStore } from '../store';

const classes = {
    container: {
        padding: 10,
    },
    hstack: {},
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
        <VStack space="md" sx={classes.container}>
            <HStack space="md" sx={classes.hstack}>
                <FormControl sx={classes.hstackElt}>
                    <FormControlLabel>
                        <Text>Callsign:</Text>
                    </FormControlLabel>
                    <Input>
                        <InputField {...register('callsign')} />
                    </Input>
                </FormControl>

                <FormControl sx={classes.hstackElt}>
                    <FormControlLabel>
                        <Text>Name:</Text>
                    </FormControlLabel>
                    <Input>
                        <InputField {...register('name')} />
                    </Input>
                </FormControl>
            </HStack>

            <HStack space="md" sx={classes.hstack}>
                <FormControl sx={classes.hstackElt}>
                    <FormControlLabel>
                        <Text>Mode:</Text>
                    </FormControlLabel>
                    <Select {...register('mode')}>
                        <SelectTrigger variant="outline" size="md">
                            <SelectInput placeholder="Select option" />
                            <SelectIcon mr="$3">
                                <Icon as={ChevronDownIcon} />
                            </SelectIcon>
                        </SelectTrigger>
                        <SelectPortal>
                            <SelectBackdrop />
                            <SelectContent>
                                <SelectDragIndicatorWrapper>
                                    <SelectDragIndicator />
                                </SelectDragIndicatorWrapper>
                                <SelectItem label="SSB" value="SSB" />
                                <SelectItem label="AM" value="AM" />
                                <SelectItem label="FM" value="FM" />
                                <SelectItem label="CW" value="CW" />
                            </SelectContent>
                        </SelectPortal>
                    </Select>
                </FormControl>

                <FormControl sx={{ flex: 3 }}>
                    <FormControlLabel>
                        <Text>Frequency:</Text>
                    </FormControlLabel>
                    <Input>
                        <InputField {...register('frequency')} />
                    </Input>
                </FormControl>

                <FormControl sx={classes.hstackElt}>
                    <FormControlLabel>
                        <Text>Power:</Text>
                    </FormControlLabel>
                    <Input>
                        <InputField {...register('power')} />
                    </Input>
                </FormControl>
            </HStack>

            <HStack space="md" sx={classes.hstack}>
                <FormControl sx={{ flex: 4 }}>
                    <FormControlLabel>
                        <Text>QTH:</Text>
                    </FormControlLabel>
                    <Input>
                        <InputField {...register('qth')} />
                    </Input>
                </FormControl>

                <FormControl sx={classes.hstackElt}>
                    <FormControlLabel>
                        <Text>Locator:</Text>
                    </FormControlLabel>
                    <Input>
                        <InputField {...register('locator')} />
                    </Input>
                </FormControl>
            </HStack>

            <FormControl>
                <FormControlLabel>
                    <Text>Note:</Text>
                </FormControlLabel>
                <Textarea>
                    <TextareaInput {...register('note')} />
                </Textarea>
            </FormControl>
        </VStack>
    );
};
