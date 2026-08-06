import axios from "axios";
import { DateTime } from "luxon";
import React, { useEffect } from "react";
import { Modal } from "../utils/modal";
import { useWidthMatches } from "../ui/breakpoints";
import colours from "../ui/colours.json";
import { Button } from "../ui/button";
import { Typography } from "../ui/typography";
import { withCache } from "../utils/with-cache";
import { BarChart } from "./bar-chart";
import { Stack } from "./stack";

const dtFormat = "yyyyMMddHHmm";
type DataType = { date: DateTime; value: number };

const serialise = (data: DataType[]) =>
    JSON.stringify(data.map(({ date, value }) => ({ date: date.toFormat(dtFormat), value: String(value) })));
const deserialise = (data: string) =>
    JSON.parse(data).map(({ date, value }: { date: string; value: string }) => ({
        date: DateTime.fromFormat(date, dtFormat),
        value: +value,
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
                            value: +d[2],
                        };
                    }
                })
                .filter((e: any) => !!e),
        )
        .then(serialise);

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
const scaleColour = (value: number, cutoffs: number[], reverse: boolean = false): string => {
    if (cutoffs.length != 7) throw new Error("wrong cutoffs");
    let status = cutoffs.findIndex((v, i) => value >= v && value < cutoffs[i + 1]);
    if (reverse) status = cutoffs.length - status - 2;
    return coloursGradient[status];
};

export const SolarData = () => {
    const [modal, setModal] = React.useState<boolean>(false);
    const [solarData, setSolarData] = React.useState<DataType[]>();
    const [magneticData, setMagneticData] = React.useState<DataType[]>();

    const updateCache = () => {
        withCache("solarData", fetchSolarData, 60 * 60 * 3).then((data) => setSolarData(deserialise(data)));
        withCache("magneticData", fetchMagneticData, 60 * 60 * 3).then((data) => setMagneticData(deserialise(data)));
    };

    useEffect(() => {
        updateCache();
        const ts = setInterval(updateCache, 10 * 60 * 1000);
        return () => clearInterval(ts);
    }, []);
    const solarValues = solarData ? solarData.map(({ value }) => value) : undefined;
    const magneticValues = magneticData ? magneticData.map(({ value }) => value) : undefined;

    return (
        <Stack direction={useWidthMatches("md") ? "column" : "row"}>
            <Button
                variant="chip"
                colour="grey"
                text={solarValues ? `SFI: ${solarValues[solarValues.length - 1]}` : "Fetching..."}
                onPress={() => setModal(true)}
                style={{
                    backgroundColor: solarValues
                        ? scaleColour(solarValues[solarValues.length - 1], sfiCutoffs)
                        : undefined,
                }}
            />
            <Button
                variant="chip"
                colour="grey"
                style={{
                    backgroundColor: magneticValues
                        ? scaleColour(magneticValues[magneticValues.length - 1], kIndexCutoffs, true)
                        : undefined,
                }}
                text={magneticValues ? `K: ${magneticValues[magneticValues.length - 1]}` : "Fetching..."}
                onPress={() => setModal(true)}
            />
            <Modal wide open={modal} onClose={() => setModal(false)}>
                <Stack gap="xxl">
                    <Typography variant="h2">Solar Data</Typography>
                    {solarValues && (
                        <Stack>
                            <Typography>Solar flux index (Currently: {solarValues[solarValues.length - 1]})</Typography>
                            <BarChart data={solarValues} />
                        </Stack>
                    )}
                    {!solarValues && <Typography>Looking for solar data...</Typography>}
                    {magneticValues && (
                        <Stack>
                            <Typography>K index (Currently: {magneticValues[magneticValues.length - 1]})</Typography>
                            <BarChart data={magneticValues} />
                        </Stack>
                    )}
                    {!magneticValues && <Typography>Looking for magnetic data...</Typography>}
                    <Button
                        url="https://prop.kc2g.com/renders/current/mufd-normal-now.svg"
                        text="MUF map"
                        variant="outlined"
                    />
                    <Button colour="success" text="OK" onPress={() => setModal(false)} />
                </Stack>
            </Modal>
        </Stack>
    );
};
