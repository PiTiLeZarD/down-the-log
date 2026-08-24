import { Switch } from "react-native";
import { UnistylesRuntime, useUnistyles } from "react-native-unistyles";
import { DateFormatSetting, UnitsSetting } from "../lib/components/choice-setting";
import { PageLayout } from "../lib/components/page-layout";
import { PickFavourite } from "../lib/components/pick-favourite";
import { Stack } from "../lib/components/stack";
import { StorageUsage } from "../lib/components/storage-usage";
import { TabsLayout } from "../lib/components/tabs-layout";
import { TotaRegistrationSetting } from "../lib/components/tota-registration";
import { bands } from "../lib/data/bands";
import { modes } from "../lib/data/modes";
import { Button } from "../lib/ui/button";
import { Input } from "../lib/ui/input";
import { showDialog } from "../lib/ui/dialog";
import { Typography } from "../lib/ui/typography";
import { HamQTHSettingsType } from "../lib/utils/hamqth";
import { normalise } from "../lib/utils/locator";
import { useStore } from "../lib/utils/store";
import { useSettings } from "../lib/utils/use-settings";

const Settings = () => {
    const { rt } = useUnistyles();
    const settings = useSettings();
    const currentLocation = useStore((state) => state.currentLocation);
    const updateSetting = useStore((state) => state.updateSetting);
    const updateFilters = useStore((state) => state.updateFilters);

    return (
        <PageLayout title="Settings">
            <TabsLayout tabs={["My Details", "Interface", "Customisation", "APIs"]}>
                <Stack>
                    <Typography underline>My Callsign:</Typography>
                    <Input
                        value={settings.myCallsign != undefined ? settings.myCallsign : ""}
                        onChangeText={(newCallsign) => updateSetting("myCallsign", newCallsign.toUpperCase())}
                    />
                    <Typography underline>My Gridsquare:</Typography>
                    <Stack direction="row" gap="xxl">
                        <Typography>Currently:</Typography>
                        {settings.myGridsquare && <Typography variant="em">Static:</Typography>}
                        {!settings.myGridsquare && <Typography variant="em">Dynamic</Typography>}
                        <Input
                            value={settings.myGridsquare != undefined ? settings.myGridsquare : ""}
                            onChangeText={(newCallsign) =>
                                updateSetting("myGridsquare", newCallsign === "" ? undefined : normalise(newCallsign))
                            }
                        />
                        {!settings.myGridsquare && currentLocation && (
                            <Button
                                text={`Set ${currentLocation} as static`}
                                onPress={() => updateSetting("myGridsquare", currentLocation)}
                            />
                        )}
                    </Stack>
                    {/* Rig, antenna, QTH and country deliberately aren't here: an operator has more than
                        one of each and they change per outing, so they're set on the QSO under My Station
                        and carried over from there. */}
                    <Typography variant="subtitle">
                        Your rig, antenna, QTH and country are set per QSO, under My Station on the QSO form — each new
                        QSO carries over what the last one used.
                    </Typography>
                    <TotaRegistrationSetting />
                    <StorageUsage />
                </Stack>
                <Stack>
                    <Typography>Theme</Typography>
                    <Stack direction="row">
                        <Switch
                            value={rt.themeName === "dark"}
                            onValueChange={(v) => {
                                if (rt.hasAdaptiveThemes) UnistylesRuntime.setAdaptiveThemes(false);
                                UnistylesRuntime.setTheme(v ? "dark" : "light");
                            }}
                        />
                        <Typography>{rt.themeName}</Typography>
                    </Stack>
                    <Typography underline>Show NCDXF/IARU Beacons:</Typography>
                    <Switch
                        value={settings.showBeacons != undefined ? settings.showBeacons : false}
                        onValueChange={(v) => updateSetting("showBeacons", v)}
                    />
                    <Typography underline>Show QSO Heatmap:</Typography>
                    <Switch
                        value={settings.showHeatmap != undefined ? settings.showHeatmap : false}
                        onValueChange={(v) => updateSetting("showHeatmap", v)}
                    />
                    <Typography underline>Show ParksnPeaks Spots:</Typography>
                    <Switch
                        value={settings.showSpots != undefined ? settings.showSpots : false}
                        onValueChange={(v) => updateSetting("showSpots", v)}
                    />
                    <Typography variant="subtitle">
                        Latest SOTA/WWFF/POTA spots from parksnpeaks.org, refreshed every minute. On the web build the
                        request goes through a public relay, as ParksnPeaks doesn't allow browsers to call it directly —
                        see Spots relay under APIs if you'd rather use your own.
                    </Typography>
                    <Typography underline>Show Filters:</Typography>
                    <Switch
                        value={settings.showFilters != undefined ? settings.showFilters : false}
                        onValueChange={(v) => {
                            updateSetting("showFilters", v);
                            if (!v) updateFilters([]);
                        }}
                    />
                    <Typography underline>Ragchew max time:</Typography>
                    <Input
                        value={String(settings.timeoffThreshold)}
                        onChangeText={(nv) => updateSetting("timeoffThreshold", +nv)}
                    />
                    <Typography variant="subtitle">
                        This is the amount of time the QSO timer will be available, you can still set timeOff date
                        manually after that.
                    </Typography>
                    <UnitsSetting />
                    <DateFormatSetting />
                    {/* Contest mode used to be a switch here. It's a session template now — start one
                        from the bar above the input box on the log screen. */}
                </Stack>
                <Stack>
                    <Typography underline>Favourite Bands:</Typography>
                    <PickFavourite
                        settingsKey="favouriteBands"
                        label="Pick your favourite bands"
                        availableValues={Object.keys(bands)}
                    />
                    <Typography underline>Favourite Mode:</Typography>
                    <PickFavourite
                        settingsKey="favouriteModes"
                        label="Pick your favourite modes"
                        availableValues={Array.from(modes)}
                    />
                    <Typography underline>Customise Inputbar Fields:</Typography>
                    <PickFavourite
                        settingsKey="inputBarConfig"
                        label="Pick your input fields"
                        availableValues={["sig", "mode", "frequency", "name", "qth", "rst_received", "rst_sent"]}
                    />
                    <Typography underline>Fields to carry over a new QSO:</Typography>
                    <PickFavourite
                        settingsKey="carryOver"
                        label="Pick your fields"
                        availableValues={[
                            "frequency",
                            "band",
                            "mode",
                            "power",
                            "myQth",
                            "myLocator",
                            "myCallsign",
                            "myPota",
                            "myWwff",
                            "mySota",
                            "myIota",
                            "mySig",
                            "mySigInfo",
                            "myRig",
                            "myAntenna",
                            "myState",
                            "myCountry",
                        ]}
                    />
                </Stack>
                <Stack>
                    <Typography variant="h3">API's</Typography>
                    <Typography variant="subtitle">
                        All data is stored locally in your browser and is never sent anywhere (except for hamqth or
                        geocode maps when using their api)
                    </Typography>
                    <Typography underline>HamQTH:</Typography>
                    {settings.hamqth && settings.hamqth.sessionId && (
                        <Button
                            text="Refresh HamQTH Session"
                            variant="outlined"
                            onPress={() => {
                                updateSetting("hamqth", {
                                    ...settings.hamqth,
                                    sessionId: undefined,
                                    sessionStart: undefined,
                                } as HamQTHSettingsType);
                                showDialog({
                                    title: "HamQTH",
                                    text: "Session refreshed, a new one will be requested on next refresh",
                                    icon: "info",
                                    confirmButtonText: "Ok",
                                });
                            }}
                        />
                    )}
                    <Stack direction="row">
                        <Typography>User:</Typography>
                        <Input
                            value={settings.hamqth != undefined ? settings.hamqth.user : ""}
                            onChangeText={(v) =>
                                updateSetting("hamqth", { ...(settings.hamqth || { user: "", password: "" }), user: v })
                            }
                        />
                        <Typography>Password:</Typography>
                        <Input
                            password
                            value={settings.hamqth != undefined ? settings.hamqth.password : ""}
                            onChangeText={(v) =>
                                updateSetting("hamqth", {
                                    ...(settings.hamqth || { user: "", password: "" }),
                                    password: v,
                                })
                            }
                        />
                    </Stack>
                    <Typography underline>Geocode Maps:</Typography>
                    <Typography variant="subtitle">
                        Get an api key on https://geocode.maps.co/ to add a button on the form that will allow you to
                        convert anything you write in QTH to a gridsquare
                    </Typography>
                    <Stack direction="row">
                        <Typography>Key:</Typography>
                        <Input
                            value={settings.geocodeMapsCoKey || ""}
                            onChangeText={(v) => updateSetting("geocodeMapsCoKey", v)}
                        />
                    </Stack>
                    <Typography underline>Spots relay:</Typography>
                    <Typography variant="subtitle">
                        ParksnPeaks blocks browsers from calling it, so on the web the spots go through a relay. Leave
                        this empty to use the public ones, which are unreliable, or deploy scripts/cors-worker.js to
                        Cloudflare and paste its URL here — use {"{url}"} where the spot URL should go. Native builds
                        ignore this and call ParksnPeaks directly.
                    </Typography>
                    <Stack direction="row">
                        <Typography>URL:</Typography>
                        <Input
                            value={settings.spotsProxy || ""}
                            onChangeText={(v) => updateSetting("spotsProxy", v === "" ? undefined : v)}
                        />
                    </Stack>
                </Stack>
            </TabsLayout>
        </PageLayout>
    );
};

export default Settings;
