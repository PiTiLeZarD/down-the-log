import {
    DrawerContentComponentProps,
    DrawerContentScrollView,
    DrawerItem,
    createDrawerNavigator,
} from "@react-navigation/drawer";
import { View } from "react-native";
import { QSO } from "./utils/qso";

export type NavigationParamList = {
    Home: undefined;
    About: undefined;
    QsoForm: { qsoId: QSO["id"] };
    Adif: undefined;
};
export const Navigation = createDrawerNavigator<NavigationParamList>();

export type DrawerContentComponent = React.FC<DrawerContentComponentProps>;

export const DrawerContent: DrawerContentComponent = (props): JSX.Element => {
    return (
        <DrawerContentScrollView {...props}>
            <View>
                <DrawerItem label="Home" onPress={() => props.navigation.navigate("Home")} />
                <DrawerItem label="Import/Export" onPress={() => props.navigation.navigate("Adif")} />
                <DrawerItem label="About" onPress={() => props.navigation.navigate("About")} />
            </View>
        </DrawerContentScrollView>
    );
};
