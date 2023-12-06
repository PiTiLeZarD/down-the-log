import { P } from "@expo/html-elements";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import React from "react";
import { Text, View } from "react-native";
import { RootStackParamList } from "../../RootStack";
import cqzones from "../../data/cqzones.json";
import dxcc from "../../data/dxcc.json";
import ituzones from "../../data/ituzones.json";
import { useStore } from "../../store";
import { Grid } from "../../utils/grid";
import { maidenhead2Latlong } from "../../utils/locator";
import { findZone } from "../../utils/polydec";
import { createStyleSheet, useStyles } from "../../utils/theme";

const stylesheet = createStyleSheet((theme) => ({
    header: {
        backgroundColor: theme.colors.primary[200],
        padding: 4,
    },
    text: {
        color: theme.colors.primary[800],
    },
}));

export type LocationHeaderProps = {} & Pick<NativeStackScreenProps<RootStackParamList, "Home">, "navigation">;

export type LocationHeaderComponent = React.FC<LocationHeaderProps>;

export const LocationHeader: LocationHeaderComponent = ({ navigation }): JSX.Element => {
    const currentLocation = useStore((state) => state.currentLocation);
    const { styles } = useStyles(stylesheet);

    if (!currentLocation) return <P>Looking for your location...</P>;

    return (
        <Grid container style={styles.header}>
            <Grid item xs={10} sm={11}>
                <View>
                    <Text style={styles.text}>Locator: {currentLocation}</Text>
                    <Text style={styles.text}>
                        (CQ: {findZone(cqzones, maidenhead2Latlong(currentLocation))}, ITU:{" "}
                        {findZone(ituzones, maidenhead2Latlong(currentLocation))}, DXCC:{" "}
                        {findZone(dxcc, maidenhead2Latlong(currentLocation))})
                    </Text>
                </View>
            </Grid>
            <Grid item xs={2} sm={1}>
                {/* <Menu
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
                </Menu> */}
            </Grid>
        </Grid>
    );
};
