import React from "react";
import { View, ViewStyle } from "react-native";
import { breakpoints, spacing } from "../theme";
import { Styles, mergeStyles } from "../theme/components/styles";

export type StackProps = {
    style?: Styles<ViewStyle>;
    direction?: "row" | "column";
    gap?: keyof typeof breakpoints | number;
};

export type StackComponent = React.FC<React.PropsWithChildren<StackProps>>;

const defaultRowStyles = (): ViewStyle => ({ alignItems: "center" });
const defaultColStyles = (): ViewStyle => ({ alignContent: "flex-start" });

export const Stack: StackComponent = ({ style, gap = "xs", direction = "column", children }): JSX.Element => {
    return (
        <View
            style={mergeStyles<ViewStyle>(
                style,
                { display: "flex", flexDirection: direction, gap: typeof gap === "number" ? 0 : spacing[gap] },
                direction == "row" ? defaultRowStyles() : defaultColStyles(),
            )}
        >
            {children}
        </View>
    );
};
