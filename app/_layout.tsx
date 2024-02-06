import { useFonts } from "expo-font";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import React, { useCallback } from "react";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
import { LocationHeader } from "./lib/components/location-header";
import { latlong2Maidenhead } from "./lib/utils/locator";
import { useStore } from "./lib/utils/store";
import "./lib/utils/theme";
import { useLocation } from "./lib/utils/use-location";
import { useSettings } from "./lib/utils/use-settings";

export {
    // Catch any errors thrown by the Layout component.
    ErrorBoundary,
} from "expo-router";

SplashScreen.preventAutoHideAsync();

const RootLayout = (): JSX.Element => {
    const [fontsLoaded, fontError] = useFonts({
        Quicksand: require("../assets/Quicksand-VariableFont_wght.ttf"),
    });

    const setCurrentLocation = useStore((state) => state.setCurrentLocation);
    const settings = useSettings();
    const location = useLocation(settings.myGridsquare);

    React.useEffect(() => {
        if (location) setCurrentLocation(latlong2Maidenhead(location.coords));
    }, [location]);

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
                <Stack screenOptions={{ header: () => <LocationHeader /> }}>
                    <Stack.Screen name="index" />
                    <Stack.Screen name="menu" />
                    <Stack.Screen name="about" />
                    <Stack.Screen name="settings" />
                    <Stack.Screen name="events" />
                    <Stack.Screen name="qsl" />
                    <Stack.Screen name="stats" />
                </Stack>
            </SafeAreaView>
        </SafeAreaProvider>
    );
};

export default RootLayout;
