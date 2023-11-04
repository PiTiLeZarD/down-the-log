import { Button, ButtonText } from '@gluestack-ui/themed';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import React from 'react';
import { useForm } from 'react-hook-form';
import { RootStackParamList } from '../RootStack';
import { QSO, useStore } from '../store';
import { FormField } from '../utils/form-field';
import { Col, Row } from '../utils/grid';

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
        <>
            <Row>
                <Col xs={12} sm={6}>
                    <FormField name="callsign" label="Callsign:" control={control} />
                </Col>
                <Col xs={12} sm={6}>
                    <FormField name="name" label="Name:" control={control} />
                </Col>
            </Row>
            <Row>
                <Col xs={12} sm={3}>
                    <FormField
                        role="select"
                        name="mode"
                        label="Mode:"
                        options={{ SSB: 'SSB', AM: 'AM', FM: 'FM', CW: 'CW' }}
                        control={control}
                    />
                </Col>
                <Col xs={12} sm={6}>
                    <FormField name="frequency" label="Frequency:" control={control} />
                </Col>
                <Col xs={12} sm={3}>
                    <FormField name="power" label="Power:" control={control} />
                </Col>
            </Row>
            <Row>
                <Col xs={12} sm={6}>
                    <FormField name="qth" label="QTH:" control={control} />
                </Col>
                <Col xs={12} sm={6}>
                    <FormField name="locator" label="Locator:" control={control} />
                </Col>
            </Row>
            <FormField role="textarea" name="note" label="Note:" control={control} />
            <Button onPress={handleSubmit(onSubmit)}>
                <ButtonText>Submit</ButtonText>
            </Button>
        </>
    );
};
