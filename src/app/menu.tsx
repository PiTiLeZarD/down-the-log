import { useRouter } from "expo-router";
import { StyleSheet } from "react-native-unistyles";
import { Grid } from "../lib/components/grid";
import { PageLayout } from "../lib/components/page-layout";
import { Stack } from "../lib/components/stack";
import { Button } from "../lib/ui/button";
import { Icon, IconName } from "../lib/ui/icon";
import { Typography } from "../lib/ui/typography";

const styles = StyleSheet.create((theme) => ({
    menuButton: {
        backgroundColor: theme.colours.primary.lighter,
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

export const MenuButton = ({ navigateTo, icon, text }: MenuButtonProps) => {
    const { navigate } = useRouter();

    return (
        <Button onPress={() => navigate(navigateTo)} style={styles.menuButton}>
            <Stack style={styles.menuButtonStack}>
                <Icon name={icon} size={30} />
                <Typography variant="h4">{text}</Typography>
            </Stack>
        </Button>
    );
};

const Menu = () => {
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
                    <MenuButton icon="time" navigateTo="/sessions" text="Sessions" />
                </Grid>
                <Grid item xs={6}>
                    <MenuButton icon="stats-chart" navigateTo="/stats" text="Stats" />
                </Grid>
            </Grid>
            <Grid container>
                <Grid item xs={6}>
                    <MenuButton icon="archive" navigateTo="/adif" text="Import/Export" />
                </Grid>
                <Grid item xs={6}>
                    <MenuButton icon="settings" navigateTo="/settings" text="Settings" />
                </Grid>
            </Grid>
            <Grid container>
                <Grid item xs={6}>
                    <MenuButton icon="information-circle" navigateTo="/about" text="About" />
                </Grid>
            </Grid>
        </PageLayout>
    );
};

export default Menu;
