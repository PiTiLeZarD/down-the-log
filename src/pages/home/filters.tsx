import React from "react";
import { Modal, View } from "react-native";
import { FlatList } from "react-native-gesture-handler";
import { createStyleSheet, useStyles } from "react-native-unistyles";
import { countries } from "../../data/countries";
import { Grid } from "../../utils/grid";
import { QSO, useQsos } from "../../utils/qso";
import { Stack } from "../../utils/stack";
import { Button } from "../../utils/theme/components/button";
import { Typography } from "../../utils/theme/components/typography";

const unique: <T>(a: Array<T>) => Array<T> = (a) => a.filter((v, i, aa) => aa.indexOf(v) === i);

const stylesheet = createStyleSheet((theme) => ({
    hr: {
        height: 2,
        flexGrow: 1,
        backgroundColor: theme.colours.primary[theme.shades.darker],
        marginTop: theme.margins.xl,
        marginBottom: theme.margins.xl,
    },
}));

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
};
export type FilterName = keyof typeof filterMap;
export type QsoFilter = { name: FilterName; values: unknown[] };

export type FiltersProps = {
    filters: QsoFilter[];
    setFilters: (filters: QsoFilter[]) => void;
};

export type FiltersComponent = React.FC<FiltersProps>;

export const Filters: FiltersComponent = ({ filters, setFilters }): JSX.Element => {
    const { styles } = useStyles(stylesheet);
    const qsos = useQsos();
    const [modal, setModal] = React.useState<boolean>(false);
    const [filter, setFilter] = React.useState<FilterName | undefined>(undefined);
    const [values, setValues] = React.useState<Array<unknown>>([]);
    return (
        <Stack direction="row">
            <Stack direction="row" style={{ flexGrow: 1 }}>
                <Typography variant="em">Filters:</Typography>
                {filters.map(({ name, values }) => (
                    <View key={name}>
                        <Button
                            variant="chip"
                            colour="grey"
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
                            {filter && (
                                <Button
                                    text={filter}
                                    onPress={() => {
                                        setFilter(undefined);
                                        setValues([]);
                                    }}
                                />
                            )}
                            {!filter &&
                                Object.keys(filterMap).map((name) => (
                                    <Button key={name} text={name} variant="outlined" onPress={() => setFilter(name)} />
                                ))}
                        </Stack>
                        <View style={styles.hr} />
                        {!filter && <Typography>Select a filter</Typography>}
                        {filter && (
                            <Stack style={{ maxHeight: "100%" }}>
                                <FlatList
                                    data={unique(qsos.map((q) => filterMap[filter](q)))}
                                    renderItem={({ item }) => (
                                        <Button
                                            style={{ marginTop: 2, marginBottom: 2 }}
                                            text={String(item)}
                                            variant={values.includes(item) ? "contained" : "outlined"}
                                            onPress={() =>
                                                setValues(
                                                    values.includes(item)
                                                        ? values.filter((vi) => vi !== item)
                                                        : [...values, item],
                                                )
                                            }
                                        />
                                    )}
                                />
                                <Button
                                    colour="success"
                                    text="OK"
                                    onPress={() => {
                                        if (values.length) setFilters([...filters, { name: filter, values }]);
                                        setModal(false);
                                        setFilter(undefined);
                                        setValues([]);
                                    }}
                                />
                            </Stack>
                        )}
                    </Grid>
                    <Grid item xs={1} md={2} lg={3} xl={4} xxl={5} />
                </Grid>
            </Modal>
        </Stack>
    );
};
