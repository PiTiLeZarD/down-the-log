import React from "react";
import { View, useWindowDimensions } from "react-native";
import { countries } from "../../data/countries";
import { Modal } from "../../utils/modal";
import { QSO, useQsos } from "../../utils/qso";
import { Stack } from "../../utils/stack";
import { Button } from "../../utils/theme/components/button";
import { PaginatedList } from "../../utils/theme/components/paginated-list";
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

const isNumber = (v: string) => String(+v) === v;
export const sortResults = (r1: string, r2: string) => {
    if (isNumber(r1) && isNumber(r2)) return +r1 - +r2;
    return r1 < r2 ? -1 : r1 === r2 ? 0 : 1;
};

export type FiltersComponent = React.FC<FiltersProps>;

export const Filters: FiltersComponent = ({ filters, setFilters }): JSX.Element => {
    const qsos = useQsos();
    const { height } = useWindowDimensions();
    const [modal, setModal] = React.useState<boolean>(false);
    const [filter, setFilter] = React.useState<FilterName | undefined>(undefined);
    const [values, setValues] = React.useState<Array<unknown>>([]);

    const itemsPerPage = Math.floor((height - 40 * 5) / 40);

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
            <Modal open={modal} onClose={() => setModal(false)}>
                <Stack>
                    {filter && <Button text={filter} onPress={handleSelectFilter(filter)} />}
                    {!filter && (
                        <PaginatedList itemsPerPage={itemsPerPage}>
                            {Object.keys(filterMap).map((name) => (
                                <Button key={name} text={name} variant="outlined" onPress={handleSelectFilter(name)} />
                            ))}
                        </PaginatedList>
                    )}
                    {filter && (
                        <PaginatedList itemsPerPage={itemsPerPage}>
                            {unique(qsos.map((q) => filterMap[filter](q)))
                                .sort(sortResults)
                                .map((v) => (
                                    <Button
                                        key={v}
                                        style={{ marginTop: 2, marginBottom: 2 }}
                                        text={String(v)}
                                        variant={values.includes(v) ? "contained" : "outlined"}
                                        onPress={handleSelectValue(v)}
                                    />
                                ))}
                        </PaginatedList>
                    )}
                    <Button colour="success" text="OK" onPress={handleOk} />
                </Stack>
            </Modal>
        </Stack>
    );
};
