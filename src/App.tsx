import { config } from '@gluestack-ui/config';
import { GluestackUIProvider } from '@gluestack-ui/themed';
import { NavigationContainer } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { RootStack } from './RootStack';
import { About } from './about';
import { Home } from './home';

const App = (): JSX.Element => {
    return (
        <SafeAreaProvider>
            <NavigationContainer>
                <GluestackUIProvider config={config}>
                    <RootStack.Navigator initialRouteName="Home" screenOptions={{ headerShown: false }}>
                        <RootStack.Screen name="Home" component={Home} />
                        <RootStack.Screen name="About" component={About} />
                    </RootStack.Navigator>
                </GluestackUIProvider>
            </NavigationContainer>
        </SafeAreaProvider>
    );
};

export default App;
