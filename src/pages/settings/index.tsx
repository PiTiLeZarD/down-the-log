import { DrawerScreenProps } from "@react-navigation/drawer";
import React from "react";
import { Switch } from "react-native";
import { NavigationParamList } from "../../Navigation";
import { useStore } from "../../store";
import { PageLayout } from "../../utils/page-layout";
import { Stack } from "../../utils/stack";
import { Input } from "../../utils/theme/components/input";
import { Typography } from "../../utils/theme/components/typography";

export type SettingsProps = {} & DrawerScreenProps<NavigationParamList, "Settings">;

export type SettingsComponent = React.FC<SettingsProps>;

export const Settings: SettingsComponent = ({ navigation }): JSX.Element => {
    const settings = useStore((state) => state.settings);
    const updateSetting = useStore((state) => state.updateSetting);

    return (
        <PageLayout title="Settings" navigation={navigation}>
            <Stack>
                <Typography>My Callsign:</Typography>
                <Input
                    value={settings.myCallsign != undefined ? settings.myCallsign : ""}
                    onChangeText={(newCallsign) => updateSetting("myCallsign", newCallsign)}
                />
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
                <Typography>HamQTH:</Typography>
                <Typography variant="subtitle">
                    All data is stored locally in your browser and is never sent anywhere (except for hamqth of course)
                </Typography>
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
            </Stack>
        </PageLayout>
    );
};
