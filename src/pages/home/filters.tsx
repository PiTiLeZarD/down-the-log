import React from "react";
import { View, useWindowDimensions } from "react-native";
import { callsigns } from "../../data/callsigns";
import { countries } from "../../data/countries";
import { useStore } from "../../store";
import { sortNumsAndAlpha, unique } from "../../utils/arrays";
import { Modal } from "../../utils/modal";
import { QSO, hasEvent, useQsos } from "../../utils/qso";
import { Stack } from "../../utils/stack";
import { Button } from "../../utils/theme/components/button";
import { PaginatedList } from "../../utils/theme/components/paginated-list";
import { Typography } from "../../utils/theme/components/typography";

export type FilterFunction = (qso: QSO) => string[];
const dxcc2countrymap = Object.fromEntries(callsigns.map((csd) => [+csd.dxcc, csd.iso3]));

export const filterMap: Record<string, FilterFunction> = {
    year: (qso) => [String(qso.date.toObject().year)],
    band: (qso) => [String(qso.band)],
    mode: (qso) => [String(qso.mode)],
    cq: (qso) => [String(qso.cqzone)],
    itu: (qso) => [String(qso.ituzone)],
    dxcc: (qso) => [`${qso.dxcc} (${qso.dxcc ? (countries[dxcc2countrymap[qso.dxcc]] || { name: "?" }).name : "?"})`],
    pota: (qso) => [qso.pota || "", qso.myPota || ""],
    wwff: (qso) => [qso.wwff || "", qso.myWwff || ""],
    sota: (qso) => [qso.sota || "", qso.mySota || ""],
    iota: (qso) => [qso.iota || "", qso.myIota || ""],
    sig: (qso) => [qso.sig || "", qso.mySig || ""],
    has_event: (qso) => [hasEvent(qso) ? "Yes" : "No"],
    gridsquare: (qso) => [qso.locator?.substring(0, 3) || ""],
    continent: (qso) => [qso.continent || ""],
    country: (qso) => [qso.country ? countries[qso.country].name : ""],
    qsl: (qso) => [qso.lotw_received ? "lotw" : "", qso.eqsl_received ? "eqsl" : ""],
};
export type FilterName = keyof typeof filterMap;
export type QsoFilter = { name: FilterName; values: unknown[] };

export const filterQsos = (qsos: QSO[], qsosFilters: QsoFilter[]) =>
    qsos.filter((q) =>
        qsosFilters.reduce((acc, { name, values }) => acc && filterMap[name](q).some((f) => values.includes(f)), true),
    );

export type FiltersProps = {};

export type FiltersComponent = React.FC<FiltersProps>;

export const Filters: FiltersComponent = (): JSX.Element => {
    const qsos = useQsos();
    const { height } = useWindowDimensions();
    const [modal, setModal] = React.useState<boolean>(false);
    const [filter, setFilter] = React.useState<FilterName | undefined>(undefined);
    const [values, setValues] = React.useState<Array<unknown>>([]);
    const filters = useStore((state) => state.filters);
    const setFilters = useStore((state) => state.updateFilters);

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
            <Typography variant="subtitle">({filterQsos(qsos, filters).length})</Typography>
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
                            {unique(qsos.map((q) => filterMap[filter](q)).flat())
                                .sort(sortNumsAndAlpha)
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
