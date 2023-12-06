import { P } from "@expo/html-elements";
import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { TextInput, View } from "react-native";
import cqzones from "../../data/cqzones.json";
import ituzones from "../../data/ituzones.json";
import { useStore } from "../../store";
import { findCountry, getCallsignData } from "../../utils/callsign";
import { Grid } from "../../utils/grid";
import { maidenDistance, maidenhead2Latlong } from "../../utils/locator";
import { findZone } from "../../utils/polydec";

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
                        <P>
                            {country?.flag}
                            {country?.name} {callsignData.state ? `(${callsignData.state})` : ""}
                        </P>
                    </Grid>
                    <Grid item xs={3}>
                        <P>{maidenDistance(currentLocation, callsignData.gs)}km</P>
                    </Grid>
                    <Grid item xs={5} md={3}>
                        <P>
                            CQ: {callsignData.gs ? findZone(cqzones, maidenhead2Latlong(callsignData.gs)) : "??"}, ITU:{" "}
                            {callsignData.gs ? findZone(ituzones, maidenhead2Latlong(callsignData.gs)) : "??"}, DXCC:{" "}
                            {callsignData.dxcc}
                        </P>
                    </Grid>
                    <Grid item xs={-1} md={1}>
                        <P>({callsignData.ctn})</P>
                    </Grid>
                </Grid>
            )}
            <View>
                <TextInput
                    onChangeText={(text: string) => setCallsign(text.toUpperCase())}
                    onKeyPress={(e) => {
                        if ((e as any).keyCode === 13) handleAdd();
                    }}
                    value={callsign}
                    placeholder="Callsign"
                />
                <Ionicons name="add" size={24} color="black" />
            </View>
        </>
    );
};
