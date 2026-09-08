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

// What "while the app is open" costs, which is not the same sentence on a phone as in a tab.
const openLimit = native
    ? "A phone suspends an app it has put in the background, which stops the poll with it — so alerts arrive while down-the-log is on screen."
    : "";

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
                    Not available on this build. Alerts need a notifier: a browser that supports notifications, the
                    desktop app, or an iPhone or Android build made with the development client — the notification
                    module is native, so it is missing from Expo Go.
                </Typography>
            </Stack>
        );

    return (
        <Stack>
            <Typography underline>Spot alerts:</Typography>
            <Switch value={alert.enabled} onValueChange={(v) => void enable(v)} />
            {alert.enabled && permission !== "granted" && <Typography variant="em">{blockedText}</Typography>}
            <Typography variant="subtitle">
                Raises a notification when a spot the app has not seen before matches the rules below. Alerts come off
                the same one-minute poll as the Spots bar, so they only arrive while the app is open — nothing is pushed
                from a server, and closing it stops them. {openLimit} An empty row means no opinion: leave everything
                clear and every new spot is announced. A station that has said QRT is never announced, and a poll that
                matches more than a few spots at once collapses into a single &quot;N new spots&quot;.
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
                        placeholder="G4XYZ VK6MB — blank for any"
                        onChangeText={setWatchText}
                        onBlur={() => patch({ watch: parseWatch(watchText) })}
                    />
                    <Typography variant="subtitle">
                        Only these callsigns raise an alert. Matched on the base call, so a /P or a DL/ prefix still
                        counts. Separate them with spaces or commas.
                    </Typography>
                </Stack>
            )}
        </Stack>
    );
};
