import { useRouter } from "expo-router";
import React from "react";
import { View, useWindowDimensions } from "react-native";
import { useStyles } from "react-native-unistyles";
import { callsigns } from "../data/callsigns";
import { countries } from "../data/countries";
import { sortNumsAndAlpha, unique } from "../utils/arrays";
import { normalise } from "../utils/locator";
import { Modal } from "../utils/modal";
import { useStore } from "../utils/store";
import { Alert } from "../utils/theme/components/alert";
import { Button } from "../utils/theme/components/button";
import { Input } from "../utils/theme/components/input";
import { PaginatedList } from "../utils/theme/components/paginated-list";
import { Typography } from "../utils/theme/components/typography";
import { fireSwal } from "../utils/theme/swal";
import { QSO, hasEvent, useQsos } from "./qso";
import { Stack } from "./stack";

export type FilterFunction = (qso: QSO) => string[];
const dxcc2countrymap = Object.fromEntries(callsigns.map((csd) => [+csd.dxcc, csd.iso3]));

export const filterMap: Record<string, FilterFunction> = {
    year: (qso) => [String(qso.date.toObject().year)],
    month: (qso) => [String(qso.date.toObject().month)],
    day: (qso) => [String(qso.date.toObject().day)],
    band: (qso) => [String(qso.band)],
    mode: (qso) => [String(qso.mode)],
    cq: (qso) => [String(qso.cqzone)],
    itu: (qso) => [String(qso.ituzone)],
    dxcc: (qso) => [`${qso.dxcc} (${qso.dxcc ? (countries[dxcc2countrymap[qso.dxcc]] || { name: "?" }).name : "?"})`],
    pota: (qso) => [qso.pota || "", qso.myPota || ""],
    wwff: (qso) => [qso.wwff || "", qso.myWwff || ""],
    sota: (qso) => [qso.sota || "", qso.mySota || ""],
    iota: (qso) => [qso.iota || "", qso.myIota || ""],
    myCallsign: (qso) => [qso.myCallsign || "N/A"],
    myRig: (qso) => [qso.myRig || "N/A"],
    myAntenna: (qso) => [qso.myAntenna || "N/A"],
    sig: (qso) => [qso.sig || "", qso.mySig || ""],
    has_event: (qso) => [hasEvent(qso) ? "Yes" : "No"],
    has_note: (qso) => [qso.note ? "Yes" : "No"],
    gridsquare: (qso) => [qso.locator?.substring(0, 3) || ""],
    continent: (qso) => [qso.continent || ""],
    country: (qso) => [qso.country ? countries[qso.country].name : ""],
    qsl: (qso) => [
        qso.lotw_received ? "LoTW received" : "LoTW not received",
        qso.lotw_sent ? "LoTW sent" : "LoTW not sent",
        qso.eqsl_received ? "eQSL received" : "eQSL not received",
        qso.eqsl_sent ? "eQSL sent" : "eQSL not sent",
    ],
};
export type FilterName = keyof typeof filterMap;
export type QsoFilter = { name: FilterName; values: unknown[] };

export const filterQsos = (qsos: QSO[], qsosFilters: QsoFilter[]) =>
    qsos.filter((q) =>
        qsosFilters.reduce((acc, { name, values }) => acc && filterMap[name](q).some((f) => values.includes(f)), true),
    );

export type FiltersProps = {
    showTag?: boolean;
};

const tagFields = [
    "frequency",
    "band",
    "mode",
    "power",
    "myCallsign",
    "myQth",
    "myLocator",
    "myCountry",
    "myState",
    "eqsl_received",
    "eqsl_sent",
    "lotw_received",
    "lotw_sent",
    "myPota",
    "myWwff",
    "mySota",
    "mySig",
    "mySigInfo",
    "myIota",
    "myRig",
    "myAntenna",
];
const castValue = (k: string, v: string) => {
    if (v === "") return undefined;
    if (["eqsl_received", "eqsl_sent", "lotw_received", "lotw_sent"].includes(k))
        return ["1", "Y", "YES"].includes(v.toUpperCase());
    if (["power", "frequency"].includes(k)) return +v;
    if (k === "locator") return normalise(v);
    return v;
};

export type FiltersComponent = React.FC<FiltersProps>;

export const Filters: FiltersComponent = ({ showTag }): JSX.Element => {
    const { theme } = useStyles();
    const filters = useStore((state) => state.filters);
    const qsos = filterQsos(useQsos(), filters);
    const { height } = useWindowDimensions();
    const [modal, setModal] = React.useState<boolean>(false);
    const [tagModal, setTagModal] = React.useState<boolean>(false);
    const [tagValues, setTagValues] = React.useState<Record<string, string>>({});
    const [filter, setFilter] = React.useState<FilterName | undefined>(undefined);
    const [values, setValues] = React.useState<Array<unknown>>([]);
    const log = useStore((state) => state.log);
    const setFilters = useStore((state) => state.updateFilters);
    const { navigate } = useRouter();

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

    const handleUpdate = () => {
        const castedValues = Object.fromEntries(Object.entries(tagValues).map(([k, v]) => [k, castValue(k, v)]));
        log(qsos.map((q) => ({ ...q, ...castedValues })));
        setTagValues({});
        setTagModal(false);
        fireSwal({
            theme,
            title: "Done!",
            text: `Updated ${qsos.length} QSOs`,
            icon: "success",
            confirmButtonText: "Ok",
        });
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
            <Typography variant="subtitle">({qsos.length})</Typography>
            {showTag && qsos.length > 0 && (
                <View>
                    <Button
                        variant="outlined"
                        text="Tag"
                        onPress={() => {
                            setTagValues({});
                            setTagModal(true);
                        }}
                    />
                </View>
            )}
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
            <Modal open={tagModal} onClose={() => setTagModal(false)}>
                <Stack>
                    <Typography>
                        With this, you can bulk update your QSOs. Make sure the filters match what you want, set which
                        field you want to update and click update
                    </Typography>
                    <Alert>
                        <Typography>This will update {qsos.length} QSOs</Typography>
                    </Alert>
                    <Button
                        text="You can backup first"
                        colour="secondary"
                        onPress={() => {
                            setTagModal(false);
                            navigate("Adif");
                        }}
                    />
                    <PaginatedList>
                        {tagFields.map((k) => (
                            <Stack key={k}>
                                <Button
                                    variant="outlined"
                                    text={k}
                                    onPress={() => setTagValues({ ...tagValues, [k]: "" })}
                                />
                                {k in tagValues && (
                                    <Input
                                        value={tagValues[k]}
                                        onChangeText={(v) => setTagValues({ ...tagValues, [k]: v })}
                                    />
                                )}
                            </Stack>
                        ))}
                    </PaginatedList>
                    <Button colour="success" text="Update" onPress={handleUpdate} />
                    <Button colour="grey" text="Cancel" onPress={() => setTagModal(false)} />
                </Stack>
            </Modal>
        </Stack>
    );
};
