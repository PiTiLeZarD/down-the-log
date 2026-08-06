import { PropsWithChildren } from "react";
import { View, ViewStyle } from "react-native";
import { StyleSheet } from "react-native-unistyles";
import { breakpoints, spacing } from "../../ui";
import { Styles, mergeStyles } from "../../ui/styles";

export type StackProps = PropsWithChildren<{
    style?: Styles<ViewStyle>;
    direction?: "row" | "column";
    gap?: keyof typeof breakpoints | number;
}>;

const styles = StyleSheet.create((theme) => ({
    defaultRow: {
        alignItems: "center",
    },
    defaultCol: {
        alignContent: "flex-start",
    },
}));

export const Stack = ({ style, gap = "xs", direction = "column", children }: StackProps) => {
    return (
        <View
            style={mergeStyles<ViewStyle>(direction == "row" ? styles.defaultRow : styles.defaultCol, style, {
                display: "flex",
                flexDirection: direction,
                gap: typeof gap === "number" ? 0 : spacing[gap],
            })}
        >
            {children}
        </View>
    );
};
