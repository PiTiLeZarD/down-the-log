import React from "react";
import { useFormContext } from "react-hook-form";
import { View } from "react-native";
import { createStyleSheet, useStyles } from "react-native-unistyles";
import { FormField } from "../../utils/form-field";
import { HamQTHCallsignData, useHamqth } from "../../utils/hamqth";
import { QSO } from "../../utils/qso";
import { Stack } from "../../utils/stack";
import { Button } from "../../utils/theme/components/button";
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
    handleAdd: (hamqthCSData?: HamQTHCallsignData) => void;
};

export type CallsignInputComponent = React.FC<CallsignInputProps>;

export const CallsignInput: CallsignInputComponent = ({ handleAdd }): JSX.Element => {
    const { styles } = useStyles(stylesheet);
    const { watch, setValue } = useFormContext<QSO>();
    const callsign = watch("callsign");
    const hamqthCSData = useHamqth(callsign);

    return (
        <Stack style={styles.inputBox}>
            <CallsignInputExtra value={callsign} hamqthCSData={hamqthCSData} />
            <Stack direction="row" gap="xxl">
                <View style={{ flexGrow: 1 }}>
                    <FormField
                        name="callsign"
                        style={styles.input}
                        onChangeText={(text: string) => setValue("callsign", text.toUpperCase())}
                        onKeyPress={(e: any) => {
                            if (e.keyCode === 13) handleAdd(hamqthCSData);
                        }}
                        placeholder="Callsign"
                    />
                </View>
                <View>
                    <Button onPress={() => handleAdd(hamqthCSData)} startIcon="add" />
                </View>
            </Stack>
        </Stack>
    );
};
