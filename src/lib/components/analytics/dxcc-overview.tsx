import { useRouter } from "expo-router";
import React from "react";
import { View } from "react-native";
import Svg, { Circle } from "react-native-svg";
import { StyleSheet } from "react-native-unistyles";
import { sortBands } from "../../data/bands";
import { countries } from "../../data/countries";
import { entities } from "../../data/cty";
import { Button } from "../../ui/button";
import { SelectInput } from "../../ui/select-input";
import { Typography } from "../../ui/typography";
import { unique } from "../../utils/arrays";
import {
    DxccSummary,
    EntityLog,
    ModeGroup,
    SlotFilter,
    dxccSummary,
    entityStatus,
    matchingSlots,
} from "../../utils/dxcc-progress";
import { useStore } from "../../utils/store";
import { dxcc2label } from "../filters";
import { Stack } from "../stack";
import { useAnalyticsColours } from "./colours";
import { DetailedView } from "./detailed-view";
import { DxccMap } from "./dxcc-map";
import { DxccProgressBar } from "./dxcc-progress-bar";
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

const Donut = ({ worked, confirmed, total }: DxccSummary) => {
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

export type DxccOverviewProps = { logs: Map<number, EntityLog> };

export const DxccOverview = ({ logs }: DxccOverviewProps) => {
    const [mode, setMode] = React.useState<ModeGroup | undefined>(undefined);
    const [band, setBand] = React.useState<string>("");
    const [selected, setSelected] = React.useState<number | undefined>(undefined);
    const updateFilters = useStore((state) => state.updateFilters);
    const { navigate } = useRouter();

    const filter: SlotFilter = { modes: mode ? [mode] : undefined, bands: band ? [band] : undefined };
    const summary = dxccSummary(logs, filter);
    const bands = unique([...logs.values()].flatMap((l) => l.slots.map((s) => s.band))).sort(sortBands);

    const selectedEntity = selected !== undefined ? entities[selected] : undefined;
    const selectedSlots = matchingSlots(logs.get(selected ?? 0), filter);
    const selectedStatus = entityStatus(logs.get(selected ?? 0), filter);

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
                <DxccMap
                    status={(dxcc) => entityStatus(logs.get(dxcc), filter)}
                    selected={selected}
                    onSelect={(dxcc) => setSelected(dxcc === selected ? undefined : dxcc)}
                />
                <View style={styles.footer}>
                    <Donut {...summary} />
                    {selectedEntity && (
                        <View style={styles.selected}>
                            <Typography variant="em">
                                {(selectedEntity.iso3 && countries[selectedEntity.iso3]?.flag) || ""}{" "}
                                {selectedEntity.name} ({selectedEntity.dxcc})
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
                                        onPress={() => {
                                            updateFilters([{ name: "dxcc", values: [dxcc2label(selected)] }]);
                                            navigate("/");
                                        }}
                                    />
                                </View>
                            )}
                        </View>
                    )}
                </View>
            </View>
            <View style={styles.section}>
                <Typography variant="h4">DXCC progress</Typography>
                <DxccProgressBar {...summary} />
            </View>
            <View style={styles.section}>
                <Typography variant="h4">Detailed view</Typography>
                <DetailedView logs={logs} />
            </View>
        </Stack>
    );
};
