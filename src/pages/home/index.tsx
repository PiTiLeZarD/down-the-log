import { DrawerScreenProps } from "@react-navigation/drawer";
import React from "react";
import { View } from "react-native";
import { createStyleSheet, useStyles } from "react-native-unistyles";
import { NavigationParamList } from "../../Navigation";
import { useStore } from "../../store";
import { HamQTHCallsignData } from "../../utils/hamqth";
import { newQso, useQsos } from "../../utils/qso";
import { QsoList } from "../../utils/qso/qso-list";
import { Alert } from "../../utils/theme/components/alert";
import { Typography } from "../../utils/theme/components/typography";
import { Beacons } from "./beacons";
import { CallsignInput } from "./callsign-input";
import { Filters, QsoFilter, filterMap } from "./filters";

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
    const [qsosFilters, setQsosFilters] = React.useState<QsoFilter[]>([]);
    const qsos = useQsos();
    const { styles } = useStyles(stylesheet);
    const currentLocation = useStore((state) => state.currentLocation);
    const settings = useStore((state) => state.settings);
    const log = useStore((state) => state.log);

    const handleAdd = (hamqthCSData?: HamQTHCallsignData) => {
        const qso = newQso(callsign, qsos, currentLocation, undefined, settings.myCallsign);
        if (hamqthCSData) {
            qso.name = hamqthCSData.name;
            qso.qth = hamqthCSData.qth;
            qso.locator = hamqthCSData.grid;
        }
        log(qso);
        setCallsign("");
        navigation.navigate("QsoForm", { qsoId: qso.id });
    };
    console.log({ qsosFilters });

    return (
        <View style={styles.container}>
            {!settings.myCallsign && (
                <Alert severity="warning">
                    <Typography>Your callsign isn't set properly, check the settings to set it up!</Typography>
                </Alert>
            )}
            {settings.showBeacons && <Beacons />}
            {settings.showFilters && <Filters filters={qsosFilters} setFilters={setQsosFilters} />}
            <QsoList
                style={styles.table}
                qsos={qsos.filter((q) =>
                    qsosFilters.reduce((acc, { name, values }) => acc && values.includes(filterMap[name](q)), true),
                )}
                filters={callsign ? [(q) => q.callsign.includes(callsign)] : undefined}
                onQsoPress={(qso) => navigation.navigate("QsoForm", { qsoId: qso.id })}
            />
            <View style={styles.inputs}>
                <CallsignInput handleAdd={handleAdd} onChange={setCallsign} value={callsign} />
            </View>
        </View>
    );
};
