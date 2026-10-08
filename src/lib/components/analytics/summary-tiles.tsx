import { View } from "react-native";
import { StyleSheet } from "react-native-unistyles";
import { Typography } from "../../ui/typography";
import { AwardSummary } from "../../utils/award-progress";

const styles = StyleSheet.create((theme) => ({
    tiles: {
        flexDirection: "row",
        flexWrap: "wrap",
        gap: theme.margins.lg,
    },
    tile: {
        flexGrow: 1,
        flexBasis: 150,
        padding: theme.margins.xl,
        borderRadius: theme.margins.lg,
        borderWidth: 1,
        borderColor: theme.colours.grey.main,
        backgroundColor: theme.background,
        justifyContent: "space-between",
        gap: theme.margins.lg,
    },
    value: {
        flexDirection: "row",
        alignItems: "baseline",
        gap: theme.margins.lg,
    },
    number: {
        fontSize: theme.components.typography.fontSize * 2,
        fontWeight: "bold",
    },
    percent: {
        color: theme.colours.success.main,
        fontWeight: "bold",
    },
}));

const percent = (n: number, of: number) => (of ? `${Math.round((n / of) * 100)}%` : "0%");

type TileProps = { title: string; value: number; of?: number };

const Tile = ({ title, value, of }: TileProps) => (
    <View style={styles.tile}>
        <Typography variant="subtitle">{title}</Typography>
        <View style={styles.value}>
            <Typography style={styles.number}>{value}</Typography>
            {of !== undefined && <Typography style={styles.percent}>{percent(value, of)}</Typography>}
        </View>
    </View>
);

export const SummaryTiles = ({ worked, confirmed, total }: AwardSummary) => (
    <View style={styles.tiles}>
        <Tile title="Total worked" value={worked} of={total} />
        <Tile title="Confirmed" value={confirmed} of={total} />
        <Tile title="Missing" value={total - worked} of={total} />
        {/* Worked as the map colours it, still waiting on a QSL; out of the total worked. */}
        <Tile title="Worked" value={worked - confirmed} of={worked} />
    </View>
);
