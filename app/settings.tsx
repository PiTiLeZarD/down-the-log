import React from "react";
import { Switch } from "react-native";
import { UnistylesRuntime, useStyles } from "react-native-unistyles";
import { PageLayout } from "./lib/components/page-layout";
import { PickFavourite } from "./lib/components/pick-favourite";
import { Stack } from "./lib/components/stack";
import { TabsLayout } from "./lib/components/tabs-layout";
import { bands } from "./lib/data/bands";
import { modes } from "./lib/data/modes";
import { HamQTHSettingsType } from "./lib/utils/hamqth";
import { normalise } from "./lib/utils/locator";
import { useStore } from "./lib/utils/store";
import { Button } from "./lib/utils/theme/components/button";
import { Input } from "./lib/utils/theme/components/input";
import { Typography } from "./lib/utils/theme/components/typography";
import { fireSwal } from "./lib/utils/theme/swal";
import { useSettings } from "./lib/utils/use-settings";

export type SettingsProps = {};

export type SettingsComponent = React.FC<SettingsProps>;

const Settings: SettingsComponent = (): JSX.Element => {
    const { theme } = useStyles();
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
                </Stack>
                <Stack>
                    <Typography>Theme</Typography>
                    <Stack direction="row">
                        <Switch
                            value={UnistylesRuntime.themeName === "dark"}
                            onValueChange={(v) => {
                                UnistylesRuntime.setTheme(v ? "dark" : "light");
                            }}
                        />
                        <Typography>{UnistylesRuntime.themeName}</Typography>
                    </Stack>
                    <Typography underline>Show NCDXF/IARU Beacons:</Typography>
                    <Switch
                        value={settings.showBeacons != undefined ? settings.showBeacons : false}
                        onValueChange={(v) => updateSetting("showBeacons", v)}
                    />
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
                    <Typography underline>Imperial distances (miles):</Typography>
                    <Switch
                        value={settings.imperial != undefined ? settings.imperial : false}
                        onValueChange={(v) => updateSetting("imperial", v)}
                    />
                    <Typography underline>Date format ({settings.datemonth ? "MM-dd-yyyy" : "dd/MM/yyyy"}):</Typography>
                    <Switch
                        value={settings.datemonth != undefined ? settings.datemonth : false}
                        onValueChange={(v) => updateSetting("datemonth", v)}
                    />
                    <Typography underline>Contest Mode:</Typography>
                    <Switch
                        value={settings.contestMode != undefined ? settings.contestMode : false}
                        onValueChange={(v) => updateSetting("contestMode", v)}
                    />
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
                        google when using their api)
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
                                fireSwal({
                                    theme,
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
                    <Typography underline>Google Static Maps:</Typography>
                    <Stack direction="row">
                        <Typography>Key:</Typography>
                        <Input
                            value={settings.google != undefined ? settings.google.key : ""}
                            onChangeText={(v) =>
                                updateSetting("google", { ...(settings.google || { key: "", secret: "" }), key: v })
                            }
                        />
                        <Typography>Signing Secret:</Typography>
                        <Input
                            password
                            value={settings.google != undefined ? settings.google.secret : ""}
                            onChangeText={(v) =>
                                updateSetting("google", { ...(settings.google || { key: "", secret: "" }), secret: v })
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
                </Stack>
            </TabsLayout>
        </PageLayout>
    );
};

export default Settings;
