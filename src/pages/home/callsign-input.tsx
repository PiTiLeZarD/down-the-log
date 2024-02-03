import React, { useEffect } from "react";
import { useFormContext } from "react-hook-form";
import { View } from "react-native";
import { createStyleSheet, useStyles } from "react-native-unistyles";
import { FormField } from "../../utils/form-field";
import { useHamqth } from "../../utils/hamqth";
import { QSO } from "../../utils/qso";
import { Stack } from "../../utils/stack";
import { Button } from "../../utils/theme/components/button";
import { Input } from "../../utils/theme/components/input";
import { useSettings } from "../../utils/use-settings";
import { BandFreqInput } from "../qso-form/band-freq-input";
import { Events } from "../qso-form/events";
import { ModeInput } from "../qso-form/mode-input";
import { Signal } from "../qso-form/signal";
import { CallsignInputExtra } from "./callsign-input-extra";

const stylesheet = createStyleSheet((theme) => ({
    inputBox: {
        backgroundColor: theme.colours.primary[theme.shades.light],
        borderTopColor: theme.colours.primary[theme.shades.darker],
        borderTopWidth: theme.margins.sm,
        borderTopStyle: "solid",
        padding: theme.margins.md,
    },
    input: {
        backgroundColor: "white",
    },
}));

export type CallsignInputProps = {
    handleAdd: () => void;
};

export type CallsignInputComponent = React.FC<CallsignInputProps>;

export const CallsignInput: CallsignInputComponent = ({ handleAdd }): JSX.Element => {
    const [inputValue, setInputValue] = React.useState<string>("");
    const { styles } = useStyles(stylesheet);
    const { watch, setValue } = useFormContext<QSO>();
    const { inputBarConfig, contestMode } = useSettings();
    const callsign = watch("callsign");
    const hamqthCSData = useHamqth(callsign);

    useEffect(() => {
        if (inputValue != callsign) setValue("callsign", inputValue);
    }, [inputValue]);

    useEffect(() => {
        setInputValue("");
    }, [watch("id")]);

    useEffect(() => {
        if (hamqthCSData) {
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
                        value={inputValue}
                        style={styles.input}
                        onChangeText={(text: string) => setInputValue(text.toUpperCase())}
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
