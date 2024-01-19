import { createStackNavigator } from "@react-navigation/stack";
import { QSO } from "./utils/qso";

export type NavigationParamList = {
    Home: undefined;
    Stats: undefined;
    Menu: undefined;
    About: undefined;
    QsoForm: { qsoId: QSO["id"] };
    Adif: undefined;
    Settings: undefined;
};
export const Navigation = createStackNavigator<NavigationParamList>();
