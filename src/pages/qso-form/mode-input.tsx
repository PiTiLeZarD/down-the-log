import React from "react";
import { View } from "react-native";
import { Mode, modes } from "../../data/modes";
import { FormField } from "../../utils/form-field";
import { Stack } from "../../utils/stack";
import { Button } from "../../utils/theme/components/button";
import { useSettings } from "../../utils/use-settings";
import { ButtonOffset } from "./button-offset";

export type ModeInputProps = {};

export type ModeInputComponent = React.FC<ModeInputProps>;

export const ModeInput: ModeInputComponent = (): JSX.Element => {
    const [showAllModes, setShowAllModes] = React.useState<boolean>(false);
    const settings = useSettings();

    return (
        <Stack direction="row">
            <View style={{ flexGrow: 1 }}>
                <FormField
                    role="select"
                    name="mode"
                    label="Mode:"
                    options={Object.fromEntries(
                        (!showAllModes && settings.favouriteModes.length ? settings.favouriteModes : modes).map(
                            (mode: Mode) => [mode, mode],
                        ),
                    )}
                />
            </View>
            <ButtonOffset>
                <Button
                    startIcon={showAllModes ? "star-outline" : "star"}
                    onPress={() => setShowAllModes(!showAllModes)}
                />
            </ButtonOffset>
        </Stack>
    );
};
