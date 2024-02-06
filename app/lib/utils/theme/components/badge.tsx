import React from "react";
import { View } from "react-native";
import { createStyleSheet, useStyles } from "react-native-unistyles";
import { ColourVariant } from "../theme";
import { Typography } from "./typography";

const stylesheet = createStyleSheet((theme) => ({
    container: {
        position: "relative",
    },
    badge: (colour: ColourVariant) => ({
        position: "absolute",
        zIndex: 1000,
        top: -(theme.components.typography.fontSize / 2),
        right: -(theme.components.typography.fontSize / 2),
        backgroundColor: theme.colours[colour][theme.shades.main],
        padding: theme.margins.md,
        paddingLeft: theme.margins.lg,
        paddingRight: theme.margins.lg,
        borderRadius: theme.components.typography.fontSize,
    }),
    content: {},
}));

export type BadgeProps = {
    count: number;
    colour?: ColourVariant;
};

export type BadgeComponent = React.FC<React.PropsWithChildren<BadgeProps>>;

export const Badge: BadgeComponent = ({ count, colour = "primary", children }): JSX.Element => {
    const { styles } = useStyles(stylesheet);
    if (count === 0) return <>{children}</>;
    return (
        <View style={styles.container}>
            <View style={styles.badge(colour)}>
                <Typography variant="em">{count}</Typography>
            </View>
            <View style={styles.content}>{children}</View>
        </View>
    );
};
