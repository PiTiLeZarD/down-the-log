import { useRouter } from "expo-router";
import { Switch, View } from "react-native";
import { Button } from "../../ui/button";
import { Typography } from "../../ui/typography";
import { useStore } from "../../utils/store";
import { useSettings } from "../../utils/use-settings";
import { Stack } from "../stack";
import { SpotAlertSettings } from "./spot-alerts";

// The spots bar and alerts are set here rather than on the Settings screen: the operator is looking at
// the feed when they decide the bar is in the way or that an alert should have fired. The ParksnPeaks
// account is a credential like HamQTH and LoTW, so it lives with them under Settings > APIs.
export const SpotSettings = () => {
    const { navigate } = useRouter();
    const settings = useSettings();
    const updateSetting = useStore((state) => state.updateSetting);

    return (
        <Stack gap="lg">
            <Typography underline>Show Spots bar:</Typography>
            <Switch
                value={settings.showSpots != undefined ? settings.showSpots : false}
                onValueChange={(v) => updateSetting("showSpots", v)}
            />
            <Typography variant="subtitle">
                Current POTA and ParksnPeaks activations above the log, refreshed every minute. SOTA is waiting on API
                approval.
            </Typography>
            <SpotAlertSettings />
            <Typography underline>ParksnPeaks account:</Typography>
            <Typography variant="subtitle">
                Only needed to spot yourself, and now set with the other accounts under Settings &gt; APIs.
                {settings.pnpUserId && settings.pnpApiKey ? " Currently set up." : " Not set up yet."}
            </Typography>
            <View>
                <Button
                    text="Open Settings > APIs"
                    variant="outlined"
                    onPress={() => navigate("/settings?tab=apis")}
                />
            </View>
        </Stack>
    );
};
