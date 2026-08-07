import axios from "axios";
import { DateTime } from "luxon";
import React, { useEffect } from "react";
import { Modal } from "../utils/modal";
import { useWidthMatches } from "../ui/breakpoints";
import colours from "../ui/colours.json";
import { Button } from "../ui/button";
import { Typography } from "../ui/typography";
import { getCallsignData } from "../utils/callsign";
import { useStore } from "../utils/store";
import { useSettings } from "../utils/use-settings";
import { withCache } from "../utils/with-cache";
import { BarChart } from "./bar-chart";
import { Stack } from "./stack";

const dtFormat = "yyyyMMddHHmm";
type DataType = { date: DateTime; value: number };
// The daily indices file gives us three series in one go, so they're fetched and cached together.
type SolarType = { date: DateTime; sfi: number; sunspots: number; sunspotArea: number };
const solarSeries = ["sfi", "sunspots", "sunspotArea"] as const;

const serialise = (data: DataType[]) =>
    JSON.stringify(data.map(({ date, value }) => ({ date: date.toFormat(dtFormat), value: String(value) })));
const deserialise = (data: string) =>
    JSON.parse(data).map(({ date, value }: { date: string; value: string }) => ({
        date: DateTime.fromFormat(date, dtFormat),
        value: +value,
    }));

const serialiseSolar = (data: SolarType[]) =>
    JSON.stringify(
        data.map((e) => ({
            date: e.date.toFormat(dtFormat),
            ...Object.fromEntries(solarSeries.map((key) => [key, String(e[key])])),
        })),
    );
const deserialiseSolar = (data: string): SolarType[] =>
    JSON.parse(data).map((e: Record<string, string>) => ({
        date: DateTime.fromFormat(e.date, dtFormat),
        ...(Object.fromEntries(solarSeries.map((key) => [key, +e[key]])) as Omit<SolarType, "date">),
    }));

const sirx =
    /^(\d{4} \d{2} \d{2})\s+(\d+)\s+(\d+)\s+(\d+)\s+(\d+)\s+([-]?\d+)\s+([*]|([A-Z]\d+[.]\d+))\s+(\d+)\s+(\d+)\s+(\d+)\s+(\d+)\s+(\d+)\s+(\d+)\s+(\d+)/;

const fetchSolarData = async () =>
    axios
        .get(`https://services.swpc.noaa.gov/text/daily-solar-indices.txt`)
        .then(({ data }) =>
            data
                .split("\n")
                .filter((l: string) => !l.startsWith(":") && !l.startsWith("#"))
                .map((l: string) => {
                    const d = l.match(sirx);
                    if (d) {
                        return {
                            date: DateTime.fromFormat(d[1], "yyyy MM dd"),
                            sfi: +d[2],
                            sunspots: +d[3],
                            sunspotArea: +d[4],
                        };
                    }
                })
                .filter((e: any) => !!e),
        )
        .then(serialiseSolar);

const fetchMagneticData = async () =>
    axios
        .get("https://services.swpc.noaa.gov/products/noaa-planetary-k-index.json")
        .then(({ data }) =>
            data.map((e: { time_tag: string; Kp: number }) => ({
                date: DateTime.fromISO(e.time_tag),
                value: +e.Kp,
            })),
        )
        .then(serialise);

const coloursGradient = [
    colours.red[700],
    colours.red[500],
    colours.orange[500],
    colours.orange[300],
    colours.green[300],
    colours.green[600],
];
const sfiCutoffs = [0, 50, 100, 150, 200, 250, 300];
const kIndexCutoffs = [0, 8, 15, 30, 50, 100, 400];
const sunspotCutoffs = [0, 20, 50, 90, 140, 200, 500];
const sunspotAreaCutoffs = [0, 100, 300, 600, 1000, 1500, 5000];

// One table drives both the header chips and the modal's tabs, so a label only ever lives in one place.
type SeriesKey = "sfi" | "k" | "sp" | "sa";
const seriesMeta: { key: SeriesKey; label: string; title: string; cutoffs: number[]; reverse?: boolean }[] = [
    { key: "sfi", label: "SFI", title: "Solar flux index", cutoffs: sfiCutoffs },
    { key: "k", label: "K", title: "K index", cutoffs: kIndexCutoffs, reverse: true },
    { key: "sp", label: "SP", title: "Sunspot number", cutoffs: sunspotCutoffs },
    { key: "sa", label: "SA", title: "Sunspot area, millionths of a hemisphere", cutoffs: sunspotAreaCutoffs },
];
const scaleColour = (value: number, cutoffs: number[], reverse: boolean = false): string => {
    if (cutoffs.length != 7) throw new Error("wrong cutoffs");
    // Anything off either end of the scale sticks to the nearest bucket rather than falling off the gradient.
    const found = cutoffs.findIndex((v, i) => value >= v && value < cutoffs[i + 1]);
    let status = found >= 0 ? found : value < cutoffs[0] ? 0 : coloursGradient.length - 1;
    if (reverse) status = coloursGradient.length - status - 1;
    return coloursGradient[status];
};

export const SolarData = () => {
    const [modal, setModal] = React.useState<boolean>(false);
    const [tab, setTab] = React.useState<SeriesKey>("sfi");
    const [solarData, setSolarData] = React.useState<SolarType[]>();
    const [magneticData, setMagneticData] = React.useState<DataType[]>();
    const settings = useSettings();
    const currentLocation = useStore((state) => state.currentLocation);
    const locator = settings.myGridsquare || currentLocation;
    const callsign = settings.myCallsign;
    const continent = getCallsignData(callsign)?.ctn?.toLowerCase();

    const updateCache = () => {
        // Key bumped from "solarData" because the cached shape now carries three series per row.
        withCache("solarIndices", fetchSolarData, 60 * 60 * 3).then((data) => setSolarData(deserialiseSolar(data)));
        withCache("magneticData", fetchMagneticData, 60 * 60 * 3).then((data) => setMagneticData(deserialise(data)));
    };

    useEffect(() => {
        updateCache();
        const ts = setInterval(updateCache, 10 * 60 * 1000);
        return () => clearInterval(ts);
    }, []);
    const values: Record<SeriesKey, number[] | undefined> = {
        sfi: solarData?.map(({ sfi }) => sfi),
        k: magneticData?.map(({ value }) => value),
        sp: solarData?.map(({ sunspots }) => sunspots),
        sa: solarData?.map(({ sunspotArea }) => sunspotArea),
    };
    const series = seriesMeta.map((meta) => {
        const data = values[meta.key];
        return { ...meta, data, latest: data?.length ? data[data.length - 1] : undefined };
    });
    const selected = series.find(({ key }) => key == tab) as (typeof series)[number];

    // Two pairs side by side: stacked into a 2x2 on wide screens, one flat row of four on narrow ones.
    const pairDirection = useWidthMatches("md") ? "column" : "row";

    const chip = ({ key, label, data, latest, cutoffs, reverse }: (typeof series)[number]) => (
        <Button
            key={key}
            variant="chip"
            colour="grey"
            text={latest !== undefined ? `${label}: ${latest}` : "Fetching..."}
            onPress={() => {
                setTab(key);
                setModal(true);
            }}
            style={{
                backgroundColor: data ? scaleColour(latest as number, cutoffs, reverse) : undefined,
            }}
        />
    );

    return (
        <Stack direction="row">
            <Stack direction={pairDirection}>{series.slice(0, 2).map(chip)}</Stack>
            <Stack direction={pairDirection}>{series.slice(2).map(chip)}</Stack>
            <Modal wide open={modal} onClose={() => setModal(false)}>
                <Stack gap="xxl">
                    <Typography variant="h2">Solar Data</Typography>
                    <Stack>
                        {/* One chart at a time, picked by the pills, so the modal stays short enough to reach OK. */}
                        <Stack direction="row">
                            {series.map(({ key, label }) => (
                                <Button
                                    key={key}
                                    variant="chip"
                                    colour={key == tab ? "primary" : "grey"}
                                    text={label}
                                    onPress={() => setTab(key)}
                                />
                            ))}
                        </Stack>
                        {selected.data ? (
                            <>
                                <Typography>
                                    {selected.title} (Currently: {selected.latest})
                                </Typography>
                                <BarChart data={selected.data} />
                            </>
                        ) : (
                            <Typography>Looking for {selected.label} data...</Typography>
                        )}
                    </Stack>
                    <Button
                        url="https://prop.kc2g.com/renders/current/mufd-normal-now.svg"
                        text="MUF map"
                        variant="outlined"
                    />
                    {locator && (
                        <Button
                            url={`https://hf.dxview.org/perspective/${locator}`}
                            text="DXView"
                            variant="outlined"
                        />
                    )}
                    <Button
                        url={`https://pskreporter.info/pskmap?${callsign ? `callsign=${callsign}&` : ""}search=Find`}
                        text="PSKMap"
                        variant="outlined"
                    />
                    <Button url="https://ham-stats.com/" text="HamStats" variant="outlined" />
                    {continent && (
                        <Button
                            url={`https://dxmap.hb9vqq.ch/v8/?topic=${continent}&source=wspr`}
                            text="DxMap"
                            variant="outlined"
                        />
                    )}
                    <Button colour="success" text="OK" onPress={() => setModal(false)} />
                </Stack>
            </Modal>
        </Stack>
    );
};
