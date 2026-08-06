import { useFonts } from "expo-font";
import { DarkTheme, DefaultTheme, Stack, ThemeProvider } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import React, { useCallback } from "react";
import { Platform, View } from "react-native";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
import { StyleSheet, useUnistyles } from "react-native-unistyles";
import { LocationHeader } from "./lib/components/location-header";
import { latlong2Maidenhead } from "./lib/utils/locator";
import { useStore } from "./lib/utils/store";
import "./lib/ui";
import { useLocation } from "./lib/utils/use-location";
import { useSettings } from "./lib/utils/use-settings";

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

const RootLayout = () => {
    const [fontsLoaded, fontError] = useFonts({
        Quicksand: require("../assets/Quicksand-VariableFont_wght.ttf"),
    });

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

    const onLayoutRootView = useCallback(async () => {
        if (fontsLoaded || fontError) {
            await SplashScreen.hideAsync();
        }
    }, [fontsLoaded, fontError]);

    if (!fontsLoaded && !fontError) {
        return <></>;
    }

    return (
        <SafeAreaProvider>
            <SafeAreaView style={{ flex: 1 }} onLayout={onLayoutRootView}>
                <View style={styles.main}>
                    <ThemeProvider value={navigationTheme}>
                        <Stack screenOptions={{ header: () => <LocationHeader /> }}>
                            <Stack.Screen name="index" />
                            <Stack.Screen name="menu" />
                            <Stack.Screen name="about" />
                            <Stack.Screen name="settings" />
                            <Stack.Screen name="events" />
                            <Stack.Screen name="qsl" />
                            <Stack.Screen name="stats" />
                        </Stack>
                    </ThemeProvider>
                </View>
            </SafeAreaView>
        </SafeAreaProvider>
    );
};

export default RootLayout;
