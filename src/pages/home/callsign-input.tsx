import React, { useMemo } from "react";
import { View } from "react-native";
import cqzones from "../../data/cqzones.json";
import ituzones from "../../data/ituzones.json";
import { useStore } from "../../store";
import { findCountry, getCallsignData } from "../../utils/callsign";
import { Grid } from "../../utils/grid";
import { maidenDistance, maidenhead2Latlong } from "../../utils/locator";
import { findZone } from "../../utils/polydec";
import { Stack } from "../../utils/stack";
import { Button } from "../../utils/theme/components/button";
import { Icon } from "../../utils/theme/components/icon";
import { Input } from "../../utils/theme/components/input";
import { Typography } from "../../utils/theme/components/typography";

export type CallsignInputProps = {
    callsign: string;
    handleAdd: () => void;
    setCallsign: (callsign: string) => void;
};

export type CallsignInputComponent = React.FC<CallsignInputProps>;

export const CallsignInput: CallsignInputComponent = ({ callsign, handleAdd, setCallsign }): JSX.Element => {
    const callsignData = useMemo(() => (callsign ? getCallsignData(callsign) : undefined), [callsign]);
    const currentLocation = useStore((state) => state.currentLocation);

    const country = callsignData ? findCountry(callsignData) : null;

    return (
        <Stack>
            {callsignData && (
                <Grid container>
                    <Grid item xs={4}>
                        <Typography>
                            {country?.flag}
                            {country?.name} {callsignData.state ? `(${callsignData.state})` : ""}
                        </Typography>
                    </Grid>
                    <Grid item xs={3}>
                        <Typography>{maidenDistance(currentLocation, callsignData.gs)}km</Typography>
                    </Grid>
                    <Grid item xs={5} md={3}>
                        <Typography>
                            CQ: {callsignData.gs ? findZone(cqzones, maidenhead2Latlong(callsignData.gs)) : "??"}, ITU:{" "}
                            {callsignData.gs ? findZone(ituzones, maidenhead2Latlong(callsignData.gs)) : "??"}, DXCC:{" "}
                            {callsignData.dxcc}
                        </Typography>
                    </Grid>
                    <Grid item xs={-1} md={1}>
                        <Typography>({callsignData.ctn})</Typography>
                    </Grid>
                </Grid>
            )}
            <Stack direction="row">
                <View style={{ flexGrow: 1 }}>
                    <Input
                        onChangeText={(text: string) => setCallsign(text.toUpperCase())}
                        onKeyPress={(e) => {
                            if ((e as any).keyCode === 13) handleAdd();
                        }}
                        value={callsign}
                        placeholder="Callsign"
                    />
                </View>
                <Button onPress={() => handleAdd()}>
                    <Icon name="add" contrast />
                </Button>
            </Stack>
        </Stack>
    );
};
