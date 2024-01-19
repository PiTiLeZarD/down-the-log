import { StackScreenProps } from "@react-navigation/stack";
import React from "react";
import { NavigationParamList } from "../../Navigation";
import { PageLayout } from "../../utils/page-layout";
import { Stack } from "../../utils/stack";
import { Button } from "../../utils/theme/components/button";

export type MenuProps = {} & StackScreenProps<NavigationParamList, "Menu">;

export type MenuComponent = React.FC<MenuProps>;

export const Menu: MenuComponent = ({ navigation }): JSX.Element => {
    return (
        <PageLayout title="Menu" navigate={navigation.navigate}>
            <Stack gap="xxl">
                <Button startIcon="home" text="Home" onPress={() => navigation.navigate("Home")} />
                <Button startIcon="stats-chart" text="Stats" onPress={() => navigation.navigate("Stats")} />
                <Button startIcon="settings" text="Settings" onPress={() => navigation.navigate("Settings")} />
                <Button startIcon="archive" text="Import/Export" onPress={() => navigation.navigate("Adif")} />
                <Button startIcon="information-circle" text="About" onPress={() => navigation.navigate("About")} />
            </Stack>
        </PageLayout>
    );
};
