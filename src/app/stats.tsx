import React from "react";
import { Switch, View } from "react-native";
import { FilterName, Filters, filterMap, useFilteredQsos } from "../lib/components/filters";
import { PageLayout } from "../lib/components/page-layout";
import { QSO } from "../lib/components/qso";
import { Stack } from "../lib/components/stack";
import { sortBands } from "../lib/data/bands";
import { groupBy, sortNumsAndAlpha, unique } from "../lib/utils/arrays";
import { Settings } from "../lib/utils/store";
import { SelectInput } from "../lib/ui/select-input";
import { Typography } from "../lib/ui/typography";
import { useSettings } from "../lib/utils/use-settings";

export const groupQsos = (
    qsos: QSO[],
    first: FilterName,
    second: FilterName = "band",
): Record<string, Record<string, QSO[]>> =>
    Object.fromEntries(
        Object.entries(groupBy(qsos, filterMap[first])).map(([k, qs]) => [k, groupBy(qs, filterMap[second])]),
    );

export const applyFavourites = (values: string[], stat: FilterName, settings: Settings, useFavourites: boolean) => {
    if (!useFavourites || !["band", "mode"].includes(stat)) return values;

    const favourites = {
        band: settings.favouriteBands,
        mode: settings.favouriteModes,
    }[stat] as string[];

    if (favourites.length === 0) return values;

    return values.filter((v) => favourites.includes(v));
};

const Stats = () => {
    const [firstStat, setFirstStat] = React.useState<FilterName>("year");
    const [secondStat, setSecondStat] = React.useState<FilterName>("modeGrouped");
    const [useFavourites, setUseFavourites] = React.useState<boolean>(true);
    const qsos = useFilteredQsos();
    const groups = groupQsos(qsos, firstStat, secondStat);
    const settings = useSettings();

    const secondStatValues = applyFavourites(
        unique(qsos.map((q, i, a) => filterMap[secondStat](q, i, a)).flat()),
        secondStat,
        settings,
        useFavourites,
    ).sort(secondStat === "band" ? sortBands : sortNumsAndAlpha);

    const firstStatValues = applyFavourites(Object.keys(groups), firstStat, settings, useFavourites).sort(
        firstStat === "band" ? sortBands : sortNumsAndAlpha,
    );

    return (
        <PageLayout title="Stats">
            <Stack>
                <Filters />
                <Stack direction="row">
                    <Typography>Left side:</Typography>
                    <SelectInput
                        value={firstStat}
                        onValueChange={(newStatType) => setFirstStat(newStatType)}
                        items={Object.keys(filterMap)
                            .sort()
                            .map((t) => ({ label: t, value: t }))}
                    />
                    <Typography>Top side:</Typography>
                    <SelectInput
                        value={secondStat}
                        onValueChange={(newStatType) => setSecondStat(newStatType)}
                        items={Object.keys(filterMap)
                            .sort()
                            .map((t) => ({ label: t, value: t }))}
                    />
                    <Typography>Use favourites when available</Typography>
                    <Switch value={useFavourites} onValueChange={(v) => setUseFavourites(v)} />
                </Stack>
                <View style={{ flexDirection: "row" }}>
                    <View style={{ paddingRight: 16 }}>
                        <Typography variant="em" numberOfLines={1}>
                            {firstStat}
                        </Typography>
                        {firstStatValues.map((group) => (
                            <Typography variant="em" numberOfLines={1} key={group}>
                                {group}
                            </Typography>
                        ))}
                        <Typography variant="em" numberOfLines={1}>
                            Total
                        </Typography>
                    </View>
                    {secondStatValues.map((v) => (
                        <View style={{ flex: 1 }} key={v}>
                            <Typography variant="em" numberOfLines={1}>
                                {v}
                            </Typography>
                            {firstStatValues.map((group) => (
                                <Typography numberOfLines={1} key={`${group}_${v}`}>
                                    {(groups[group][v] || []).length}
                                </Typography>
                            ))}
                            <Typography numberOfLines={1}>
                                {Object.values(groups)
                                    .map((group) => (group[v] || []).length)
                                    .reduce((acc, curr) => acc + curr, 0)}
                            </Typography>
                        </View>
                    ))}
                    <View style={{ flex: 1 }}>
                        <Typography variant="em" numberOfLines={1}>
                            Total
                        </Typography>
                        {firstStatValues.map((group) => (
                            <Typography numberOfLines={1} key={`${group}_total`}>
                                {Object.values(groups[group]).flat().length}
                            </Typography>
                        ))}
                        <Typography numberOfLines={1}>{qsos.length}</Typography>
                    </View>
                </View>
            </Stack>
        </PageLayout>
    );
};

export default Stats;
