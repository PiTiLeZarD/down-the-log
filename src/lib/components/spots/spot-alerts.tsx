import React from "react";
import { Platform, Switch } from "react-native";
import {
    NotifyPermission,
    isTauri,
    notificationPermission,
    notificationsSupported,
    requestNotificationPermission,
} from "../../utils/notify";
import { useStore } from "../../utils/store";
import { useSettings } from "../../utils/use-settings";
import { showDialog } from "../../ui/dialog";
import { Typography } from "../../ui/typography";
import { Stack } from "../stack";

// The three notifiers fail in three different places, and "clear it in the browser's site settings"
// is useless advice on a phone. Where the operator has to go to undo a refusal is the one thing this
// screen has to get platform-specific.
const native = Platform.OS === "ios" || Platform.OS === "android";

const blockedText = native
    ? "Notifications for down-the-log are turned off in the system settings. Turn them back on there, then switch this back on."
    : isTauri()
      ? "The system has notifications turned off for down-the-log. Turn them back on in the operating system's own notification settings, then switch this back on."
      : "This browser has notifications turned off for the app. Clear it in the browser's own site settings for down-the-log, then switch this back on.";

const refusedText = native
    ? "Permission wasn't granted, so nothing will be shown."
    : "The browser didn't grant permission. On iPhone and iPad, notifications only work once the app has been added to the Home Screen.";

// A phone suspends a backgrounded app, and the poll with it.
const openLimit = native ? "On a phone, only while it's on screen." : "";

export const SpotAlertSettings = () => {
    const settings = useSettings();
    const updateSetting = useStore((state) => state.updateSetting);
    const enabled = settings.spotAlertsEnabled;
    // The platform's own answer, which changes underneath the app when the operator clears it in
    // site or system settings. Asked on mount and re-read after anything that could have moved it —
    // asked rather than read, because both the Tauri plugin and expo-notifications answer over a
    // bridge. Assumed granted until it says otherwise, so the row doesn't flash a warning on mount.
    const [permission, setPermission] = React.useState<NotifyPermission>("granted");
    React.useEffect(() => {
        let cancelled = false;
        void notificationPermission().then((answer) => {
            if (!cancelled) setPermission(answer);
        });
        return () => {
            cancelled = true;
        };
    }, []);

    const supported = notificationsSupported();

    const enable = async (on: boolean) => {
        if (!on) return updateSetting("spotAlertsEnabled", false);
        // Asked for here rather than at startup: this switch is the user gesture Safari insists on,
        // and asking before the operator has said they want alerts is how permission gets denied
        // permanently by reflex.
        const granted =
            (await notificationPermission()) === "granted" ? "granted" : await requestNotificationPermission();
        setPermission(granted);
        if (granted === "granted") return updateSetting("spotAlertsEnabled", true);
        await showDialog({
            title: "Notifications blocked",
            icon: "warning",
            text: granted === "denied" ? blockedText : refusedText,
        });
    };

    if (!supported)
        return (
            <Stack>
                <Typography underline>Spot alerts:</Typography>
                <Typography variant="subtitle">
                    Not available on this build (no notification support — Expo Go lacks the native module).
                </Typography>
            </Stack>
        );

    return (
        <Stack>
            <Typography underline>Spot alerts:</Typography>
            <Switch value={enabled} onValueChange={(v) => void enable(v)} />
            {enabled && permission !== "granted" && <Typography variant="em">{blockedText}</Typography>}
            <Typography variant="subtitle">
                Notifies on new spots that pass the filter above, while the app is open. {openLimit} Stations that have
                gone QRT never alert.
            </Typography>
        </Stack>
    );
};
