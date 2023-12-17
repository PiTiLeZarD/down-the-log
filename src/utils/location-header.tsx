import { DrawerScreenProps } from "@react-navigation/drawer";
import { ParamListBase } from "@react-navigation/native";
import React from "react";
import { View } from "react-native";
import cqzones from "../data/cqzones.json";
import dxcc from "../data/dxcc.json";
import ituzones from "../data/ituzones.json";
import { useStore } from "../store";
import { Clocks } from "./clocks";
import { maidenhead2Latlong } from "./locator";
import { findZone } from "./polydec";
import { Stack } from "./stack";
import { createStyleSheet, useStyles } from "./theme";
import { Button } from "./theme/components/button";
import { Icon } from "./theme/components/icon";
import { Typography } from "./theme/components/typography";

const stylesheet = createStyleSheet((theme) => ({
    header: {
        backgroundColor: theme.colours.primary[theme.shades.light],
        padding: theme.margins.md,
    },
}));

export type LocationHeaderProps = {} & Pick<DrawerScreenProps<ParamListBase, string>, "navigation">;

export type LocationHeaderComponent = React.FC<LocationHeaderProps>;

export const LocationHeader: LocationHeaderComponent = ({ navigation }): JSX.Element => {
    const currentLocation = useStore((state) => state.currentLocation);
    const { styles } = useStyles(stylesheet);

    if (!currentLocation) return <Typography>Looking for your location...</Typography>;

    return (
        <View>
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
                        <Icon name="menu" contrast />
                    </Button>
                </View>
            </Stack>
            <Clocks />
        </View>
    );
};
