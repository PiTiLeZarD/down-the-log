import React from "react";
import { View } from "react-native";
import { createStyleSheet, useStyles } from "react-native-unistyles";
import { Stack } from "./stack";
import { Button } from "./theme/components/button";
import { ColourVariant } from "./theme/theme";

const stylesheet = createStyleSheet((theme) => ({
    mainContainer: {
        flexGrow: 1,
        marginTop: theme.margins.xl,
        marginBottom: theme.margins.xl,
    },
    tabsButtonsContainer: {
        backgroundColor: theme.colours.grey[theme.shades.lighter],
        borderColor: theme.colours.grey[theme.shades.dark],
        borderWidth: 1,
        borderStyle: "solid",
        borderBottomWidth: 0,
        borderTopLeftRadius: theme.margins.xl,
        borderTopRightRadius: theme.margins.xl,
        padding: theme.margins.lg,
    },
    tabsContainer: {
        flexGrow: 1,
    },
    tabContentContainer: (shown: boolean) => ({
        display: shown ? "flex" : "none",
        flex: shown ? 1 : 0,
        padding: theme.margins.lg,
        borderColor: theme.colours.grey[theme.shades.dark],
        borderWidth: 1,
        borderStyle: "solid",
        borderTopWidth: 0,
        borderBottomLeftRadius: theme.margins.xl,
        borderBottomRightRadius: theme.margins.xl,
        backgroundColor: theme.colours.grey[theme.shades.lighter],
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
        <Stack direction="row" style={styles.tabsButtonsContainer}>
            {tabs.map((tab, index) => (
                <View key={tab} style={styles.tab(variant)}>
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
        <Stack style={styles.mainContainer} gap={0}>
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
