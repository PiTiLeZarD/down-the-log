import React from "react";
import { Pressable, View } from "react-native";
import { StyleSheet } from "react-native-unistyles";
import { sortBands } from "../../data/bands";
import { useWidthMatches } from "../../ui/breakpoints";
import { Icon } from "../../ui/icon";
import { Input } from "../../ui/input";
import { PaginatedList } from "../../ui/paginated-list";
import { SelectInput } from "../../ui/select-input";
import { Typography } from "../../ui/typography";
import { unique } from "../../utils/arrays";
import {
    ModeGroup,
    SlotFilter,
    UnitLogs,
    UnitStatus,
    awardSummary,
    bandsWorked,
    matchingSlots,
    modeGroups,
    unitStatus,
} from "../../utils/award-progress";
import { Award, AwardUnit } from "../../utils/awards";
import { Stack } from "../stack";
import { useShowInLog } from "./show-in-log";
import { SummaryTiles } from "./summary-tiles";

const styles = StyleSheet.create((theme) => ({
    filters: {
        flexDirection: "row",
        flexWrap: "wrap",
        gap: theme.margins.lg,
    },
    row: (odd: boolean) => ({
        flexDirection: "row",
        alignItems: "center",
        gap: theme.margins.lg,
        paddingTop: theme.margins.lg,
        paddingBottom: theme.margins.lg,
        paddingLeft: theme.margins.md,
        backgroundColor: odd ? theme.colours.grey.light : "transparent",
    }),
    count: {
        alignSelf: "center",
        padding: theme.margins.lg,
        paddingLeft: theme.margins.xxl,
        paddingRight: theme.margins.xxl,
        borderRadius: theme.margins.lg,
        borderWidth: 1,
        borderColor: theme.colours.grey.main,
    },
}));

type SortKey = "code" | "name" | "group" | "worked" | "confirmed" | "rank";
type Row = { unit: AwardUnit; status: UnitStatus; qsos: number; detail: string };
type StatusFilter = "" | UnitStatus;

const statusRank: Record<UnitStatus, number> = { missing: 0, worked: 1, confirmed: 2 };

const sorters: Record<SortKey, (a: Row, b: Row) => number> = {
    // Numeric-aware, so DXCC 9 sorts ahead of 10 and VK2 ahead of VK10 if there ever is one.
    code: (a, b) => (a.unit.code || "").localeCompare(b.unit.code || "", undefined, { numeric: true }),
    name: (a, b) => a.unit.name.localeCompare(b.unit.name),
    group: (a, b) => (a.unit.group || "").localeCompare(b.unit.group || ""),
    worked: (a, b) => a.qsos - b.qsos,
    confirmed: (a, b) => statusRank[a.status] - statusRank[b.status],
    // Unranked units belong at the common end rather than ahead of #1.
    rank: (a, b) => (a.unit.rank || Infinity) - (b.unit.rank || Infinity),
};

// The same three buckets the map colours: worked means worked and still waiting on a QSL.
const matchesStatus = (status: UnitStatus, filter: StatusFilter) => !filter || filter === status;

type HeaderProps = {
    label: string;
    sortKey: SortKey;
    sort: [SortKey, boolean];
    onSort: (sort: [SortKey, boolean]) => void;
    flex: number;
};

const Header = ({ label, sortKey, sort: [key, ascending], onSort, flex }: HeaderProps) => (
    <Pressable style={{ flex }} onPress={() => onSort([sortKey, key === sortKey ? !ascending : true])}>
        <Typography variant="em" numberOfLines={1}>
            {label} {key === sortKey ? (ascending ? "▲" : "▼") : ""}
        </Typography>
    </Pressable>
);

export type UnitListProps = { award: Award; logs: UnitLogs };

export const UnitList = ({ award, logs }: UnitListProps) => {
    const [search, setSearch] = React.useState<string>("");
    const [band, setBand] = React.useState<string>("");
    const [mode, setMode] = React.useState<string>("");
    const [group, setGroup] = React.useState<string>("");
    const [status, setStatus] = React.useState<StatusFilter>("");
    const [sort, setSort] = React.useState<[SortKey, boolean]>(
        // DXCC numbers say nothing on their own; the other awards' codes read in order.
        [award.key === "dxcc" ? "name" : "code", true],
    );
    const wide = useWidthMatches("md");
    const showInLog = useShowInLog(award.key);
    const ranked = award.units.some((u) => u.rank);

    const filter: SlotFilter = { bands: band ? [band] : undefined, modes: mode ? [mode as ModeGroup] : undefined };
    const bands = bandsWorked(logs).sort(sortBands);

    const needle = search.trim().toLowerCase();
    const rows: Row[] = award.units
        .filter((u) => !group || u.group === group)
        .filter((u) => !needle || u.name.toLowerCase().includes(needle) || u.code?.toLowerCase() === needle)
        .map((unit) => {
            const log = logs.get(unit.id);
            const slots = matchingSlots(log, filter);
            const detail = slots.length
                ? [
                      unique(slots.map((s) => s.mode)).join(", "),
                      unique(slots.map((s) => s.band))
                          .sort(sortBands)
                          .join(", "),
                  ].join(" · ")
                : "";
            return { unit, status: unitStatus(log, filter), qsos: slots.length ? log?.qsos || 0 : 0, detail };
        })
        .filter((r) => matchesStatus(r.status, status))
        .sort((a, b) => sorters[sort[0]](a, b) * (sort[1] ? 1 : -1));

    const tick = (on: boolean) =>
        on ? <Icon name="checkmark-circle" colour="success" /> : <Typography variant="subtitle">—</Typography>;

    return (
        <Stack gap="xl">
            <Input placeholder="Search by name or code" value={search} onChangeText={setSearch} />
            <View style={styles.filters}>
                <SelectInput
                    value={status}
                    onValueChange={(v) => setStatus(v as StatusFilter)}
                    items={[
                        { label: `All ${award.unitName}`, value: "" },
                        { label: "Confirmed", value: "confirmed" },
                        { label: "Worked", value: "worked" },
                        { label: "Not worked", value: "missing" },
                    ]}
                />
                <SelectInput
                    value={band}
                    onValueChange={setBand}
                    items={[{ label: "All bands", value: "" }, ...bands.map((b) => ({ label: b, value: b }))]}
                />
                <SelectInput
                    value={mode}
                    onValueChange={setMode}
                    items={[
                        { label: "All modes", value: "" },
                        ...modeGroups.map((m) => ({ label: m === "Data" ? "Digital" : m, value: m })),
                    ]}
                />
                {award.groups && (
                    <SelectInput
                        value={group}
                        onValueChange={setGroup}
                        items={[
                            { label: "All continents", value: "" },
                            ...Object.entries(award.groups).map(([code, name]) => ({ label: name, value: code })),
                        ]}
                    />
                )}
            </View>
            <SummaryTiles {...awardSummary(logs, award.units.length, filter)} />
            <View style={styles.count}>
                <Typography>
                    <Typography variant="em">{rows.length}</Typography> {award.unitName} match
                </Typography>
            </View>
            <View>
                <View style={styles.row(false)}>
                    <Header label="#" sortKey="code" sort={sort} onSort={setSort} flex={0.6} />
                    <Header label="Name" sortKey="name" sort={sort} onSort={setSort} flex={3} />
                    {wide && award.groups && (
                        <Header label="Cont." sortKey="group" sort={sort} onSort={setSort} flex={0.7} />
                    )}
                    <Header label="Worked" sortKey="worked" sort={sort} onSort={setSort} flex={1} />
                    <Header label="Conf." sortKey="confirmed" sort={sort} onSort={setSort} flex={0.8} />
                    {ranked && <Header label="Wanted" sortKey="rank" sort={sort} onSort={setSort} flex={0.9} />}
                    {wide && (
                        <Typography variant="em" style={{ flex: 3 }}>
                            Modes · Bands
                        </Typography>
                    )}
                </View>
                <PaginatedList itemsPerPage={50} whenEmpty={<Typography>Nothing matches.</Typography>}>
                    {rows.map(({ unit, status, qsos, detail }, i) => (
                        <Pressable
                            key={unit.id}
                            style={styles.row(i % 2 === 0)}
                            disabled={status === "missing"}
                            onPress={() => showInLog(unit.id)}
                        >
                            <Typography style={{ flex: 0.6 }}>{unit.code}</Typography>
                            <Typography style={{ flex: 3 }} underline={status !== "missing"} numberOfLines={1}>
                                {unit.flag ? `${unit.flag} ` : ""}
                                {unit.name}
                            </Typography>
                            {wide && award.groups && <Typography style={{ flex: 0.7 }}>{unit.group}</Typography>}
                            <View style={{ flex: 1, flexDirection: "row", alignItems: "center", gap: 4 }}>
                                {tick(status !== "missing")}
                                {qsos > 0 && <Typography variant="subtitle">{qsos}</Typography>}
                            </View>
                            <View style={{ flex: 0.8 }}>{tick(status === "confirmed")}</View>
                            {ranked && <Typography style={{ flex: 0.9 }}>{unit.rank || "—"}</Typography>}
                            {wide && (
                                <Typography style={{ flex: 3 }} numberOfLines={1}>
                                    {detail || "—"}
                                </Typography>
                            )}
                        </Pressable>
                    ))}
                </PaginatedList>
            </View>
        </Stack>
    );
};
