import React from "react";
import { View, ViewStyle } from "react-native";
import { breakpoints, spacing } from "../theme";

export type StackProps = {
    style?: ViewStyle;
    direction?: "row" | "column";
    gap?: keyof typeof breakpoints;
};

export type StackComponent = React.FC<React.PropsWithChildren<StackProps>>;

export const Stack: StackComponent = ({ style, gap = "xs", direction = "column", children }): JSX.Element => {
    return (
        <View style={[style, { display: "flex", flexDirection: direction, alignItems: "center", gap: spacing[gap] }]}>
            {children}
        </View>
    );
};
