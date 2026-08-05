import { PropsWithChildren } from "react";
import { View } from "react-native";
import { StyleSheet } from "react-native-unistyles";
import { ColourVariant } from "../theme";
import { Typography } from "./typography";

const styles = StyleSheet.create((theme) => ({
    container: {
        position: "relative",
    },
    badge: (colour: ColourVariant) => ({
        position: "absolute",
        zIndex: 1000,
        top: -(theme.components.typography.fontSize / 2),
        right: -(theme.components.typography.fontSize / 2),
        backgroundColor: theme.colours[colour].main,
        padding: theme.margins.md,
        paddingLeft: theme.margins.lg,
        paddingRight: theme.margins.lg,
        borderRadius: theme.components.typography.fontSize,
    }),
    content: {},
}));

export type BadgeProps = PropsWithChildren<{
    count: number;
    colour?: ColourVariant;
}>;

export const Badge = ({ count, colour = "primary", children }: BadgeProps) => {
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
