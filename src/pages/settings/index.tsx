import { StackScreenProps } from "@react-navigation/stack";
import React from "react";
import { Switch } from "react-native";
import { NavigationParamList } from "../../Navigation";
import { useStore } from "../../store";
import { normalise } from "../../utils/locator";
import { PageLayout } from "../../utils/page-layout";
import { Stack } from "../../utils/stack";
import { Button } from "../../utils/theme/components/button";
import { Input } from "../../utils/theme/components/input";
import { Typography } from "../../utils/theme/components/typography";

export type SettingsProps = {} & StackScreenProps<NavigationParamList, "Settings">;

export type SettingsComponent = React.FC<SettingsProps>;

export const Settings: SettingsComponent = ({ navigation }): JSX.Element => {
    const settings = useStore((state) => state.settings);
    const currentLocation = useStore((state) => state.currentLocation);
    const updateSetting = useStore((state) => state.updateSetting);

    return (
        <PageLayout title="Settings" navigate={navigation.navigate}>
            <Stack>
                <Typography>My Callsign:</Typography>
                <Input
                    value={settings.myCallsign != undefined ? settings.myCallsign : ""}
                    onChangeText={(newCallsign) => updateSetting("myCallsign", newCallsign)}
                />
                <Typography>My Gridsquare:</Typography>
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
                <Typography>Show NCDXF/IARU Beacons:</Typography>
                <Switch
                    value={settings.showBeacons != undefined ? settings.showBeacons : false}
                    onValueChange={(v) => updateSetting("showBeacons", v)}
                />
                <Typography>Show Filters:</Typography>
                <Switch
                    value={settings.showFilters != undefined ? settings.showFilters : false}
                    onValueChange={(v) => updateSetting("showFilters", v)}
                />
                <Typography>Imperial distances:</Typography>
                <Switch
                    value={settings.imperial != undefined ? settings.imperial : false}
                    onValueChange={(v) => updateSetting("imperial", v)}
                />
                <Typography variant="h3">API's</Typography>
                <Typography variant="subtitle">
                    All data is stored locally in your browser and is never sent anywhere (except for hamqth or google
                    when using their api)
                </Typography>
                <Typography>HamQTH:</Typography>
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
                <Typography>Google Static Maps:</Typography>
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
                <Typography>Geocode Maps:</Typography>
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
