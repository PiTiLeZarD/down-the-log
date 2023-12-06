import { P } from "@expo/html-elements";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import React from "react";
import { Button, ScrollView } from "react-native";
import { RootStackParamList } from "../../RootStack";

export type AboutProps = {} & NativeStackScreenProps<RootStackParamList, "About">;

export type AboutComponent = React.FC<AboutProps>;

export const About: AboutComponent = ({ navigation }): JSX.Element => {
    return (
        <ScrollView>
            <P>About</P>
            <P>
                Look, this app is absolute rubbish for now. Just so you know, I'm coding this in chunks of 5mn when I
                get the time (kids and all) so it'll only get better. I have plenty of ideas, and I'll just keep adding
                to it. If you see this app now it's simply because I'm testing things.
            </P>
            <P>Just a couple of ideas I have:</P>
            <P>1) All basic log stuff, import/export adif, quick around the band qso, contest mode</P>
            <P>
                2) I'd like to have a band browse mode. You hear people on different frenquencies, you pencil them in,
                whenever you get a qso, you just need to select one of the callsigns. (I often try multiple times to get
                someone and sometimes forget where in the band they were) Kinda like a mempad on icom.
            </P>
            <P>
                3) I want all the QTH, location, distance and all that to be as smooth as possible. I need 4 tools now
                to find the maidenhead, and have the right location and all that.
            </P>
            <P>
                4) I'd like nice visualisation tools, see your qsos as map, as sessions, have filters, dx bingo and so
                on.
            </P>
            <P>5) Special modes for SOTA, WWFF, POTA, pileups and so on.</P>
            <P>6) down the track, integrated with HamQTH, QRZ, lotw and all the goodies</P>
            <Button title="Back" onPress={() => navigation.goBack()} />
        </ScrollView>
    );
};
