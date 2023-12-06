import { NavigationContainer } from "@react-navigation/native";
import { useFonts } from "expo-font";
import * as SplashScreen from "expo-splash-screen";
import React, { useCallback } from "react";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
import { UnistylesTheme } from "react-native-unistyles";
import { RootStack } from "./RootStack";
import { About } from "./pages/about";
import { Adif } from "./pages/adif";
import { Home } from "./pages/home";
import { QsoForm } from "./pages/qso-form";
import { useStore } from "./store";
import { latlong2Maidenhead } from "./utils/locator";
import { theme } from "./utils/theme";
import { useLocation } from "./utils/use-location";

SplashScreen.preventAutoHideAsync();

const App = (): JSX.Element => {
    const [fontsLoaded, fontError] = useFonts({
        Quicksand: require("./utils/theme/Quicksand-VariableFont_wght.ttf"),
    });

    const setCurrentLocation = useStore((state) => state.setCurrentLocation);
    const location = useLocation();

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
            <NavigationContainer>
                <UnistylesTheme theme={theme}>
                    <SafeAreaView style={{ flex: 1 }} onLayout={onLayoutRootView}>
                        <RootStack.Navigator initialRouteName="Home" screenOptions={{ headerShown: false }}>
                            <RootStack.Screen name="Home" component={Home} />
                            <RootStack.Screen name="QsoForm" component={QsoForm} />
                            <RootStack.Screen name="About" component={About} />
                            <RootStack.Screen name="Adif" component={Adif} />
                        </RootStack.Navigator>
                    </SafeAreaView>
                </UnistylesTheme>
            </NavigationContainer>
        </SafeAreaProvider>
    );
};

export default App;
