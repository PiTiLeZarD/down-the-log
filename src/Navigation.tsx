import { createDrawerNavigator } from "@react-navigation/drawer";
import { QSO } from "./utils/qso";

export type NavigationParamList = {
    Home: undefined;
    About: undefined;
    QsoForm: { qsoId: QSO["id"] };
    Adif: undefined;
};
export const Navigation = createDrawerNavigator<NavigationParamList>();
