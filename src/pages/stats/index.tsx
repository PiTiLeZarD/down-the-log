import { DrawerScreenProps } from "@react-navigation/drawer";
import React from "react";
import { NavigationParamList } from "../../Navigation";
import { Band, freq2band } from "../../data/bands";
import { Grid } from "../../utils/grid";
import { PageLayout } from "../../utils/page-layout";
import { QSO, useQsos } from "../../utils/qso";
import { Stack } from "../../utils/stack";
import { SelectInput } from "../../utils/theme/components/select-input";
import { Typography } from "../../utils/theme/components/typography";

const statsTypes = ["mode", "cq", "itu", "dxcc", "gridsquare", "year"] as const;
type StatType = (typeof statsTypes)[number];

const groupBy = <T extends object, K extends string>(a: T[], f: (o: T) => K): Record<K, T[]> =>
    a.reduce<Record<K, T[]>>(
        (groups, elt) => ({
            ...groups,
            [f(elt)]: [...(groups[f(elt)] || []), elt],
        }),
        {} as Record<K, T[]>,
    );

const groupQsos = (qsos: QSO[], statType: StatType): Record<string, Record<string, QSO[]>> => {
    const filters: Record<StatType, (o: QSO) => any> = {
        mode: (o) => o.mode as string,
        cq: (o) => String(o.cqzone),
        itu: (o) => String(o.ituzone),
        dxcc: (o) => String(o.dxcc),
        gridsquare: (o) => o.locator?.substring(0, 3),
        year: (o) => o.date.toObject().year,
    };

    return Object.fromEntries(
        Object.entries(groupBy(qsos, filters[statType])).map(([k, qs]) => [
            k,
            groupBy<QSO, string>(
                qs.filter((q) => !!q.frequency),
                (q) => freq2band(q.frequency) as Band,
            ),
        ]),
    );
};

export type StatsProps = {} & DrawerScreenProps<NavigationParamList, "Stats">;

export type StatsComponent = React.FC<StatsProps>;

export const Stats: StatsComponent = ({ navigation }): JSX.Element => {
    const [statType, setStatType] = React.useState<StatType>("mode");
    const qsos = useQsos();
    const groups = groupQsos(qsos, statType);

    const usedBands = [
        ...new Set(
            Object.values(groups)
                .map((group) => Object.keys(group))
                .flat(),
        ),
    ];
    const columns = usedBands.length + 2;

    return (
        <PageLayout title="Stats" navigation={navigation}>
            <Stack>
                <SelectInput
                    value={statType}
                    onValueChange={(newStatType) => setStatType(newStatType)}
                    items={statsTypes.map((t) => ({ label: t, value: t }))}
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
                {Object.keys(groups).map((group) => (
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
