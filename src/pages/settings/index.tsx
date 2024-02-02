import { StackScreenProps } from "@react-navigation/stack";
import React from "react";
import { Switch } from "react-native";
import Swal from "sweetalert2";
import { NavigationParamList } from "../../Navigation";
import { bands } from "../../data/bands";
import { modes } from "../../data/modes";
import { useStore } from "../../store";
import { HamQTHSettingsType } from "../../utils/hamqth";
import { normalise } from "../../utils/locator";
import { PageLayout } from "../../utils/page-layout";
import { Stack } from "../../utils/stack";
import { Button } from "../../utils/theme/components/button";
import { Input } from "../../utils/theme/components/input";
import { Typography } from "../../utils/theme/components/typography";
import { SwalTheme } from "../../utils/theme/theme";
import { useSettings } from "../../utils/use-settings";
import { PickFavourite } from "./pick-favourite";

export type SettingsProps = {} & StackScreenProps<NavigationParamList, "Settings">;

export type SettingsComponent = React.FC<SettingsProps>;

export const Settings: SettingsComponent = (): JSX.Element => {
    const settings = useSettings();
    const currentLocation = useStore((state) => state.currentLocation);
    const updateSetting = useStore((state) => state.updateSetting);
    const updateFilters = useStore((state) => state.updateFilters);

    return (
        <PageLayout title="Settings">
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
                <Typography underline>Imperial distances:</Typography>
                <Switch
                    value={settings.imperial != undefined ? settings.imperial : false}
                    onValueChange={(v) => updateSetting("imperial", v)}
                />
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
                <Typography variant="h3">API's</Typography>
                <Typography variant="subtitle">
                    All data is stored locally in your browser and is never sent anywhere (except for hamqth or google
                    when using their api)
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
                            Swal.fire({
                                ...SwalTheme,
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
                            updateSetting("hamqth", { ...(settings.hamqth || { user: "", password: "" }), password: v })
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
        </PageLayout>
    );
};
