import React from "react";
import { Platform, Switch } from "react-native";
import { Band, bands as bandRanges, sortBands } from "../../data/bands";
import { EventType } from "../../utils/event-rules";
import {
    NotifyPermission,
    isTauri,
    notificationPermission,
    notificationsSupported,
    requestNotificationPermission,
} from "../../utils/notify";
import { SpotAlert, SpotModeGroup, spotModeGroups } from "../../utils/spots";
import { useStore } from "../../utils/store";
import { useSettings } from "../../utils/use-settings";
import { Input } from "../../ui/input";
import { showDialog } from "../../ui/dialog";
import { Typography } from "../../ui/typography";
import { Stack } from "../stack";
import { FilterRow, toggle } from "./spot-filters";
import { programmeColours } from "./spot-row";

const programmeLabels: Partial<Record<EventType, string>> = {
    pota: "POTA",
    wwff: "WWFF",
    sota: "SOTA",
    sig: "Other",
};

// Every band rather than the ones currently spotted: the point of an alert is the band nothing is
// on right now, and a chip row that changes shape with the feed can't be set once and left alone.
const allBands = (Object.keys(bandRanges) as Band[]).sort(sortBands);

// Free text, because the operator is typing calls they heard about rather than picking from a list.
// Commas, spaces and newlines all separate — nobody should have to guess which.
const parseWatch = (text: string): string[] =>
    text
        .toUpperCase()
        .split(/[\s,;]+/)
        .filter(Boolean);

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
    const alert = settings.spotAlerts;
    const patch = (values: Partial<SpotAlert>) => updateSetting("spotAlerts", { ...alert, ...values });

    // Held separately from the setting so a half-typed callsign isn't parsed into the watchlist on
    // every keystroke — "G4A" would be a rule of its own for as long as it takes to finish typing.
    const [watchText, setWatchText] = React.useState(alert.watch.join(" "));
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
        if (!on) return patch({ enabled: false });
        // Asked for here rather than at startup: this switch is the user gesture Safari insists on,
        // and asking before the operator has said they want alerts is how permission gets denied
        // permanently by reflex.
        const granted =
            (await notificationPermission()) === "granted" ? "granted" : await requestNotificationPermission();
        setPermission(granted);
        if (granted === "granted") return patch({ enabled: true });
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
            <Switch value={alert.enabled} onValueChange={(v) => void enable(v)} />
            {alert.enabled && permission !== "granted" && <Typography variant="em">{blockedText}</Typography>}
            <Typography variant="subtitle">
                Notifies on new spots matching the rules below, while the app is open. {openLimit} Empty rows match
                everything.
            </Typography>
            {alert.enabled && (
                <Stack gap="lg">
                    <FilterRow<EventType>
                        label="Award"
                        options={Object.keys(programmeLabels) as EventType[]}
                        selected={alert.programmes}
                        labelFor={(programme) => programmeLabels[programme] as string}
                        colourFor={(programme) => programmeColours[programme]}
                        onToggle={(programme) => patch({ programmes: toggle(alert.programmes, programme) })}
                    />
                    <FilterRow<Band>
                        label="Band"
                        options={allBands}
                        selected={alert.bands}
                        onToggle={(band) => patch({ bands: toggle(alert.bands, band) })}
                    />
                    <FilterRow<SpotModeGroup>
                        label="Mode"
                        options={[...spotModeGroups]}
                        selected={alert.modeGroups}
                        onToggle={(group) => patch({ modeGroups: toggle(alert.modeGroups, group) })}
                    />
                    <FilterRow<string>
                        label="Only"
                        options={["New refs", "Hide RBN"]}
                        selected={[
                            ...(alert.newOnly ? ["New refs"] : []),
                            ...(alert.hideAutomatic ? ["Hide RBN"] : []),
                        ]}
                        onToggle={(option) =>
                            patch(
                                option === "New refs"
                                    ? { newOnly: !alert.newOnly }
                                    : { hideAutomatic: !alert.hideAutomatic },
                            )
                        }
                    />
                    <Typography variant="em">Callsigns</Typography>
                    <Input
                        value={watchText}
                        placeholder="VK* ZL* G4XYZ — blank for any"
                        onChangeText={setWatchText}
                        onBlur={() => patch({ watch: parseWatch(watchText) })}
                    />
                    <Typography variant="subtitle">
                        Spaces or commas between calls. * matches anything, so VK* is every VK station.
                    </Typography>
                </Stack>
            )}
        </Stack>
    );
};
