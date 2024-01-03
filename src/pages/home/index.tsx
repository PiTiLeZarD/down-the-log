import { DrawerScreenProps } from "@react-navigation/drawer";
import React from "react";
import { View } from "react-native";
import { createStyleSheet, useStyles } from "react-native-unistyles";
import { NavigationParamList } from "../../Navigation";
import { useStore } from "../../store";
import { newQso, useQsos } from "../../utils/qso";
import { QsoList } from "../../utils/qso/qso-list";
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
    const settings = useStore((state) => state.settings);
    const log = useStore((state) => state.log);

    const handleAdd = () => {
        const qso = newQso(callsign, qsos, currentLocation, undefined, settings.myCallsign);
        log(qso);
        setCallsign("");
        navigation.navigate("QsoForm", { qsoId: qso.id });
    };

    return (
        <View style={styles.container}>
            <QsoList
                style={styles.table}
                qsos={qsos}
                filters={callsign ? [(q) => q.callsign.includes(callsign)] : undefined}
                onQsoPress={(qso) => navigation.navigate("QsoForm", { qsoId: qso.id })}
            />
            <View style={styles.inputs}>
                <CallsignInput handleAdd={handleAdd} onChange={setCallsign} value={callsign} />
            </View>
        </View>
    );
};
