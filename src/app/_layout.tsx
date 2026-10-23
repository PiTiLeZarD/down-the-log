import { Asset } from "expo-asset";
import { useFonts } from "expo-font";
import { DarkTheme, DefaultTheme, Stack, ThemeProvider } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import React, { useCallback } from "react";
import { Platform, View } from "react-native";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
import { StyleSheet, useUnistyles } from "react-native-unistyles";
import { LocationHeader } from "../lib/components/location-header";
import { Alert } from "../lib/ui/alert";
import { DialogHost } from "../lib/ui/dialog";
import { Typography } from "../lib/ui/typography";
import { latlong2Maidenhead } from "../lib/utils/locator";
import { loadStore, usePersistence } from "../lib/utils/persistence";
import { useStore } from "../lib/utils/store";
import "../lib/ui";
import { useClusterConfig, useSpotConfig } from "../lib/utils/spots";
import { useLocation } from "../lib/utils/use-location";
import { useNotificationTaps } from "../lib/utils/use-notification-taps";
import { useSettings } from "../lib/utils/use-settings";

export {
    // Catch any errors thrown by the Layout component.
    ErrorBoundary,
} from "expo-router";

const styles = StyleSheet.create((theme) => ({
    // Unistyles only styles components its babel plugin has processed, so handing this to
    // expo-router's `contentStyle` (react-native-screens) silently drops it. Own the backdrop here.
    main: {
        flex: 1,
        backgroundColor: theme.background,
    },
}));

SplashScreen.preventAutoHideAsync();

const QUICKSAND = require("../../assets/Quicksand-VariableFont_wght.ttf");

// expo-font's @font-face has no weight range, so WebKit (Safari, Tauri on macOS) treats the variable
// font as regular-only and smears a faux bold over it. Chrome reads the wght axis and never notices.
if (Platform.OS === "web") {
    const style = document.createElement("style");
    style.textContent = `@font-face { font-family: Quicksand; src: url(${Asset.fromModule(QUICKSAND).uri}); font-weight: 300 700; }`;
    document.head.appendChild(style);
}

// Everything below needs the log and the settings in the store, so none of it mounts until they've
// been read: a hook that wrote to the store before then would only have been overwritten.
const App = () => {
    // Mounted here rather than only behind the spots bar: spot alerts have to keep polling from
    // whatever screen the operator is on, and this is the one component that is always up.
    useSpotConfig();
    // The desktop build's telnet clusters, kept connected the same way; a no-op everywhere else.
    useClusterConfig();
    // Routes a tapped spot alert to the Spots page on iOS and Android; a no-op everywhere else.
    useNotificationTaps();

    // Every screen is painted on a react-navigation card, and its palette is independent of ours:
    // left alone it defaults to the light theme and washes out the whole app. Mirror our theme onto it.
    const { theme, rt } = useUnistyles();
    const navigationTheme = React.useMemo(() => {
        const base = rt.themeName === "dark" ? DarkTheme : DefaultTheme;
        return {
            ...base,
            colors: {
                ...base.colors,
                primary: theme.colours.primary.main,
                background: theme.background,
                card: theme.background,
                text: theme.text.main,
                border: theme.colours.grey.dark,
                notification: theme.colours.secondary.main,
            },
        };
    }, [rt.themeName, theme]);

    // Browser chrome we can't style directly — the dropdown list a <select> pops open, scrollbars —
    // follows this instead.
    React.useEffect(() => {
        if (Platform.OS === "web") document.documentElement.style.colorScheme = rt.themeName ?? "";
    }, [rt.themeName]);

    const setCurrentLocation = useStore((state) => state.setCurrentLocation);
    const settings = useSettings();
    const location = useLocation(settings.myGridsquare);

    React.useEffect(() => {
        if (location) setCurrentLocation(latlong2Maidenhead(location.coords));
    }, [location, setCurrentLocation]);

    const writeError = usePersistence((state) => state.writeError);

    return (
        <View style={styles.main}>
            {writeError && (
                <Alert severity="danger">
                    <Typography style={{ flexGrow: 1 }}>
                        Your latest changes haven't been saved: {writeError}. They're tried again with your next change
                        — if this keeps up, export your log from the ADIF page before closing the app.
                    </Typography>
                </Alert>
            )}
            <ThemeProvider value={navigationTheme}>
                <Stack screenOptions={{ header: () => <LocationHeader /> }}>
                    <Stack.Screen name="index" />
                    <Stack.Screen name="menu" />
                    <Stack.Screen name="about" />
                    <Stack.Screen name="settings" />
                    <Stack.Screen name="events/index" />
                    <Stack.Screen name="events/[section]" />
                    <Stack.Screen name="qsl" />
                    <Stack.Screen name="analytics" />
                    <Stack.Screen name="stats" />
                </Stack>
            </ThemeProvider>
            <DialogHost />
        </View>
    );
};

const RootLayout = () => {
    const [fontsLoaded, fontError] = useFonts({
        Quicksand: QUICKSAND,
    });
    const { status, error } = usePersistence();

    React.useEffect(() => {
        void loadStore();
    }, []);

    const onLayoutRootView = useCallback(async () => {
        await SplashScreen.hideAsync();
    }, []);

    // The splash stays up until both are in.
    if ((!fontsLoaded && !fontError) || status === "loading") {
        return <></>;
    }

    return (
        <SafeAreaProvider>
            <SafeAreaView style={{ flex: 1 }} onLayout={onLayoutRootView}>
                {status === "failed" ? (
                    <View style={styles.main}>
                        <Alert severity="danger">
                            <Typography style={{ flexGrow: 1 }}>
                                Your log couldn't be loaded: {error}. Nothing on this device has been changed, and
                                nothing will be saved until it loads. Close the app and open it again to retry.
                            </Typography>
                        </Alert>
                    </View>
                ) : (
                    <App />
                )}
            </SafeAreaView>
        </SafeAreaProvider>
    );
};

export default RootLayout;
