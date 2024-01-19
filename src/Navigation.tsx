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
    Stats: undefined;
    About: undefined;
    QsoForm: { qsoId: QSO["id"] };
    Adif: undefined;
    Settings: undefined;
};
export const Navigation = createDrawerNavigator<NavigationParamList>();

export type DrawerContentComponent = React.FC<DrawerContentComponentProps>;

export const DrawerContent: DrawerContentComponent = (props): JSX.Element => {
    // const drawerRef = useRef<ScrollView>(null);

    // const { width } = useWindowDimensions();

    // const handleUpdate = () => {
    //     if (drawerRef.current) {
    //         const parent = (drawerRef.current as unknown as Node).parentNode;
    //         const open = +(parent?.parentNode?.firstChild?.lastChild as HTMLElement)?.style.opacity === 1;
    //         const styles = (parent as HTMLElement)?.style;

    //         const drawerWidth = +styles.width.replace("px", "");
    //         const offset = +styles.transform.substring(11, styles.transform.length - 3);

    //         ((drawerRef.current as unknown as Node)?.parentNode as HTMLElement).style!.transform = `translateX(${
    //             open ? width - drawerWidth : width
    //         }px)`;
    //     }
    // };
    // const observer = new MutationObserver((mutations) => mutations.forEach(handleUpdate));

    // useEffect(() => {
    //     if (drawerRef.current) {
    //         const parent = (drawerRef.current as unknown as Node).parentNode;
    //         observer.observe(parent as Node, { attributes: true, attributeFilter: ["style"] });
    //     }
    //     return () => observer.disconnect();
    // }, [drawerRef]);
    // useEffect(() => handleUpdate, [drawerRef, width]);

    return (
        <DrawerContentScrollView {...props}>
            <View>
                <DrawerItem label="Home" onPress={() => props.navigation.navigate("Home")} />
                <DrawerItem label="Stats" onPress={() => props.navigation.navigate("Stats")} />
                <DrawerItem label="Settings" onPress={() => props.navigation.navigate("Settings")} />
                <DrawerItem label="Import/Export" onPress={() => props.navigation.navigate("Adif")} />
                <DrawerItem label="About" onPress={() => props.navigation.navigate("About")} />
            </View>
        </DrawerContentScrollView>
    );
};
