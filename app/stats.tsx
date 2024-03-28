import React from "react";
import { Switch } from "react-native";
import { FilterName, Filters, filterMap, filterQsos } from "./lib/components/filters";
import { Grid } from "./lib/components/grid";
import { PageLayout } from "./lib/components/page-layout";
import { QSO, useQsos } from "./lib/components/qso";
import { Stack } from "./lib/components/stack";
import { sortBands } from "./lib/data/bands";
import { groupBy, sortNumsAndAlpha, unique } from "./lib/utils/arrays";
import { Settings, useStore } from "./lib/utils/store";
import { SelectInput } from "./lib/utils/theme/components/select-input";
import { Typography } from "./lib/utils/theme/components/typography";
import { useSettings } from "./lib/utils/use-settings";

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

export type StatsProps = {};

export type StatsComponent = React.FC<StatsProps>;

const Stats: StatsComponent = (): JSX.Element => {
    const [firstStat, setFirstStat] = React.useState<FilterName>("year");
    const [secondStat, setSecondStat] = React.useState<FilterName>("modeGrouped");
    const [useFavourites, setUseFavourites] = React.useState<boolean>(true);
    const qsosFilters = useStore((state) => state.filters);
    const qsos = filterQsos(useQsos(), qsosFilters);
    const groups = groupQsos(qsos, firstStat, secondStat);
    const settings = useSettings();

    const secondStatValues = applyFavourites(
        unique(qsos.map((q, i, a) => filterMap[secondStat](q, i, a)).flat()),
        secondStat,
        settings,
        useFavourites,
    ).sort(secondStat === "band" ? sortBands : sortNumsAndAlpha);

    const columns = secondStatValues.length + 2;

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
                <Grid container>
                    <Grid item columns={columns} xs={1}>
                        <Typography variant="em">{firstStat}</Typography>
                    </Grid>
                    {secondStatValues.map((v) => (
                        <Grid item columns={columns} xs={1} key={v}>
                            <Typography variant="em">{v}</Typography>
                        </Grid>
                    ))}
                    <Grid item columns={columns} xs={1}>
                        <Typography variant="em">Total</Typography>
                    </Grid>
                </Grid>
                {applyFavourites(Object.keys(groups), firstStat, settings, useFavourites)
                    .sort(firstStat === "band" ? sortBands : sortNumsAndAlpha)
                    .map((group) => (
                        <Grid container key={group}>
                            <Grid item columns={columns} xs={1}>
                                <Typography variant="em">{group}</Typography>
                            </Grid>
                            {secondStatValues.map((v) => (
                                <Grid item columns={columns} xs={1} key={`${group}_${v}`}>
                                    <Typography>{(groups[group][v] || []).length}</Typography>
                                </Grid>
                            ))}
                            <Grid item columns={columns} xs={1}>
                                <Typography>{Object.values(groups[group]).flat().length}</Typography>
                            </Grid>
                        </Grid>
                    ))}
                <Grid container>
                    <Grid item columns={columns} xs={1}>
                        <Typography variant="em">Total</Typography>
                    </Grid>
                    {secondStatValues.map((v) => (
                        <Grid item columns={columns} xs={1} key={`total_${v}`}>
                            <Typography>
                                {Object.values(groups)
                                    .map((group) => (group[v] || []).length)
                                    .reduce((acc, curr) => acc + curr, 0)}
                            </Typography>
                        </Grid>
                    ))}
                    <Grid item columns={columns} xs={1}>
                        <Typography>{qsos.length}</Typography>
                    </Grid>
                </Grid>
            </Stack>
        </PageLayout>
    );
};

export default Stats;
