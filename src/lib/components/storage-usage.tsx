import { View } from "react-native";
import { StyleSheet } from "react-native-unistyles";
import { Button } from "../ui/button";
import { ColourVariant } from "../ui/theme";
import { Typography } from "../ui/typography";
import { formatBytes, useStorageUsage } from "../utils/use-storage-usage";
import { Stack } from "./stack";

const styles = StyleSheet.create((theme) => ({
    track: {
        height: 12,
        borderRadius: 6,
        overflow: "hidden",
        backgroundColor: theme.colours.grey.light,
    },
    // Everything sits on the full width of the tab rather than bunching up on the left: the row ends
    // anchor to the bar's ends, so the figures read against the part of the bar they describe.
    row: {
        width: "100%",
        justifyContent: "space-between",
    },
    // The fill is clamped to the track: a browser can refuse a write before the reported figure
    // reaches the assumed quota, and a bar poking out the side reads as a bug rather than a warning.
    fill: (ratio: number, colour: ColourVariant) => ({
        height: "100%",
        width: `${Math.min(Math.max(ratio, 0), 1) * 100}%`,
        backgroundColor: theme.colours[colour].dark,
    }),
}));

const colourFor = (ratio: number): ColourVariant => (ratio >= 0.9 ? "danger" : ratio >= 0.7 ? "secondary" : "success");

export const StorageUsage = () => {
    const { usage, refresh } = useStorageUsage();
    if (!usage) return <></>;

    const { used, quota } = usage;
    const ratio = quota ? used / quota : 0;
    const percent = Math.round(ratio * 100);

    return (
        <Stack gap="lg">
            <Stack direction="row" gap="xxl" style={styles.row}>
                <Typography underline>Storage Used:</Typography>
                <View>
                    <Button text="Refresh" variant="outlined" colour="grey" onPress={refresh} />
                </View>
            </Stack>
            {quota != undefined && (
                <View style={styles.track}>
                    <View style={styles.fill(ratio, colourFor(ratio))} />
                </View>
            )}
            <Stack direction="row" gap="xxl" style={styles.row}>
                <Typography>
                    {quota != undefined
                        ? `${formatBytes(used)} of ${formatBytes(quota)}`
                        : `${formatBytes(used)} used`}
                </Typography>
                {quota != undefined && <Typography>{percent}%</Typography>}
            </Stack>
            {quota != undefined && (
                <Typography variant="subtitle">
                    Your log, settings and cached reference data live in this browser&apos;s storage, which is capped at
                    around {formatBytes(quota)}. Once it is full, new QSOs stop being saved — export your log to ADIF
                    regularly, and delete QSOs you no longer need if you get close.
                </Typography>
            )}
            {quota == undefined && (
                <Typography variant="subtitle">
                    Your log, settings and cached reference data live on this device. There is no fixed cap here, but
                    exporting to ADIF regularly is still the only backup.
                </Typography>
            )}
        </Stack>
    );
};
