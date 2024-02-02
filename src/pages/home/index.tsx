import { StackScreenProps } from "@react-navigation/stack";
import React, { useEffect } from "react";
import { FormProvider, useForm } from "react-hook-form";
import { View } from "react-native";
import { createStyleSheet, useStyles } from "react-native-unistyles";
import { NavigationParamList } from "../../Navigation";
import { useStore } from "../../store";
import { HamQTHCallsignData } from "../../utils/hamqth";
import { QSO, newQso, useQsos } from "../../utils/qso";
import { QsoList } from "../../utils/qso/qso-list";
import { Alert } from "../../utils/theme/components/alert";
import { Typography } from "../../utils/theme/components/typography";
import { useSettings } from "../../utils/use-settings";
import { Beacons } from "./beacons";
import { CallsignInput } from "./callsign-input";
import { Filters, filterQsos } from "./filters";

const stylesheet = createStyleSheet((theme) => ({
    container: {
        display: "flex",
        flex: 1,
        width: "100%",
        height: "100%",
    },
    content: {
        flexGrow: 1,
    },
    inputs: {
        width: "100%",
        backgroundColor: "white",
    },
}));

export type HomeProps = {} & StackScreenProps<NavigationParamList, "Home">;

export type HomeComponent = React.FC<HomeProps>;

export const Home: HomeComponent = ({ navigation }): JSX.Element => {
    const [qso, setQso] = React.useState<QSO | undefined>(undefined);
    const qsos = useQsos();
    const { styles } = useStyles(stylesheet);
    const currentLocation = useStore((state) => state.currentLocation);
    const settings = useSettings();
    const log = useStore((state) => state.log);
    const qsosFilters = useStore((state) => state.filters);
    const methods = useForm<QSO>({ defaultValues: qso });

    const callsign = methods.watch("callsign");
    useEffect(() => {
        setQso(newQso(callsign, qsos, currentLocation, undefined, settings.myCallsign));
    }, [callsign]);
    useEffect(() => methods.reset(qso), [qso?.id]);

    const handleAdd = (hamqthCSData?: HamQTHCallsignData) => {
        if (qso) {
            if (hamqthCSData) {
                qso.name = hamqthCSData.name;
                qso.qth = hamqthCSData.qth;
                qso.locator = hamqthCSData.grid;
            }
            log(qso);
            methods.setValue("callsign", "");
            navigation.navigate("QsoForm", { qsoId: qso.id });
        }
    };

    return (
        <View style={styles.container}>
            <View style={styles.content}>
                {!settings.myCallsign && (
                    <Alert severity="warning">
                        <Typography>Your callsign isn't set properly, check the settings to set it up!</Typography>
                    </Alert>
                )}
                {settings.showBeacons && <Beacons />}
                {settings.showFilters && <Filters showTag />}
                <QsoList
                    style={{ height: 0 }}
                    qsos={filterQsos(qsos, qsosFilters)}
                    filters={callsign ? [(q) => q.callsign.includes(callsign)] : undefined}
                    onQsoPress={(qso) => navigation.navigate("QsoForm", { qsoId: qso.id })}
                />
            </View>
            <View style={styles.inputs}>
                <FormProvider {...methods}>
                    <CallsignInput handleAdd={handleAdd} />
                </FormProvider>
            </View>
        </View>
    );
};
