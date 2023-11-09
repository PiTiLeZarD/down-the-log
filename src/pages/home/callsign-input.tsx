import { AddIcon, Input, InputField, InputIcon, InputSlot, Text } from '@gluestack-ui/themed';
import React from 'react';
import { NativeSyntheticEvent, TextInputChangeEventData } from 'react-native';
import cqzones from '../../data/cqzones.json';
import ituzones from '../../data/ituzones.json';
import { useStore } from '../../store';
import { findCountry, getCallsignData } from '../../utils/callsign';
import { Grid } from '../../utils/grid';
import { maidenDistance, maidenhead2Latlong } from '../../utils/locator';
import { findZone } from '../../utils/polydec';

export type CallsignInputProps = {
    callsign: string;
    handleAdd: () => void;
    setCallsign: (callsign: string) => void;
};

export type CallsignInputComponent = React.FC<CallsignInputProps>;

export const CallsignInput: CallsignInputComponent = ({ callsign, handleAdd, setCallsign }): JSX.Element => {
    const callsignData = callsign ? getCallsignData(callsign) : undefined;
    const currentLocation = useStore((state) => state.currentLocation);

    const country = findCountry(callsignData);

    return (
        <>
            {callsignData && (
                <Grid container>
                    <Grid item xs={4}>
                        <Text>
                            {country?.name} {callsignData.state ? `(${callsignData.state})` : ''}
                        </Text>
                    </Grid>
                    <Grid item xs={4}>
                        <Text>distance: {maidenDistance(currentLocation, callsignData.gs)}</Text>
                    </Grid>
                    <Grid item xs={2}>
                        <Text>
                            CQ: {callsignData.gs ? findZone(cqzones, maidenhead2Latlong(callsignData.gs)) : '??'}, ITU:{' '}
                            {callsignData.gs ? findZone(ituzones, maidenhead2Latlong(callsignData.gs)) : '??'}
                        </Text>
                    </Grid>
                    <Grid item xs={1}>
                        <Text>DXCC: {callsignData.dxcc}</Text>
                    </Grid>
                    <Grid item xs={1}>
                        <Text>({callsignData.ctn})</Text>
                    </Grid>
                </Grid>
            )}
            <Input size="lg">
                <InputField
                    onChange={(e: NativeSyntheticEvent<TextInputChangeEventData>) => setCallsign(e.nativeEvent.text)}
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
        </>
    );
};
