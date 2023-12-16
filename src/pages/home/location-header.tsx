import { Ionicons } from "@expo/vector-icons";
import { DrawerScreenProps } from "@react-navigation/drawer";
import React from "react";
import { View } from "react-native";
import { NavigationParamList } from "../../Navigation";
import cqzones from "../../data/cqzones.json";
import dxcc from "../../data/dxcc.json";
import ituzones from "../../data/ituzones.json";
import { useStore } from "../../store";
import { maidenhead2Latlong } from "../../utils/locator";
import { findZone } from "../../utils/polydec";
import { Stack } from "../../utils/stack";
import { createStyleSheet, useStyles } from "../../utils/theme";
import { Button } from "../../utils/theme/components/button";
import { Typography } from "../../utils/theme/components/typography";

const stylesheet = createStyleSheet((theme) => ({
    header: {
        backgroundColor: theme.colours.primary[300],
        padding: 4,
    },
}));

export type LocationHeaderProps = {} & Pick<DrawerScreenProps<NavigationParamList, "Home">, "navigation">;

export type LocationHeaderComponent = React.FC<LocationHeaderProps>;

export const LocationHeader: LocationHeaderComponent = ({ navigation }): JSX.Element => {
    const currentLocation = useStore((state) => state.currentLocation);
    const { styles } = useStyles(stylesheet);

    if (!currentLocation) return <Typography>Looking for your location...</Typography>;

    return (
        <Stack direction="row" style={styles.header}>
            <Stack style={{ flexGrow: 1 }}>
                <Stack direction="row">
                    <Typography>Locator: </Typography>
                    <Typography>{currentLocation}</Typography>
                </Stack>
                <Typography>
                    (CQ: {findZone(cqzones, maidenhead2Latlong(currentLocation))}, ITU:{" "}
                    {findZone(ituzones, maidenhead2Latlong(currentLocation))}, DXCC:{" "}
                    {findZone(dxcc, maidenhead2Latlong(currentLocation))})
                </Typography>
            </Stack>
            <View>
                <Button onPress={() => navigation.openDrawer()}>
                    <Ionicons name="menu" size={20} color="white" />
                </Button>
            </View>
        </Stack>
    );
};

/* <Menu
                    placement="bottom left"
                    trigger={(props) => (
                        <Button {...props}>
                            <ButtonIcon as={ThreeDotsIcon} />
                        </Button>
                    )}
                >
                    <MenuItem key="About" textValue="About" onPressOut={() => navigation.navigate("About")}>
                        <Icon as={InfoIcon} size="sm" mr="$2" />
                        <MenuItemLabel size="sm">About</MenuItemLabel>
                    </MenuItem>
                    <MenuItem key="ImpExp" textValue="Import/Export" onPressOut={() => navigation.navigate("Adif")}>
                        <Icon as={ShareIcon} size="sm" mr="$2" />
                        <MenuItemLabel size="sm">Import/Export</MenuItemLabel>
                    </MenuItem>
                </Menu> */
