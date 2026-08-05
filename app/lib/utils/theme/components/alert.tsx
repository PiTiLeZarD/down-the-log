import { PropsWithChildren } from "react";
import { ViewStyle } from "react-native";
import { StyleSheet } from "react-native-unistyles";
import { Stack } from "../../../components/stack";
import { ColourVariant } from "../theme";
import { Icon, IconName } from "./icon";
import { Styles, mergeStyles } from "./styles";

type Severity = "info" | "warning" | "success";

const styles = StyleSheet.create((theme) => ({
    container: (severity: Severity) => ({
        backgroundColor:
            theme.colours[{ info: "primary", warning: "secondary", success: "success" }[severity] as ColourVariant].light,
        borderRadius: theme.margins.md,
        margin: theme.margins.md,
        paddingTop: theme.margins.lg,
        paddingBottom: theme.margins.lg,
        paddingLeft: theme.margins.xxl,
        paddingRight: theme.margins.xxl,
        overflow: "hidden",
    }),
}));

export type AlertProps = PropsWithChildren<{
    style?: Styles<ViewStyle>;
    severity?: Severity;
}>;

export const Alert = ({ style, severity = "warning", children }: AlertProps) => {
    return (
        <Stack direction="row" gap="xxl" style={mergeStyles<ViewStyle>(styles.container(severity), style)}>
            <Icon
                name={
                    {
                        info: "information-circle-outline",
                        warning: "warning-outline",
                        success: "checkmark-circle-outline",
                    }[severity] as IconName
                }
            />
            {children}
        </Stack>
    );
};
