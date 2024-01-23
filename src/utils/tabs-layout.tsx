import React from "react";
import { View } from "react-native";
import { createStyleSheet, useStyles } from "react-native-unistyles";
import { Stack } from "./stack";
import { Button } from "./theme/components/button";
import { ColourVariant } from "./theme/theme";

const stylesheet = createStyleSheet((theme) => ({
    mainContainer: {
        flexGrow: 1,
    },
    tabsContainer: {
        flexGrow: 1,
    },
    tabContentContainer: (shown: boolean) => ({
        display: shown ? "flex" : "none",
        flex: shown ? 1 : 0,
    }),
    tab: (variant: ColourVariant) => ({
        paddingTop: theme.margins.md,
        backgroundColor: theme.colours[variant][theme.shades.lighter],
        flex: 1,
        alignItems: "center",
    }),
    tabButton: {
        width: "100%",
    },
}));

export type TabsLayoutProps = {
    tabs: string[];
    position?: "top" | "bottom";
    variant?: ColourVariant;
};

export type TabsLayoutComponent = React.FC<React.PropsWithChildren<TabsLayoutProps>>;

export const TabsLayout: TabsLayoutComponent = ({
    position = "top",
    variant = "primary",
    tabs,
    children,
}): JSX.Element => {
    const { styles } = useStyles(stylesheet);
    const [current, setCurrent] = React.useState<number>(0);

    const tabsButtons = (
        <Stack direction="row">
            {tabs.map((tab, index) => (
                <View style={styles.tab(variant)}>
                    <Button
                        variant={current == index ? "contained" : "outlined"}
                        text={tab}
                        colour="grey"
                        style={styles.tabButton}
                        onPress={() => setCurrent(index)}
                    />
                </View>
            ))}
        </Stack>
    );
    return (
        <Stack style={styles.mainContainer}>
            {position == "top" && tabsButtons}
            <View style={styles.tabsContainer}>
                {React.Children.toArray(children).map((child, index) => (
                    <View key={index} style={styles.tabContentContainer(index === current)}>
                        {child}
                    </View>
                ))}
            </View>
            {position == "bottom" && tabsButtons}
        </Stack>
    );
};
