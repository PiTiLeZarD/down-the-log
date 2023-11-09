import { config } from '@gluestack-ui/config';
import { GluestackUIProvider } from '@gluestack-ui/themed';
import { NavigationContainer } from '@react-navigation/native';
import React from 'react';
import { LogBox } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { RootStack } from './RootStack';
import { About } from './pages/about';
import { Adif } from './pages/adif';
import { Home } from './pages/home';
import { QsoForm } from './pages/qso-form';
import { useStore } from './store';
import { latlong2Maidenhead } from './utils/locator';
import { useLocation } from './utils/use-location';

LogBox.ignoreLogs([
    `Constants.platform.ios.model has been deprecated in favor of expo-device's Device.modelName property. This API will be removed in SDK 45.`,
]);

const App = (): JSX.Element => {
    const setCurrentLocation = useStore((state) => state.setCurrentLocation);
    const location = useLocation();

    React.useEffect(() => {
        if (location) setCurrentLocation(latlong2Maidenhead(location.coords));
    }, [location]);

    return (
        <SafeAreaProvider>
            <NavigationContainer>
                <GluestackUIProvider config={config}>
                    <SafeAreaView style={{ flex: 1 }}>
                        <RootStack.Navigator initialRouteName="Home" screenOptions={{ headerShown: false }}>
                            <RootStack.Screen name="Home" component={Home} />
                            <RootStack.Screen name="QsoForm" component={QsoForm} />
                            <RootStack.Screen name="About" component={About} />
                            <RootStack.Screen name="Adif" component={Adif} />
                        </RootStack.Navigator>
                    </SafeAreaView>
                </GluestackUIProvider>
            </NavigationContainer>
        </SafeAreaProvider>
    );
};

export default App;
