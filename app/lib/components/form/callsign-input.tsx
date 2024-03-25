import React, { useEffect } from "react";
import { useFormContext } from "react-hook-form";
import { View } from "react-native";
import { createStyleSheet, useStyles } from "react-native-unistyles";
import { baseCallsign } from "../../utils/callsign";
import { useHamqth } from "../../utils/hamqth";
import { Button } from "../../utils/theme/components/button";
import { Input } from "../../utils/theme/components/input";
import { useSettings } from "../../utils/use-settings";
import { QSO, useQsos } from "../qso";
import { Stack } from "../stack";
import { BandFreqInput } from "./band-freq-input";
import { CallsignInputExtra } from "./callsign-input-extra";
import { Events } from "./events";
import { FormField } from "./form-field";
import { ModeInput } from "./mode-input";
import { Signal } from "./signal";

const stylesheet = createStyleSheet((theme) => ({
    inputBox: {
        backgroundColor: theme.colours.primary[theme.shades.light],
        borderTopColor: theme.colours.primary[theme.shades.darker],
        borderTopWidth: theme.margins.sm,
        borderTopStyle: "solid",
        padding: theme.margins.md,
    },
    input: {
        backgroundColor: theme.background,
    },
}));

export type CallsignInputProps = {
    handleAdd: () => void;
};

export type CallsignInputComponent = React.FC<CallsignInputProps>;

export const CallsignInput: CallsignInputComponent = ({ handleAdd }): JSX.Element => {
    const qsos = useQsos();
    const { styles } = useStyles(stylesheet);
    const { watch, setValue } = useFormContext<QSO>();
    const { inputBarConfig, contestMode } = useSettings();

    const callsign = watch("callsign");
    const previousQso = qsos.filter((q) => baseCallsign(q.callsign) === baseCallsign(callsign));
    let hamqthCSData = useHamqth(callsign);
    if ((previousQso || []).length) {
        hamqthCSData = {
            callsign,
            qth: previousQso[0].qth,
            name: previousQso[0].name,
            country: previousQso[0].country,
            itu: previousQso[0].ituzone,
            cq: previousQso[0].cqzone,
            grid: previousQso[0].locator,
        } as any;
    }

    useEffect(() => {
        if (hamqthCSData && hamqthCSData.callsign == baseCallsign(callsign)) {
            setValue("name", hamqthCSData.name);
            setValue("qth", hamqthCSData.qth);
            setValue("locator", hamqthCSData.grid);
        }
    }, [hamqthCSData]);

    return (
        <Stack style={styles.inputBox}>
            <CallsignInputExtra value={callsign} hamqthCSData={hamqthCSData} />
            <Stack direction="row" gap="xxl">
                {inputBarConfig.includes("sig") && (
                    <View>
                        <Events />
                    </View>
                )}
                {inputBarConfig.includes("mode") && <ModeInput noLabel />}
                {inputBarConfig.includes("frequency") && <BandFreqInput noLabel />}
                <View style={{ flexGrow: 1 }}>
                    <Input
                        value={callsign}
                        style={styles.input}
                        transformValue={(v) => v.toUpperCase()}
                        onChangeText={(v) => setValue("callsign", v)}
                        onKeyPress={(e: any) => {
                            if (e.keyCode === 13) handleAdd();
                        }}
                        placeholder="Callsign"
                    />
                </View>
                {inputBarConfig.includes("name") && <FormField name="name" style={styles.input} placeholder="Name" />}
                {inputBarConfig.includes("qth") && <FormField name="qth" style={styles.input} placeholder="QTH" />}
                {inputBarConfig.includes("rst_received") && (
                    <View>
                        {contestMode && <FormField name="rst_received" style={styles.input} placeholder="RST rcvd" />}
                        {!contestMode && <Signal field="rst_received" />}
                    </View>
                )}
                {inputBarConfig.includes("rst_sent") && (
                    <View>
                        {contestMode && <FormField name="rst_sent" style={styles.input} placeholder="RST sent" />}
                        {!contestMode && <Signal field="rst_sent" />}
                    </View>
                )}
                <View>
                    <Button onPress={() => handleAdd()} startIcon="add" />
                </View>
            </Stack>
        </Stack>
    );
};
