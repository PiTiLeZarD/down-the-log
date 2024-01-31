import { NavigationContainer } from "@react-navigation/native";
import { useFonts } from "expo-font";
import * as SplashScreen from "expo-splash-screen";
import React, { useCallback } from "react";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
import { Navigation } from "./Navigation";
import { About } from "./pages/about";
import { Adif } from "./pages/adif";
import { Events } from "./pages/events";
import { Home } from "./pages/home";
import { Menu } from "./pages/menu";
import { QsoForm } from "./pages/qso-form";
import { Settings } from "./pages/settings";
import { Stats } from "./pages/stats";
import { useStore } from "./store";
import { LocationHeader } from "./utils/location-header";
import { latlong2Maidenhead } from "./utils/locator";
import "./utils/theme";
import { useLocation } from "./utils/use-location";
import { useSettings } from "./utils/use-settings";

SplashScreen.preventAutoHideAsync();

const App = (): JSX.Element => {
    const [fontsLoaded, fontError] = useFonts({
        Quicksand: require("./utils/theme/Quicksand-VariableFont_wght.ttf"),
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
            <NavigationContainer>
                <SafeAreaView style={{ flex: 1 }} onLayout={onLayoutRootView}>
                    <Navigation.Navigator
                        initialRouteName="Home"
                        screenOptions={{
                            header: (props) => <LocationHeader {...props} />,
                        }}
                    >
                        <Navigation.Screen name="Home" component={Home} />
                        <Navigation.Screen name="Stats" component={Stats} />
                        <Navigation.Screen name="QsoForm" component={QsoForm} />
                        <Navigation.Screen name="About" component={About} />
                        <Navigation.Screen name="Adif" component={Adif} />
                        <Navigation.Screen name="Events" component={Events} />
                        <Navigation.Screen name="Menu" component={Menu} />
                        <Navigation.Screen name="Settings" component={Settings} />
                    </Navigation.Navigator>
                </SafeAreaView>
            </NavigationContainer>
        </SafeAreaProvider>
    );
};

export default App;
