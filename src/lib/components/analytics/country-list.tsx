import { useRouter } from "expo-router";
import React from "react";
import { Pressable, View } from "react-native";
import { StyleSheet } from "react-native-unistyles";
import { sortBands } from "../../data/bands";
import { continents } from "../../data/callsigns";
import { mostWanted } from "../../data/clranks";
import { countries } from "../../data/countries";
import { DxccEntity, dxccEntities } from "../../data/cty";
import { useWidthMatches } from "../../ui/breakpoints";
import { Icon } from "../../ui/icon";
import { Input } from "../../ui/input";
import { PaginatedList } from "../../ui/paginated-list";
import { SelectInput } from "../../ui/select-input";
import { Typography } from "../../ui/typography";
import { unique } from "../../utils/arrays";
import {
    EntityLog,
    EntityStatus,
    ModeGroup,
    SlotFilter,
    dxccSummary,
    entityStatus,
    matchingSlots,
    modeGroups,
} from "../../utils/dxcc-progress";
import { useStore } from "../../utils/store";
import { dxcc2label } from "../filters";
import { Stack } from "../stack";
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

type SortKey = "dxcc" | "name" | "continent" | "worked" | "confirmed" | "rank";
type Row = { entity: DxccEntity; status: EntityStatus; qsos: number; rank: number; detail: string };
type StatusFilter = "" | EntityStatus;

const statusItems: { label: string; value: StatusFilter }[] = [
    { label: "All entities", value: "" },
    { label: "Confirmed", value: "confirmed" },
    { label: "Worked", value: "worked" },
    { label: "Not worked", value: "missing" },
];

const statusRank: Record<EntityStatus, number> = { missing: 0, worked: 1, confirmed: 2 };

const sorters: Record<SortKey, (a: Row, b: Row) => number> = {
    dxcc: (a, b) => a.entity.dxcc - b.entity.dxcc,
    name: (a, b) => a.entity.name.localeCompare(b.entity.name),
    continent: (a, b) => a.entity.ctn.localeCompare(b.entity.ctn),
    worked: (a, b) => a.qsos - b.qsos,
    confirmed: (a, b) => statusRank[a.status] - statusRank[b.status],
    // Unranked entities read 0, which belongs at the common end rather than ahead of #1.
    rank: (a, b) => (a.rank || Infinity) - (b.rank || Infinity),
};

// The same three buckets the map colours: worked means worked and still waiting on a QSL.
const matchesStatus = (status: EntityStatus, filter: StatusFilter) => !filter || filter === status;

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

export type CountryListProps = { logs: Map<number, EntityLog> };

export const CountryList = ({ logs }: CountryListProps) => {
    const [search, setSearch] = React.useState<string>("");
    const [band, setBand] = React.useState<string>("");
    const [mode, setMode] = React.useState<string>("");
    const [continent, setContinent] = React.useState<string>("");
    const [status, setStatus] = React.useState<StatusFilter>("");
    const [sort, setSort] = React.useState<[SortKey, boolean]>(["name", true]);
    const wide = useWidthMatches("md");
    const updateFilters = useStore((state) => state.updateFilters);
    const { navigate } = useRouter();

    const filter: SlotFilter = { bands: band ? [band] : undefined, modes: mode ? [mode as ModeGroup] : undefined };
    const bands = unique([...logs.values()].flatMap((l) => l.slots.map((s) => s.band))).sort(sortBands);

    const needle = search.trim().toLowerCase();
    const rows: Row[] = dxccEntities
        .filter((e) => !continent || e.ctn === continent)
        .filter((e) => !needle || e.name.toLowerCase().includes(needle) || String(e.dxcc) === needle)
        .map((entity) => {
            const log = logs.get(entity.dxcc);
            const slots = matchingSlots(log, filter);
            const detail = slots.length
                ? [
                      unique(slots.map((s) => s.mode)).join(", "),
                      unique(slots.map((s) => s.band))
                          .sort(sortBands)
                          .join(", "),
                  ].join(" · ")
                : "";
            return {
                entity,
                status: entityStatus(log, filter),
                qsos: slots.length ? log?.qsos || 0 : 0,
                rank: mostWanted(entity.dxcc),
                detail,
            };
        })
        .filter((r) => matchesStatus(r.status, status))
        .sort((a, b) => sorters[sort[0]](a, b) * (sort[1] ? 1 : -1));

    const tick = (on: boolean) =>
        on ? <Icon name="checkmark-circle" colour="success" /> : <Typography variant="subtitle">—</Typography>;

    return (
        <Stack gap="xl">
            <Input placeholder="Search by name or DXCC #" value={search} onChangeText={setSearch} />
            <View style={styles.filters}>
                <SelectInput value={status} onValueChange={(v) => setStatus(v as StatusFilter)} items={statusItems} />
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
                <SelectInput
                    value={continent}
                    onValueChange={setContinent}
                    items={[
                        { label: "All continents", value: "" },
                        ...Object.entries(continents).map(([code, name]) => ({ label: name, value: code })),
                    ]}
                />
            </View>
            <SummaryTiles {...dxccSummary(logs, filter)} />
            <View style={styles.count}>
                <Typography>
                    <Typography variant="em">{rows.length}</Typography> entities match
                </Typography>
            </View>
            <View>
                <View style={styles.row(false)}>
                    <Header label="#" sortKey="dxcc" sort={sort} onSort={setSort} flex={0.6} />
                    <Header label="Entity" sortKey="name" sort={sort} onSort={setSort} flex={3} />
                    {wide && <Header label="Cont." sortKey="continent" sort={sort} onSort={setSort} flex={0.7} />}
                    <Header label="Worked" sortKey="worked" sort={sort} onSort={setSort} flex={1} />
                    <Header label="Conf." sortKey="confirmed" sort={sort} onSort={setSort} flex={0.8} />
                    <Header label="Wanted" sortKey="rank" sort={sort} onSort={setSort} flex={0.9} />
                    {wide && (
                        <Typography variant="em" style={{ flex: 3 }}>
                            Modes · Bands
                        </Typography>
                    )}
                </View>
                <PaginatedList itemsPerPage={50} whenEmpty={<Typography>No entity matches.</Typography>}>
                    {rows.map(({ entity, status, qsos, rank, detail }, i) => (
                        <Pressable
                            key={entity.dxcc}
                            style={styles.row(i % 2 === 0)}
                            disabled={status === "missing"}
                            onPress={() => {
                                updateFilters([{ name: "dxcc", values: [dxcc2label(entity.dxcc)] }]);
                                navigate("/");
                            }}
                        >
                            <Typography style={{ flex: 0.6 }}>{entity.dxcc}</Typography>
                            <Typography style={{ flex: 3 }} underline={status !== "missing"} numberOfLines={1}>
                                {(entity.iso3 && countries[entity.iso3]?.flag) || ""} {entity.name}
                            </Typography>
                            {wide && <Typography style={{ flex: 0.7 }}>{entity.ctn}</Typography>}
                            <View style={{ flex: 1, flexDirection: "row", alignItems: "center", gap: 4 }}>
                                {tick(status !== "missing")}
                                {qsos > 0 && <Typography variant="subtitle">{qsos}</Typography>}
                            </View>
                            <View style={{ flex: 0.8 }}>{tick(status === "confirmed")}</View>
                            <Typography style={{ flex: 0.9 }}>{rank || "—"}</Typography>
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
