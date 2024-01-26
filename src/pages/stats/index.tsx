import { StackScreenProps } from "@react-navigation/stack";
import React from "react";
import { NavigationParamList } from "../../Navigation";
import { Band, bands, freq2band } from "../../data/bands";
import { useStore } from "../../store";
import { groupBy, sortNumsAndAlpha } from "../../utils/arrays";
import { Grid } from "../../utils/grid";
import { PageLayout } from "../../utils/page-layout";
import { QSO, useQsos } from "../../utils/qso";
import { Stack } from "../../utils/stack";
import { SelectInput } from "../../utils/theme/components/select-input";
import { Typography } from "../../utils/theme/components/typography";
import { FilterName, Filters, filterMap, filterQsos } from "../home/filters";

const groupQsos = (qsos: QSO[], statType: FilterName): Record<string, Record<string, QSO[]>> =>
    Object.fromEntries(
        Object.entries(groupBy(qsos, filterMap[statType])).map(([k, qs]) => [
            k,
            groupBy<QSO, string>(
                qs.filter((q) => !!q.frequency),
                (q) => freq2band(q.frequency) as Band,
            ),
        ]),
    );

export type StatsProps = {} & StackScreenProps<NavigationParamList, "Stats">;

export type StatsComponent = React.FC<StatsProps>;

export const Stats: StatsComponent = ({ navigation }): JSX.Element => {
    const [statType, setStatType] = React.useState<FilterName>("mode");
    const qsosFilters = useStore((state) => state.filters);
    const qsos = filterQsos(useQsos(), qsosFilters);
    const groups = groupQsos(qsos, statType);
    const usedBands = [
        ...new Set(
            Object.values(groups)
                .map((group) => Object.keys(group))
                .flat(),
        ),
    ].sort((b1, b2) => Object.keys(bands).indexOf(b1) - Object.keys(bands).indexOf(b2));
    const columns = usedBands.length + 2;

    return (
        <PageLayout title="Stats" navigate={navigation.navigate}>
            <Stack>
                <Filters />
                <SelectInput
                    value={statType}
                    onValueChange={(newStatType) => setStatType(newStatType)}
                    items={Object.keys(filterMap).map((t) => ({ label: t, value: t }))}
                />
                <Grid container>
                    <Grid item columns={columns} xs={1}>
                        <Typography variant="em">{statType}</Typography>
                    </Grid>
                    {usedBands.map((band) => (
                        <Grid item columns={columns} xs={1} key={band}>
                            <Typography variant="em">{band}</Typography>
                        </Grid>
                    ))}
                    <Grid item columns={columns} xs={1}>
                        <Typography variant="em">Total</Typography>
                    </Grid>
                </Grid>
                {Object.keys(groups)
                    .sort(sortNumsAndAlpha)
                    .map((group) => (
                        <Grid container key={group}>
                            <Grid item columns={columns} xs={1}>
                                <Typography variant="em">{group}</Typography>
                            </Grid>
                            {usedBands.map((band) => (
                                <Grid item columns={columns} xs={1} key={`${group}_${band}`}>
                                    <Typography>{(groups[group][band] || []).length}</Typography>
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
                    {usedBands.map((band) => (
                        <Grid item columns={columns} xs={1} key={`total_${band}`}>
                            <Typography>
                                {Object.values(groups)
                                    .map((group) => (group[band] || []).length)
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
