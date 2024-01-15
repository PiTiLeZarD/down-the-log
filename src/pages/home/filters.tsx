import React from "react";
import { Modal, ScrollView, View } from "react-native";
import { countries } from "../../data/countries";
import { Grid } from "../../utils/grid";
import { QSO, useQsos } from "../../utils/qso";
import { Stack } from "../../utils/stack";
import { Button } from "../../utils/theme/components/button";
import { Typography } from "../../utils/theme/components/typography";

const unique: <T>(a: Array<T>) => Array<T> = (a) => a.filter((v, i, aa) => aa.indexOf(v) === i);

export type FilterFunction = (qso: QSO) => string;
export const filterMap: Record<string, FilterFunction> = {
    year: (qso) => String(qso.date.toObject().year),
    band: (qso) => String(qso.band),
    mode: (qso) => String(qso.mode),
    cq: (qso) => String(qso.cqzone),
    itu: (qso) => String(qso.ituzone),
    dxcc: (qso) => String(qso.dxcc),
    gridsquare: (qso) => qso.locator?.substring(0, 3) || "",
    continent: (qso) => qso.continent || "",
    country: (qso) => (qso.country ? countries[qso.country].name : ""),
    qsl: (qso) =>
        `${qso.lotw_received ? "lotw" : ""}${qso.eqsl_received ? "eqsl" : ""}${
            !qso.lotw_received && !qso.eqsl_received ? "none" : ""
        }`,
};
export type FilterName = keyof typeof filterMap;
export type QsoFilter = { name: FilterName; values: unknown[] };

export type FiltersProps = {
    filters: QsoFilter[];
    setFilters: (filters: QsoFilter[]) => void;
};

export type FiltersComponent = React.FC<FiltersProps>;

export const Filters: FiltersComponent = ({ filters, setFilters }): JSX.Element => {
    const qsos = useQsos();
    const [modal, setModal] = React.useState<boolean>(false);
    const [filter, setFilter] = React.useState<FilterName | undefined>(undefined);
    const [values, setValues] = React.useState<Array<unknown>>([]);

    const handleSelectFilter = (name: string) => () => {
        setFilter(filter === name ? undefined : name);
        setValues([]);
    };
    const handleSelectValue = (value: string) => () => {
        setValues(values.includes(value) ? values.filter((vi) => vi !== value) : [...values, value]);
    };
    const handleOk = () => {
        if (values.length) setFilters([...filters, { name: filter as string, values }]);
        setModal(false);
        setFilter(undefined);
        setValues([]);
    };
    return (
        <Stack direction="row">
            <Stack direction="row" style={{ flexGrow: 1 }}>
                <Typography variant="em">Filters:</Typography>
                {filters.map(({ name, values }) => (
                    <View key={name}>
                        <Button
                            variant="chip"
                            colour="grey"
                            endIcon="close"
                            text={`${name}: ${values.map((v) => String(v)).join(", ")}`}
                            onPress={() => setFilters(filters.filter((f) => f.name !== name))}
                        />
                    </View>
                ))}
                {filters.length === 0 && <Typography>None</Typography>}
            </Stack>
            <View>
                <Button startIcon="add" onPress={() => setModal(true)} />
            </View>
            <Modal animationType="none" visible={modal} onRequestClose={() => setModal(false)}>
                <Grid container>
                    <Grid item xs={1} md={2} lg={3} xl={4} xxl={5} />
                    <Grid item xs={10} md={8} lg={6} xl={4} xxl={2}>
                        <Stack>
                            {filter && <Button text={filter} onPress={handleSelectFilter(filter)} />}
                            {!filter &&
                                Object.keys(filterMap).map((name) => (
                                    <Button
                                        key={name}
                                        text={name}
                                        variant="outlined"
                                        onPress={handleSelectFilter(name)}
                                    />
                                ))}
                        </Stack>
                        {!filter && <Typography>Select a filter</Typography>}
                        {filter && (
                            <ScrollView>
                                <Stack>
                                    {unique(qsos.map((q) => filterMap[filter](q))).map((v) => (
                                        <Button
                                            key={v}
                                            style={{ marginTop: 2, marginBottom: 2 }}
                                            text={String(v)}
                                            variant={values.includes(v) ? "contained" : "outlined"}
                                            onPress={handleSelectValue(v)}
                                        />
                                    ))}
                                    <Button colour="success" text="OK" onPress={handleOk} />
                                </Stack>
                            </ScrollView>
                        )}
                    </Grid>
                    <Grid item xs={1} md={2} lg={3} xl={4} xxl={5} />
                </Grid>
            </Modal>
        </Stack>
    );
};