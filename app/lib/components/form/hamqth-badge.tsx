import { StyleSheet } from "react-native-unistyles";
import { HamQTHStatus } from "../../utils/hamqth";
import { Icon, IconName } from "../../ui/icon";
import { ColourVariant } from "../../ui/theme";
import { Typography } from "../../ui/typography";
import { Stack } from "../stack";

// A theme value can't be used as a lookup key inside `StyleSheet.create` (unistyles hands back CSS
// variables on web), so every variant is baked out and picked by name below.
const styles = StyleSheet.create((theme) => ({
    primary: { color: theme.colours.primary.dark },
    secondary: { color: theme.colours.secondary.dark },
    grey: { color: theme.colours.grey.dark },
    success: { color: theme.colours.success.dark },
    danger: { color: theme.colours.danger.dark },
}));

const appearance: Record<Exclude<HamQTHStatus, "idle">, { icon: IconName; colour: ColourVariant; hint: string }> = {
    loading: { icon: "sync", colour: "grey", hint: "Looking up on HamQTH…" },
    found: { icon: "checkmark-circle", colour: "success", hint: "Details filled in from HamQTH" },
    "not-found": { icon: "person-remove", colour: "primary", hint: "No HamQTH profile for this callsign" },
    auth: { icon: "key", colour: "danger", hint: "HamQTH rejected your credentials — check them in settings" },
    offline: { icon: "cloud-offline", colour: "danger", hint: "Can't reach HamQTH" },
    error: { icon: "alert-circle", colour: "danger", hint: "HamQTH lookup failed" },
};

export type HamQTHBadgeProps = {
    status: HamQTHStatus;
};

export const HamQTHBadge = ({ status }: HamQTHBadgeProps) => {
    if (status === "idle") return <></>;

    const { icon, colour, hint } = appearance[status];

    return (
        <Stack direction="row" gap="xs" style={{ height: "100%" }}>
            <Icon name={icon} colour={colour} size={16} accessibilityLabel={hint} />
            <Typography variant="em" style={styles[colour]}>
                HamQTH
            </Typography>
        </Stack>
    );
};
