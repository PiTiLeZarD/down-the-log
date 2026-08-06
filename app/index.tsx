import { useRouter } from "expo-router";
import { DateTime } from "luxon";
import { useEffect, useEffectEvent, useMemo } from "react";
import { FormProvider, useForm, useWatch } from "react-hook-form";
import { View } from "react-native";
import { StyleSheet } from "react-native-unistyles";
import { Beacons } from "./lib/components/beacons";
import { Filters, filterQsos } from "./lib/components/filters";
import { CallsignInput } from "./lib/components/form/callsign-input";
import {
    QSO,
    carryOver,
    createQso,
    extrapolate,
    prefillMyStation,
    prefillOperating,
    useQsos,
} from "./lib/components/qso";
import { QsoList } from "./lib/components/qso/qso-list";
import { useStore } from "./lib/utils/store";
import { Alert } from "./lib/utils/theme/components/alert";
import { Typography } from "./lib/utils/theme/components/typography";
import { useSettings } from "./lib/utils/use-settings";

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
    const qsosFilters = useStore((state) => state.filters);
    const methods = useForm<QSO>({ defaultValues: {} });
    const { navigate } = useRouter();

    const lastQso = qsos.length ? qsos[0] : undefined;

    // `useWatch` rather than `methods.watch()`: the latter can't be memoised, which made React
    // Compiler skip this whole file.
    const callsign = useWatch({ control: methods.control, name: "callsign" });
    const listQsos = useMemo(() => filterQsos(qsos, qsosFilters), [qsos, qsosFilters]);
    const listFilters = useMemo(
        () => (callsign ? [(q: QSO) => q.callsign.includes(callsign)] : undefined),
        [callsign],
    );
    const resetQso = (previousQso?: QSO) => {
        let qso = prefillMyStation(createQso(""), { myCallsign: settings.myCallsign, myLocator: currentLocation });
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
                {!settings.myCallsign && (
                    <Alert severity="warning">
                        <Typography>Your callsign isn't set properly, check the settings to set it up!</Typography>
                    </Alert>
                )}
                {settings.showBeacons && <Beacons />}
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
