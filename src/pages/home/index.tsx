import { DrawerScreenProps } from "@react-navigation/drawer";
import React, { useMemo } from "react";
import { ScrollView, View } from "react-native";
import { NavigationParamList } from "../../Navigation";
import { useStore } from "../../store";
import { newQso, useQsos } from "../../utils/qso";
import { QsoList } from "../../utils/qso/qso-list";
import { createStyleSheet, useStyles } from "../../utils/theme";
import { CallsignInput } from "./callsign-input";

const stylesheet = createStyleSheet((theme) => ({
    container: {
        display: "flex",
        flex: 1,
        width: "100%",
        height: "100%",
    },
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

export type HomeProps = {} & DrawerScreenProps<NavigationParamList, "Home">;

export type HomeComponent = React.FC<HomeProps>;

export const Home: HomeComponent = ({ navigation }): JSX.Element => {
    const [callsign, setCallsign] = React.useState<string>("");
    const qsos = useQsos();
    const { styles } = useStyles(stylesheet);
    const currentLocation = useStore((state) => state.currentLocation);
    const log = useStore((state) => state.log);

    const filteredQsos = useMemo(
        () => (callsign ? qsos.filter((q) => q.callsign.includes(callsign)) || qsos : qsos),
        [callsign],
    );

    const handleAdd = () => {
        const qso = newQso(callsign, currentLocation, qsos);
        log(qso);
        setCallsign("");
        navigation.navigate("QsoForm", { qsoId: qso.id });
    };

    return (
        <View style={styles.container}>
            <ScrollView style={styles.table}>
                <QsoList qsos={filteredQsos} onQsoPress={(qso) => navigation.navigate("QsoForm", { qsoId: qso.id })} />
            </ScrollView>
            <View style={styles.inputs}>
                <CallsignInput handleAdd={handleAdd} setCallsign={setCallsign} callsign={callsign} />
            </View>
        </View>
    );
};
