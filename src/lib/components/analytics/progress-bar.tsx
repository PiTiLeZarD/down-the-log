import { View } from "react-native";
import { StyleSheet } from "react-native-unistyles";
import { Typography } from "../../ui/typography";
import { AwardSummary } from "../../utils/award-progress";
import { useAnalyticsColours } from "./colours";

const BAR = 16;

const styles = StyleSheet.create((theme) => ({
    track: {
        height: BAR,
        borderRadius: BAR / 2,
        backgroundColor: theme.colours.grey.light,
        overflow: "hidden",
        position: "relative",
    },
    fill: (pc: number, colour: string) => ({
        width: `${pc}%`,
        // Room for its own label, which a few percent of a phone-width bar doesn't leave.
        minWidth: 44,
        height: "100%",
        borderRadius: BAR / 2,
        backgroundColor: colour,
        justifyContent: "center",
        alignItems: "flex-end",
        paddingRight: theme.margins.lg,
    }),
    fillText: {
        fontSize: BAR - 4,
        lineHeight: BAR,
        fontWeight: "bold",
        color: "#ffffff",
    },
    tick: (pc: number) => ({
        position: "absolute",
        left: `${pc}%`,
        top: BAR / 4,
        bottom: BAR / 4,
        width: 1,
        backgroundColor: theme.colours.grey.dark,
    }),
    legend: {
        flexDirection: "row",
        gap: theme.margins.xxl,
    },
    dot: (colour: string) => ({
        width: 10,
        height: 10,
        borderRadius: 5,
        backgroundColor: colour,
    }),
    legendItem: {
        flexDirection: "row",
        alignItems: "center",
        gap: theme.margins.md,
    },
}));

type BarProps = { value: number; total: number; colour: string; milestones: number[] };

const Bar = ({ value, total, colour, milestones }: BarProps) => {
    const pc = total ? Math.min(100, (value / total) * 100) : 0;
    return (
        <View style={styles.track}>
            {milestones.map((m) => (
                <View key={m} style={styles.tick((m / total) * 100)} />
            ))}
            {value > 0 && (
                <View style={styles.fill(pc, colour)}>
                    <Typography style={styles.fillText}>{Math.round(pc)}%</Typography>
                </View>
            )}
        </View>
    );
};

// Same colours as the map, so worked and confirmed read the same everywhere on the screen.
export type ProgressBarProps = AwardSummary & { milestones: number[] };

export const ProgressBar = ({ worked, confirmed, total, milestones }: ProgressBarProps) => {
    const colours = useAnalyticsColours();
    return (
        <View style={{ gap: 8 }}>
            <Bar value={worked} total={total} colour={colours.status.worked} milestones={milestones} />
            <Bar value={confirmed} total={total} colour={colours.status.confirmed} milestones={milestones} />
            <View style={styles.legend}>
                <View style={styles.legendItem}>
                    <View style={styles.dot(colours.status.confirmed)} />
                    <Typography>Confirmed {confirmed}</Typography>
                </View>
                <View style={styles.legendItem}>
                    <View style={styles.dot(colours.status.worked)} />
                    <Typography>Total worked {worked}</Typography>
                </View>
            </View>
        </View>
    );
};
