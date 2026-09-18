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
                A strip of current activations above the log, refreshed every minute. It reads pota.app and
                parksnpeaks.org, merges the activations both of them carry into one entry, and opens this page when
                tapped. pota.app is called directly; ParksnPeaks doesn&apos;t allow browsers to call it, so on the web
                and desktop builds that half goes through cors.jadami.com.
                SOTAwatch isn&apos;t included yet: their API terms require the app to be approved before it may connect.
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
