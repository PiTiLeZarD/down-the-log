import { Switch } from "react-native";
import { Input } from "../../ui/input";
import { Typography } from "../../ui/typography";
import { useStore } from "../../utils/store";
import { useSettings } from "../../utils/use-settings";
import { Stack } from "../stack";
import { SpotAlertSettings } from "./spot-alerts";

// Everything about spots is set here rather than on the Settings screen: the operator is looking at
// the feed when they decide the bar is in the way, that an alert should have fired, or that their
// own spots aren't getting through, and every one of those was two screens away from the answer.
export const SpotSettings = () => {
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
                build that half goes through a relay — see Spots relay below if you&apos;d rather use your own.
                SOTAwatch isn&apos;t included yet: their API terms require the app to be approved before it may connect.
            </Typography>
            <SpotAlertSettings />
            <Typography underline>ParksnPeaks account:</Typography>
            <Typography variant="subtitle">
                Only needed to spot yourself. Your user name and the API key from the User Options page on
                parksnpeaks.org. The key is kept in the device keychain on iOS and Android. Spotting yourself to POTA
                needs no account.
            </Typography>
            <Stack direction="row">
                <Typography>User:</Typography>
                <Input
                    value={settings.pnpUserId || ""}
                    onChangeText={(v) => updateSetting("pnpUserId", v === "" ? undefined : v)}
                />
            </Stack>
            <Stack direction="row">
                <Typography>API key:</Typography>
                <Input
                    password
                    value={settings.pnpApiKey || ""}
                    onChangeText={(v) => updateSetting("pnpApiKey", v === "" ? undefined : v)}
                />
            </Stack>
            <Typography underline>Spots relay:</Typography>
            <Typography variant="subtitle">
                ParksnPeaks blocks browsers from calling it, so on the web the spots go through a relay. Leave this
                empty to use the public ones, which are unreliable, or deploy scripts/cors-worker.js to Cloudflare and
                paste its URL here — use {"{url}"} where the spot URL should go. Native builds ignore this and call
                ParksnPeaks directly. Posting your own spots to ParksnPeaks from the web needs your own relay: the
                public ones only forward reads.
            </Typography>
            <Stack direction="row">
                <Typography>URL:</Typography>
                <Input
                    value={settings.spotsProxy || ""}
                    onChangeText={(v) => updateSetting("spotsProxy", v === "" ? undefined : v)}
                />
            </Stack>
        </Stack>
    );
};
