import React from "react";
import { View, ViewStyle } from "react-native";
import { createStyleSheet, useStyles } from "react-native-unistyles";
import { breakpoints, spacing } from "../../utils/theme";
import { Styles, mergeStyles } from "../../utils/theme/components/styles";

export type StackProps = {
    style?: Styles<ViewStyle>;
    direction?: "row" | "column";
    gap?: keyof typeof breakpoints | number;
};

export type StackComponent = React.FC<React.PropsWithChildren<StackProps>>;

const stylesheet = createStyleSheet((theme) => ({
    defaultRow: {
        alignItems: "center",
    },
    defaultCol: {
        alignContent: "flex-start",
    },
}));

export const Stack: StackComponent = ({ style, gap = "xs", direction = "column", children }): JSX.Element => {
    const { styles } = useStyles(stylesheet);
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
