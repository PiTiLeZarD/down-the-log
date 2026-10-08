import React from "react";
import { View } from "react-native";
import Svg, { Circle } from "react-native-svg";
import { StyleSheet } from "react-native-unistyles";
import { sortBands } from "../../data/bands";
import { Button } from "../../ui/button";
import { SelectInput } from "../../ui/select-input";
import { Typography } from "../../ui/typography";
import { unique } from "../../utils/arrays";
import {
    AwardSummary,
    ModeGroup,
    SlotFilter,
    UnitLogs,
    awardSummary,
    bandsWorked,
    matchingSlots,
    unitStatus,
} from "../../utils/award-progress";
import { Award } from "../../utils/awards";
import { Stack } from "../stack";
import { AwardMap } from "./award-map";
import { useAnalyticsColours } from "./colours";
import { DetailedView } from "./detailed-view";
import { ProgressBar } from "./progress-bar";
import { useShowInLog } from "./show-in-log";
import { SummaryTiles } from "./summary-tiles";

const DONUT = 72;
const RING = 10;

const styles = StyleSheet.create((theme) => ({
    section: {
        gap: theme.margins.xl,
        padding: theme.margins.xl,
        borderRadius: theme.margins.xl,
        borderWidth: 1,
        borderColor: theme.colours.grey.main,
        backgroundColor: theme.background,
    },
    filters: {
        flexDirection: "row",
        flexWrap: "wrap",
        alignItems: "center",
        gap: theme.margins.lg,
    },
    modeButton: {
        flex: 0,
        minWidth: 80,
    },
    footer: {
        flexDirection: "row",
        flexWrap: "wrap",
        alignItems: "center",
        gap: theme.margins.xxl,
    },
    legendItem: {
        flexDirection: "row",
        alignItems: "center",
        gap: theme.margins.md,
    },
    selected: {
        flexGrow: 1,
        alignItems: "flex-end",
        gap: theme.margins.md,
    },
}));

const modeButtons: { label: string; mode?: ModeGroup }[] = [
    { label: "All" },
    { label: "CW", mode: "CW" },
    { label: "Digital", mode: "Data" },
    { label: "Phone", mode: "Phone" },
];

const Donut = ({ worked, confirmed, total }: AwardSummary) => {
    const colours = useAnalyticsColours();
    const r = (DONUT - RING) / 2;
    const circumference = 2 * Math.PI * r;
    const arc = (n: number) => `${(n / total) * circumference} ${circumference}`;
    const legend: [string, string][] = [
        [colours.status.worked, `Worked: ${worked - confirmed}`],
        [colours.status.confirmed, `Confirmed: ${confirmed}`],
        [colours.status.missing, `Total: ${total}`],
    ];
    return (
        <Stack direction="row" gap="lg">
            <View style={{ width: DONUT, height: DONUT, alignItems: "center", justifyContent: "center" }}>
                <Svg width={DONUT} height={DONUT} style={{ position: "absolute" }}>
                    {/* Drawn from twelve o'clock: confirmed over worked over the rest. */}
                    {[
                        [colours.status.missing, total],
                        [colours.status.worked, worked],
                        [colours.status.confirmed, confirmed],
                    ].map(([colour, n]) => (
                        <Circle
                            key={colour}
                            cx={DONUT / 2}
                            cy={DONUT / 2}
                            r={r}
                            fill="none"
                            stroke={colour as string}
                            strokeWidth={RING}
                            strokeDasharray={arc(n as number)}
                            transform={`rotate(-90 ${DONUT / 2} ${DONUT / 2})`}
                        />
                    ))}
                </Svg>
                <Typography variant="em">{confirmed}</Typography>
                <Typography variant="subtitle">/{total}</Typography>
            </View>
            <Stack gap="xs">
                {legend.map(([colour, label]) => (
                    <View key={label} style={styles.legendItem}>
                        <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: colour }} />
                        <Typography variant="subtitle">{label}</Typography>
                    </View>
                ))}
            </Stack>
        </Stack>
    );
};

export type AwardOverviewProps = { award: Award; logs: UnitLogs };

export const AwardOverview = ({ award, logs }: AwardOverviewProps) => {
    const [mode, setMode] = React.useState<ModeGroup | undefined>(undefined);
    const [band, setBand] = React.useState<string>("");
    const [selected, setSelected] = React.useState<string | undefined>(undefined);
    const showInLog = useShowInLog(award.key);

    const filter: SlotFilter = { modes: mode ? [mode] : undefined, bands: band ? [band] : undefined };
    const summary = awardSummary(logs, award.units.length, filter);
    const bands = bandsWorked(logs).sort(sortBands);

    const selectedUnit = award.units.find((u) => u.id === selected);
    const selectedLog = selected ? logs.get(selected) : undefined;
    const selectedSlots = matchingSlots(selectedLog, filter);
    const selectedStatus = unitStatus(selectedLog, filter);

    return (
        <Stack gap="xl">
            <View style={styles.section}>
                <Typography variant="h4">Map</Typography>
                <View style={styles.filters}>
                    {modeButtons.map((b) => (
                        <Button
                            key={b.label}
                            text={b.label}
                            variant={mode === b.mode ? "contained" : "outlined"}
                            style={styles.modeButton}
                            onPress={() => setMode(b.mode)}
                        />
                    ))}
                    <SelectInput
                        value={band}
                        onValueChange={(v) => setBand(v)}
                        items={[{ label: "All bands", value: "" }, ...bands.map((b) => ({ label: b, value: b }))]}
                    />
                </View>
                <SummaryTiles {...summary} />
                <AwardMap
                    award={award.key}
                    status={(id) => unitStatus(logs.get(id), filter)}
                    selected={selected}
                    onSelect={(id) => setSelected(id === selected ? undefined : id)}
                />
                <View style={styles.footer}>
                    <Donut {...summary} />
                    {selectedUnit && (
                        <View style={styles.selected}>
                            <Typography variant="em">
                                {selectedUnit.flag ? `${selectedUnit.flag} ` : ""}
                                {selectedUnit.name} ({selectedUnit.code})
                            </Typography>
                            <Typography variant="subtitle">
                                {selectedStatus === "missing"
                                    ? "Not worked yet"
                                    : `${selectedStatus === "confirmed" ? "Confirmed" : "Worked"} on ${unique(
                                          selectedSlots.map((s) => s.band),
                                      )
                                          .sort(sortBands)
                                          .join(", ")}`}
                            </Typography>
                            {selectedStatus !== "missing" && (
                                <View>
                                    <Button
                                        variant="chip"
                                        text="Show in log"
                                        onPress={() => showInLog(selectedUnit.id)}
                                    />
                                </View>
                            )}
                        </View>
                    )}
                </View>
            </View>
            <View style={styles.section}>
                <Typography variant="h4">{award.label} progress</Typography>
                <ProgressBar {...summary} milestones={award.milestones} />
            </View>
            <View style={styles.section}>
                <Typography variant="h4">Detailed view</Typography>
                <DetailedView logs={logs} total={award.units.length} />
            </View>
        </Stack>
    );
};
