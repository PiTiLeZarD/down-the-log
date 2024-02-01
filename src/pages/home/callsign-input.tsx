import React from "react";
import { View } from "react-native";
import { createStyleSheet, useStyles } from "react-native-unistyles";
import { HamQTHCallsignData, useHamqth } from "../../utils/hamqth";
import { Stack } from "../../utils/stack";
import { Button } from "../../utils/theme/components/button";
import { Input } from "../../utils/theme/components/input";
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
    value: string;
    onChange: (callsign: string) => void;
};

export type CallsignInputComponent = React.FC<CallsignInputProps>;

export const CallsignInput: CallsignInputComponent = ({ value, handleAdd, onChange }): JSX.Element => {
    const { styles } = useStyles(stylesheet);
    const hamqthCSData = useHamqth(value);

    return (
        <Stack style={styles.inputBox}>
            <CallsignInputExtra value={value} hamqthCSData={hamqthCSData} />
            <Stack direction="row" gap="xxl">
                <View style={{ flexGrow: 1 }}>
                    <Input
                        style={styles.input}
                        onChangeText={(text: string) => onChange(text.toUpperCase())}
                        onKeyPress={(e) => {
                            if ((e as any).keyCode === 13) handleAdd(hamqthCSData);
                        }}
                        value={value}
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
