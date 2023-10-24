import { createNativeStackNavigator } from '@react-navigation/native-stack';

export type RootStackParamList = {
    Home: undefined;
    About: undefined;
};
export const RootStack = createNativeStackNavigator<RootStackParamList>();
