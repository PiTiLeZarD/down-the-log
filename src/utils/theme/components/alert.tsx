import React from "react";
import { createStyleSheet, useStyles } from "react-native-unistyles";
import { Stack } from "../../stack";
import { ColourVariant } from "../theme";
import { Icon, IconName } from "./icon";

type Severity = "info" | "warning" | "success";

const stylesheet = createStyleSheet((theme) => ({
    container: (severity: Severity) => ({
        backgroundColor:
            theme.colours[{ info: "primary", warning: "secondary", success: "success" }[severity] as ColourVariant][
                theme.shades.light
            ],
        borderRadius: theme.margins.md,
        margin: theme.margins.md,
        paddingTop: theme.margins.lg,
        paddingBottom: theme.margins.lg,
        paddingLeft: theme.margins.xxl,
        paddingRight: theme.margins.xxl,
    }),
}));

export type AlertProps = {
    severity?: Severity;
};

export type AlertComponent = React.FC<React.PropsWithChildren<AlertProps>>;

export const Alert: AlertComponent = ({ severity = "warning", children }): JSX.Element => {
    const { styles } = useStyles(stylesheet);
    return (
        <Stack direction="row" gap="xxl" style={styles.container(severity)}>
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
