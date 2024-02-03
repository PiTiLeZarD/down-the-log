import axios from "axios";
import { DateTime } from "luxon";
import React, { useEffect } from "react";
import { View } from "react-native";
import { BarChart, Grid, YAxis } from "react-native-svg-charts";
import { useStyles } from "react-native-unistyles";
import { Stack } from "../../utils/stack";
import { Typography } from "../../utils/theme/components/typography";
import { hexToCssRgb } from "../../utils/theme/theme";
import { useCache } from "../../utils/use-cache";

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

const fetchSolarData = async () =>
    axios
        .get(
            `https://lasp.colorado.edu/lisird/latis/dap/penticton_radio_flux.json?time,observed_flux&time%3E=${DateTime.local()
                .minus({ days: 16 })
                .toFormat("yyyy-MM-dd")}T00:00:00Z&time%3C=${DateTime.local().toFormat(
                "yyyy-MM-dd",
            )}T23:59:59Z&formatTime(yyyy-MM-dd%27T%27HH:mm:ss)`,
        )
        .then(({ data }) =>
            data.penticton_radio_flux.samples.map(
                ({ time, observed_flux }: { time: string; observed_flux: number }) => ({
                    date: DateTime.fromISO(time),
                    value: observed_flux,
                }),
            ),
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

export type SolarDataProps = {};

export type SolarDataComponent = React.FC<SolarDataProps>;

export const SolarData: SolarDataComponent = (): JSX.Element => {
    const [solarData, setSolarData] = React.useState<DataType[]>();
    const [magneticData, setMagneticData] = React.useState<DataType[]>();
    const { theme } = useStyles();
    useEffect(() => {
        useCache("solarData", fetchSolarData, 60 * 60 * 3).then((data) => setSolarData(deserialise(data)));
        useCache("magneticData", fetchMagneticData, 60 * 60 * 3).then((data) => setMagneticData(deserialise(data)));
    }, []);
    const contentInset = { top: 20, bottom: 20 };
    const solarValues = solarData ? solarData.map(({ value }) => value) : undefined;
    const magneticValues = magneticData ? magneticData.map(({ value }) => value) : undefined;

    return (
        <Stack gap="xxl">
            <Typography variant="h2">Solar Data</Typography>
            {solarValues && (
                <Stack style={{ flex: 1 }}>
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
                <Stack style={{ flex: 1 }}>
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
        </Stack>
    );
};
