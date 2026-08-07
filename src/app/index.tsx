import { useRouter } from "expo-router";
import { DateTime } from "luxon";
import React, { useEffect, useEffectEvent, useMemo } from "react";
import { FormProvider, useForm, useWatch } from "react-hook-form";
import { View } from "react-native";
import { StyleSheet } from "react-native-unistyles";
import { Beacons } from "../lib/components/beacons";
import { Filters, useFilteredQsos } from "../lib/components/filters";
import { FirstRunSetup } from "../lib/components/first-run-setup";
import { CallsignInput } from "../lib/components/form/callsign-input";
import {
    QSO,
    carryOver,
    createQso,
    extrapolate,
    myStationFromSettings,
    prefillMyStation,
    prefillOperating,
    useQsos,
} from "../lib/components/qso";
import { QsoHeatmap } from "../lib/components/qso-heatmap";
import { QsoList } from "../lib/components/qso/qso-list";
import { useHydrated, useStore } from "../lib/utils/store";
import { Alert } from "../lib/ui/alert";
import { Button } from "../lib/ui/button";
import { Typography } from "../lib/ui/typography";
import { useSettings } from "../lib/utils/use-settings";

const styles = StyleSheet.create((theme) => ({
    container: {
        display: "flex",
        flex: 1,
        width: "100%",
        height: "100%",
    },
    content: {
        flexGrow: 1,
    },
    // The list grows into whatever the inputs leave behind rather than pushing them off-screen.
    list: {
        height: 0,
    },
    inputs: {
        width: "100%",
        backgroundColor: theme.background,
        color: theme.text.contrast,
    },
}));

const Index = () => {
    const qsos = useQsos();
    const currentLocation = useStore((state) => state.currentLocation);
    const settings = useSettings();
    const log = useStore((state) => state.log);
    const listQsos = useFilteredQsos();
    const methods = useForm<QSO>({ defaultValues: {} });
    const { navigate } = useRouter();

    // A missing callsign is the one setting the app can't work around, so it opens the setup itself
    // on a fresh install rather than leaving a warning for the operator to act on.
    const hydrated = useHydrated();
    const [setupDismissed, setSetupDismissed] = React.useState<boolean>(false);
    const needsSetup = hydrated && !settings.myCallsign;

    const lastQso = qsos.length ? qsos[0] : undefined;

    // `useWatch` rather than `methods.watch()`: the latter can't be memoised, which made React
    // Compiler skip this whole file.
    const callsign = useWatch({ control: methods.control, name: "callsign" });
    const listFilters = useMemo(
        () => (callsign ? [(q: QSO) => q.callsign.includes(callsign)] : undefined),
        [callsign],
    );
    const resetQso = (previousQso?: QSO) => {
        let qso = prefillMyStation(createQso(""), myStationFromSettings(settings, currentLocation));
        if (previousQso || lastQso) qso = carryOver(qso, previousQso || (lastQso as QSO), settings.carryOver);
        methods.reset(prefillOperating(qso, { mode: "SSB", band: "20m" }));
    };
    // Resetting reads the settings and the current location, but only a new QSO in the log or an
    // emptied callsign box should trigger it — an effect event keeps those out of the dependencies.
    const resetForm = useEffectEvent(() => resetQso());
    useEffect(() => resetForm(), [lastQso]);
    useEffect(() => {
        if (callsign === "") resetForm();
    }, [callsign]);

    const handleAdd = () => {
        const qso: QSO = extrapolate(methods.getValues(), qsos, settings.carryOver);
        qso.date = DateTime.utc();
        log(qso);
        if (!settings.contestMode) navigate(`/qso?qsoId=${qso.id}`);
        resetQso(qso);
    };

    return (
        <View style={styles.container}>
            <View style={styles.content}>
                <FirstRunSetup
                    open={needsSetup && !setupDismissed}
                    onClose={() => setSetupDismissed(true)}
                />
                {needsSetup && setupDismissed && (
                    <Alert severity="warning">
                        <Typography style={{ flexGrow: 1 }}>Your callsign isn't set yet.</Typography>
                        <Button text="Set it up" onPress={() => setSetupDismissed(false)} />
                    </Alert>
                )}
                {settings.showBeacons && <Beacons />}
                {settings.showHeatmap && <QsoHeatmap />}
                {settings.showFilters && <Filters showTag />}
                <QsoList
                    style={styles.list}
                    qsos={listQsos}
                    filters={listFilters}
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
