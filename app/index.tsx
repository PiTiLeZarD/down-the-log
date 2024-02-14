import { useRouter } from "expo-router";
import { DateTime } from "luxon";
import React, { useEffect } from "react";
import { FormProvider, useForm } from "react-hook-form";
import { View } from "react-native";
import { createStyleSheet, useStyles } from "react-native-unistyles";
import { Beacons } from "./lib/components/beacons";
import { Filters, filterQsos } from "./lib/components/filters";
import { CallsignInput } from "./lib/components/form/callsign-input";
import { QSO, newQso, qsoLocationFill, useQsos } from "./lib/components/qso";
import { QsoList } from "./lib/components/qso/qso-list";
import { band2freq } from "./lib/data/bands";
import { useStore } from "./lib/utils/store";
import { Alert } from "./lib/utils/theme/components/alert";
import { Typography } from "./lib/utils/theme/components/typography";
import { useSettings } from "./lib/utils/use-settings";

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
        backgroundColor: theme.background,
        color: theme.text.contrast,
    },
}));

export type IndexProps = {};

export type IndexComponent = React.FC<IndexProps>;

const Index: IndexComponent = (): JSX.Element => {
    const qsos = useQsos();
    const { styles } = useStyles(stylesheet);
    const currentLocation = useStore((state) => state.currentLocation);
    const settings = useSettings();
    const log = useStore((state) => state.log);
    const qsosFilters = useStore((state) => state.filters);
    const methods = useForm<QSO>({ defaultValues: {} });
    const { navigate } = useRouter();

    const callsign = methods.watch("callsign");
    const resetQso = () => {
        const qso = newQso("", qsos, currentLocation, undefined, settings.myCallsign, settings.carryOver);
        if (!qso.band) qso.band = "20m";
        if (!qso.frequency) qso.frequency = band2freq("20m");
        if (!qso.mode) qso.mode = "SSB";
        methods.reset(qso);
    };
    useEffect(resetQso, []);

    const handleAdd = () => {
        const qso: QSO = methods.getValues();
        qso.date = DateTime.utc();
        log(qsoLocationFill(qso));
        if (!settings.contestMode) navigate(`/qso?qsoId=${qso.id}`);
        resetQso();
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
                    onQsoPress={(qso) => navigate(`/qso?qsoId=${qso.id}`)}
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

export default Index;
