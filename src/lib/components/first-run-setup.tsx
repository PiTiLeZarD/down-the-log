import React from "react";
import { ScrollView } from "react-native";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Typography } from "../ui/typography";
import { normalise } from "../utils/locator";
import { Modal } from "../utils/modal";
import { Settings, useStore } from "../utils/store";
import { useSettings } from "../utils/use-settings";
import { DateFormatSetting, UnitsSetting } from "./choice-setting";
import { Stack } from "./stack";

// Only what the whole app needs and can't guess: who you are, where you are, and how you want
// numbers and dates written. Rig, antenna, QTH and country belong to a QSO, not to the operator —
// they change per outing, so they're filled in on the QSO itself and carried over from there.
export type FirstRunSetupProps = {
    open: boolean;
    onClose: () => void;
};

export const FirstRunSetup = ({ open, onClose }: FirstRunSetupProps) => {
    const settings = useSettings();
    const currentLocation = useStore((state) => state.currentLocation);
    const updateSetting = useStore((state) => state.updateSetting);
    // The identity fields aren't written to the settings until Save, so a half-filled form can be
    // abandoned. The unit and date pickers below are their own settings controls and save as you tap.
    const [draft, setDraft] = React.useState<Partial<Settings>>({});

    const value = (key: keyof Settings) => (draft[key] ?? settings[key] ?? "") as string;
    const set = (key: keyof Settings, v: string) => setDraft((d) => ({ ...d, [key]: v }));

    const callsign = value("myCallsign");
    const gridsquare = value("myGridsquare");

    const save = () => {
        if (!callsign) return;

        updateSetting("myCallsign", callsign.toUpperCase());
        updateSetting("myGridsquare", gridsquare ? normalise(gridsquare) : undefined);
        onClose();
    };

    return (
        <Modal wide open={open} onClose={onClose}>
            <ScrollView>
                <Stack gap="lg">
                    <Typography variant="h2">Welcome to Down the Log</Typography>
                    <Typography variant="subtitle">
                        Just the essentials to get going. All of this stays on this device, and you can change any of it
                        later in the settings.
                    </Typography>

                    <Typography underline>My callsign:</Typography>
                    <Input
                        value={callsign}
                        placeholder="Required"
                        transformValue={(v) => v.toUpperCase()}
                        onChangeText={(v) => set("myCallsign", v)}
                    />

                    <Typography underline>My gridsquare:</Typography>
                    <Typography variant="subtitle">
                        {currentLocation
                            ? `Leave this empty to keep following your location (currently ${currentLocation}), or set a fixed square.`
                            : "Leave this empty to follow your location, or set a fixed square."}
                    </Typography>
                    <Input
                        value={gridsquare}
                        placeholder={currentLocation || "e.g. IO91wm"}
                        onChangeText={(v) => set("myGridsquare", v)}
                    />

                    <UnitsSetting />
                    <DateFormatSetting />

                    <Typography variant="subtitle">
                        Your rig, antenna, QTH and country are set on the QSO itself, under My Station — every following
                        QSO then carries them over.
                    </Typography>

                    <Button
                        colour={callsign ? "success" : "grey"}
                        text="Save"
                        onPress={save}
                        aria-disabled={!callsign}
                    />
                    <Button variant="outlined" colour="grey" text="Later" onPress={onClose} />
                </Stack>
            </ScrollView>
        </Modal>
    );
};
