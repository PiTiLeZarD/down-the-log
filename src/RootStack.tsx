import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { QSO } from "./utils/qso";

export type RootStackParamList = {
    Home: undefined;
    About: undefined;
    QsoForm: { qsoId: QSO["id"] };
    Adif: undefined;
};
export const RootStack = createNativeStackNavigator<RootStackParamList>();
