import React from "react";
import { View } from "react-native";
import { Mode, modes } from "../../data/modes";
import { Button } from "../../utils/theme/components/button";
import { useSettings } from "../../utils/use-settings";
import { ButtonOffset } from "../button-offset";
import { Stack } from "../stack";
import { FormField } from "./form-field";

export type ModeInputProps = {
    noLabel?: boolean;
};

export type ModeInputComponent = React.FC<ModeInputProps>;

export const ModeInput: ModeInputComponent = ({ noLabel = false }): JSX.Element => {
    const [showAllModes, setShowAllModes] = React.useState<boolean>(false);
    const settings = useSettings();

    const star = (
        <Button startIcon={showAllModes ? "star-outline" : "star"} onPress={() => setShowAllModes(!showAllModes)} />
    );
    return (
        <Stack direction="row">
            <View style={{ flexGrow: 1 }}>
                <FormField
                    role="select"
                    name="mode"
                    label={noLabel ? undefined : "Mode:"}
                    options={Object.fromEntries(
                        (!showAllModes && settings.favouriteModes.length ? settings.favouriteModes : modes).map(
                            (mode: Mode) => [mode, mode],
                        ),
                    )}
                />
            </View>
            {settings.favouriteModes.length > 0 && (noLabel ? star : <ButtonOffset>{star}</ButtonOffset>)}
        </Stack>
    );
};
