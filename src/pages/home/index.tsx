import React from "react";

import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { ScrollView, View } from "react-native";
import { RootStackParamList } from "../../RootStack";
import { useStore } from "../../store";
import { Clocks } from "../../utils/clocks";
import { newQso, useQsos } from "../../utils/qso";
import { createStyleSheet, useStyles } from "../../utils/theme";
import { CallsignInput } from "./callsign-input";
import { LocationHeader } from "./location-header";
import { QsoList } from "./qso-list";

const stylesheet = createStyleSheet((theme) => ({
    container: {
        display: "flex",
        flex: 1,
        width: "100%",
        height: "100%",
    },
    top: {},
    table: {
        flexGrow: 1,
        paddingBottom: 45,
    },
    inputs: {
        left: 0,
        bottom: 0,
        width: "100%",
        backgroundColor: "white",
    },
}));

export type HomeProps = {} & NativeStackScreenProps<RootStackParamList, "Home">;

export type HomeComponent = React.FC<HomeProps>;

export const Home: HomeComponent = ({ navigation }): JSX.Element => {
    const [callsign, setCallsign] = React.useState<string>("");
    const qsos = useQsos();
    const { styles } = useStyles(stylesheet);
    const currentLocation = useStore((state) => state.currentLocation);
    const log = useStore((state) => state.log);

    const handleAdd = () => {
        const qso = newQso(callsign, currentLocation, qsos);
        log(qso);
        setCallsign("");
        navigation.navigate("QsoForm", { qsoId: qso.id });
    };

    return (
        <View style={styles.container}>
            <View style={styles.top}>
                <LocationHeader navigation={navigation} />
                <Clocks />T
            </View>
            <ScrollView style={styles.table}>
                <QsoList
                    qsos={qsos.filter((q) => q.callsign.includes(callsign))}
                    onQsoPress={(qso) => navigation.navigate("QsoForm", { qsoId: qso.id })}
                />
            </ScrollView>
            <View style={styles.inputs}>
                <CallsignInput handleAdd={handleAdd} setCallsign={setCallsign} callsign={callsign} />
            </View>
        </View>
    );
};
