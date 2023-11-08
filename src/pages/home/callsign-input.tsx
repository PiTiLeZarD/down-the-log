import { AddIcon, Input, InputField, InputIcon, InputSlot, Text } from '@gluestack-ui/themed';
import React from 'react';
import { NativeSyntheticEvent, TextInputChangeEventData } from 'react-native';
import cqzones from '../../data/cqzones.json';
import ituzones from '../../data/ituzones.json';
import { useStore } from '../../store';
import { findCountry, parseCallsign } from '../../utils/callsign';
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
    const data = callsign ? parseCallsign(callsign) : false;
    const currentLocation = useStore((state) => state.currentLocation);

    const country = data && data.data && data.data.iso3 ? findCountry(data.data || {}) : null;

    return (
        <>
            {data && (
                <Grid container>
                    <Grid item xs={4}>
                        <Text>
                            {country?.name} {data.data?.state ? `(${data.data?.state})` : ''}
                        </Text>
                    </Grid>
                    <Grid item xs={4}>
                        <Text>distance: {maidenDistance(currentLocation, data.data?.gs || currentLocation)}</Text>
                    </Grid>
                    <Grid item xs={2}>
                        <Text>
                            ITU: {data.data?.gs ? findZone(ituzones, maidenhead2Latlong(data.data?.gs)) : '??'}, CQ:{' '}
                            {data.data?.gs ? findZone(cqzones, maidenhead2Latlong(data.data?.gs)) : '??'}
                        </Text>
                    </Grid>
                    <Grid item xs={1}>
                        <Text>DXCC: {data.data?.dxcc}</Text>
                    </Grid>
                    <Grid item xs={1}>
                        <Text>({data.data?.ctn})</Text>
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
