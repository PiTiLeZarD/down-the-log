import { NavigationContainer } from '@react-navigation/native';
import { LogBox } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';

import { config } from '@gluestack-ui/config';
import { GluestackUIProvider } from '@gluestack-ui/themed';

import { RootStack } from './RootStack';
import { About } from './about';
import { Home } from './home';
import { QsoForm } from './qso-form';

LogBox.ignoreLogs([
    `Constants.platform.ios.model has been deprecated in favor of expo-device's Device.modelName property. This API will be removed in SDK 45.`,
]);

const App = (): JSX.Element => {
    return (
        <SafeAreaProvider>
            <NavigationContainer>
                <GluestackUIProvider config={config}>
                    <SafeAreaView style={{ flex: 1 }}>
                        <RootStack.Navigator initialRouteName="Home" screenOptions={{ headerShown: false }}>
                            <RootStack.Screen name="Home" component={Home} />
                            <RootStack.Screen name="QsoForm" component={QsoForm} />
                            <RootStack.Screen name="About" component={About} />
                        </RootStack.Navigator>
                    </SafeAreaView>
                </GluestackUIProvider>
            </NavigationContainer>
        </SafeAreaProvider>
    );
};

export default App;
