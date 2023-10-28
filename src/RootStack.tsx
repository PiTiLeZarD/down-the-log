import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { QSO } from './store';

export type RootStackParamList = {
    Home: undefined;
    About: undefined;
    QsoForm: { qsoId: QSO['id'] };
};
export const RootStack = createNativeStackNavigator<RootStackParamList>();
