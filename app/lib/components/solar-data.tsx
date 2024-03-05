import axios from "axios";
import { DateTime } from "luxon";
import React, { useEffect } from "react";
import { View } from "react-native";
import { BarChart, Grid, YAxis } from "react-native-svg-charts";
import { useStyles } from "react-native-unistyles";
import { Modal } from "../utils/modal";
import { widthMatches } from "../utils/theme/breakpoints";
import colours from "../utils/theme/colours.json";
import { Button } from "../utils/theme/components/button";
import { Typography } from "../utils/theme/components/typography";
import { hexToCssRgb } from "../utils/theme/theme";
import { useCache } from "../utils/use-cache";
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

const ssn = (sfi: number) => 1.14 * sfi - 73.21;

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
            data.splice(1).map((e: string[]) => ({
                date: DateTime.fromFormat(e[0].substring(0, e[0].length - 4), "yyyy-MM-dd HH:mm:ss"),
                value: +e[1],
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

export type SolarDataProps = {};

export type SolarDataComponent = React.FC<SolarDataProps>;

export const SolarData: SolarDataComponent = (): JSX.Element => {
    const [modal, setModal] = React.useState<boolean>(false);
    const [solarData, setSolarData] = React.useState<DataType[]>();
    const [magneticData, setMagneticData] = React.useState<DataType[]>();
    const { theme } = useStyles();

    const updateCache = () => {
        useCache("solarData", fetchSolarData, 60 * 60 * 3).then((data) => setSolarData(deserialise(data)));
        useCache("magneticData", fetchMagneticData, 60 * 60 * 3).then((data) => setMagneticData(deserialise(data)));
    };

    useEffect(() => {
        updateCache();
        const ts = setInterval(updateCache, 10 * 60 * 1000);
        return () => clearInterval(ts);
    }, []);
    const contentInset = { top: 20, bottom: 20 };
    const solarValues = solarData ? solarData.map(({ value }) => value) : undefined;
    const magneticValues = magneticData ? magneticData.map(({ value }) => value) : undefined;

    return (
        <Stack direction={widthMatches("md") ? "column" : "row"}>
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
                            <View style={{ height: 150, flexDirection: "row" }}>
                                <YAxis contentInset={contentInset} data={solarValues} numberOfTicks={3} />
                                <BarChart
                                    contentInset={contentInset}
                                    style={{ height: 150, flexGrow: 1 }}
                                    data={solarValues}
                                    numberOfTicks={3}
                                    svg={{ fill: hexToCssRgb(theme.colours.primary[theme.shades.dark]) }}
                                >
                                    <Grid />
                                </BarChart>
                            </View>
                        </Stack>
                    )}
                    {!solarValues && <Typography>Looking for solar data...</Typography>}
                    {magneticValues && (
                        <Stack>
                            <Typography>K index (Currently: {magneticValues[magneticValues.length - 1]})</Typography>
                            <View style={{ height: 150, flexDirection: "row" }}>
                                <YAxis contentInset={contentInset} data={magneticValues} numberOfTicks={3} />
                                <BarChart
                                    contentInset={contentInset}
                                    style={{ height: 150, flexGrow: 1 }}
                                    data={magneticValues}
                                    numberOfTicks={3}
                                    svg={{ fill: hexToCssRgb(theme.colours.primary[theme.shades.dark]) }}
                                >
                                    <Grid />
                                </BarChart>
                            </View>
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
