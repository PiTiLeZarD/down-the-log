import React from "react";
import { Switch } from "react-native";
import { Band, bands as bandRanges, sortBands } from "../../data/bands";
import { EventType } from "../../utils/event-rules";
import {
    NotifyPermission,
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

export const SpotAlertSettings = () => {
    const settings = useSettings();
    const updateSetting = useStore((state) => state.updateSetting);
    const alert = settings.spotAlerts;
    const patch = (values: Partial<SpotAlert>) => updateSetting("spotAlerts", { ...alert, ...values });

    // Held separately from the setting so a half-typed callsign isn't parsed into the watchlist on
    // every keystroke — "G4A" would be a rule of its own for as long as it takes to finish typing.
    const [watchText, setWatchText] = React.useState(alert.watch.join(" "));
    // The browser's own answer, which changes underneath the app when the operator clears it in site
    // settings. Read once on mount and re-read after anything that could have moved it.
    const [permission, setPermission] = React.useState<NotifyPermission>(notificationPermission);

    const supported = notificationsSupported();

    const enable = async (on: boolean) => {
        if (!on) return patch({ enabled: false });
        // Asked for here rather than at startup: this switch is the user gesture Safari insists on,
        // and asking before the operator has said they want alerts is how permission gets denied
        // permanently by reflex.
        const granted = notificationPermission() === "granted" ? "granted" : await requestNotificationPermission();
        setPermission(granted);
        if (granted === "granted") return patch({ enabled: true });
        await showDialog({
            title: "Notifications blocked",
            icon: "warning",
            text:
                granted === "denied"
                    ? "This browser has notifications turned off for the app. Clear it in the browser's own site settings for down-the-log, then switch this back on."
                    : "The browser didn't grant permission. On iPhone and iPad, notifications only work once the app has been added to the Home Screen.",
        });
    };

    if (!supported)
        return (
            <Stack>
                <Typography underline>Spot alerts:</Typography>
                <Typography variant="subtitle">
                    Not available on this build. Alerts are raised by the browser, so they work on the web build and on
                    the installed PWA — on iPhone and iPad only once it has been added to the Home Screen. The desktop
                    and native app builds don&apos;t carry a notifier yet.
                </Typography>
            </Stack>
        );

    return (
        <Stack>
            <Typography underline>Spot alerts:</Typography>
            <Switch value={alert.enabled} onValueChange={(v) => void enable(v)} />
            {alert.enabled && permission !== "granted" && (
                <Typography variant="em">
                    The browser is no longer allowing notifications, so nothing will be shown. Clear it in the
                    browser&apos;s own site settings for this address.
                </Typography>
            )}
            <Typography variant="subtitle">
                Raises a notification when a spot the app has not seen before matches the rules below. Alerts come off
                the same one-minute poll as the Spots bar, so they only arrive while the app is open — nothing is
                pushed from a server, and closing the tab stops them. An empty row means no opinion: leave everything
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
                        selected={[...(alert.newOnly ? ["New refs"] : []), ...(alert.hideAutomatic ? ["Hide RBN"] : [])]}
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
