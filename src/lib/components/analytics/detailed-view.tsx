import { ScrollView, View } from "react-native";
import { StyleSheet } from "react-native-unistyles";
import { sortBands } from "../../data/bands";
import { Typography } from "../../ui/typography";
import { SlotFilter, UnitLogs, awardSummary, bandsWorked, modeGroups } from "../../utils/award-progress";

const CELL = 64;

const styles = StyleSheet.create((theme) => ({
    row: (odd: boolean) => ({
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: odd ? theme.colours.grey.light : "transparent",
        paddingTop: theme.margins.md,
        paddingBottom: theme.margins.md,
    }),
    label: {
        width: 170,
        paddingLeft: theme.margins.lg,
    },
    cell: {
        width: CELL,
        textAlign: "center",
    },
}));

type Column = { label: string; filter: SlotFilter };

export type DetailedViewProps = { logs: UnitLogs; total: number };

/** Unit counts for the whole log, each mode group and each band worked, side by side. */
export const DetailedView = ({ logs, total }: DetailedViewProps) => {
    const bands = bandsWorked(logs).sort(sortBands);
    const columns: Column[] = [
        { label: "All", filter: {} },
        ...modeGroups.map((m) => ({ label: m === "Data" ? "Digital" : m, filter: { modes: [m] } })),
        ...bands.map((b) => ({ label: b, filter: { bands: [b] } })),
    ];
    const summaries = columns.map((c) => awardSummary(logs, total, c.filter));
    const rows = [
        { label: "Total worked", value: (i: number) => summaries[i].worked },
        { label: "Confirmed", value: (i: number) => summaries[i].confirmed },
        { label: "Worked", value: (i: number) => summaries[i].worked - summaries[i].confirmed },
    ];

    return (
        <ScrollView horizontal>
            <View>
                <View style={styles.row(false)}>
                    <View style={styles.label} />
                    {columns.map((c) => (
                        <Typography key={c.label} variant="em" style={styles.cell}>
                            {c.label}
                        </Typography>
                    ))}
                </View>
                {rows.map((r, ri) => (
                    <View key={r.label} style={styles.row(ri % 2 === 0)}>
                        <Typography variant="em" style={styles.label}>
                            {r.label}
                        </Typography>
                        {columns.map((c, i) => (
                            <Typography key={c.label} style={styles.cell}>
                                {r.value(i)}
                            </Typography>
                        ))}
                    </View>
                ))}
            </View>
        </ScrollView>
    );
};
