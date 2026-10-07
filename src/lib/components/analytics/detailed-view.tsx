import { ScrollView, View } from "react-native";
import { StyleSheet } from "react-native-unistyles";
import { sortBands } from "../../data/bands";
import { Typography } from "../../ui/typography";
import { unique } from "../../utils/arrays";
import { EntityLog, SlotFilter, dxccSummary, modeGroups } from "../../utils/dxcc-progress";

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

export type DetailedViewProps = { logs: Map<number, EntityLog> };

/** Entity counts for the whole log, each mode group and each band worked, side by side. */
export const DetailedView = ({ logs }: DetailedViewProps) => {
    const bands = unique([...logs.values()].flatMap((l) => l.slots.map((s) => s.band))).sort(sortBands);
    const columns: Column[] = [
        { label: "All", filter: {} },
        ...modeGroups.map((m) => ({ label: m === "Data" ? "Digital" : m, filter: { modes: [m] } })),
        ...bands.map((b) => ({ label: b, filter: { bands: [b] } })),
    ];
    const summaries = columns.map((c) => dxccSummary(logs, c.filter));
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
