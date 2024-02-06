import { useRouter } from "expo-router";
import React from "react";
import { PageLayout } from "./lib/components/page-layout";
import { Stack } from "./lib/components/stack";
import { Button } from "./lib/utils/theme/components/button";

export type MenuProps = {};

export type MenuComponent = React.FC<MenuProps>;

const Menu: MenuComponent = (): JSX.Element => {
    const { navigate } = useRouter();
    return (
        <PageLayout title="Menu">
            <Stack gap="xxl">
                <Button startIcon="home" text="Home" onPress={() => navigate("/")} />
                <Button startIcon="earth" text="Events" onPress={() => navigate("/events")} />
                <Button startIcon="albums" text="QSLs" onPress={() => navigate("/qsl")} />
                <Button startIcon="stats-chart" text="Stats" onPress={() => navigate("/stats")} />
                <Button startIcon="settings" text="Settings" onPress={() => navigate("/settings")} />
                <Button startIcon="archive" text="Import/Export" onPress={() => navigate("/adif")} />
                <Button startIcon="information-circle" text="About" onPress={() => navigate("/about")} />
            </Stack>
        </PageLayout>
    );
};

export default Menu;
