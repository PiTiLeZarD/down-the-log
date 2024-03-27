import { useRouter } from "expo-router";
import React from "react";
import { createStyleSheet, useStyles } from "react-native-unistyles";
import { Grid } from "./lib/components/grid";
import { PageLayout } from "./lib/components/page-layout";
import { Stack } from "./lib/components/stack";
import { Button } from "./lib/utils/theme/components/button";
import { Icon, IconName } from "./lib/utils/theme/components/icon";
import { Typography } from "./lib/utils/theme/components/typography";

const stylesheet = createStyleSheet((theme) => ({
    menuButton: {
        backgroundColor: theme.colours.primary[theme.shades.lighter],
    },
    menuButtonStack: {
        height: 100,
        justifyContent: "center",
        alignItems: "center",
    },
}));

export type MenuButtonProps = {
    navigateTo: string;
    text: string;
    icon: IconName;
};

export type MenuButtonComponent = React.FC<MenuButtonProps>;

export const MenuButton: MenuButtonComponent = ({ navigateTo, icon, text }): JSX.Element => {
    const { navigate } = useRouter();
    const { styles } = useStyles(stylesheet);

    return (
        <Button onPress={() => navigate(navigateTo)} style={styles.menuButton}>
            <Stack style={styles.menuButtonStack}>
                <Icon name={icon} size={30} />
                <Typography variant="h4">{text}</Typography>
            </Stack>
        </Button>
    );
};

export type MenuProps = {};

export type MenuComponent = React.FC<MenuProps>;

const Menu: MenuComponent = (): JSX.Element => {
    const { navigate } = useRouter();
    return (
        <PageLayout title="Menu">
            <Grid container>
                <Grid item xs={6}>
                    <MenuButton icon="earth" navigateTo="/events" text="Events" />
                </Grid>
                <Grid item xs={6}>
                    <MenuButton icon="albums" navigateTo="/qsl" text="QSLs" />
                </Grid>
            </Grid>
            <Grid container>
                <Grid item xs={6}>
                    <MenuButton icon="stats-chart" navigateTo="/stats" text="Stats" />
                </Grid>
                <Grid item xs={6}>
                    <MenuButton icon="archive" navigateTo="/adif" text="Import/Export" />
                </Grid>
            </Grid>
            <Grid container>
                <Grid item xs={6}>
                    <MenuButton icon="settings" navigateTo="/settings" text="Settings" />
                </Grid>
                <Grid item xs={6}>
                    <MenuButton icon="information-circle" navigateTo="/about" text="About" />
                </Grid>
            </Grid>
        </PageLayout>
    );
};

export default Menu;
