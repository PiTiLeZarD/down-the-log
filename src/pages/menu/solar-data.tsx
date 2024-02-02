import axios from "axios";
import { DateTime } from "luxon";
import React, { useEffect } from "react";
import { View } from "react-native";
import { BarChart, Grid, YAxis } from "react-native-svg-charts";
import { useStyles } from "react-native-unistyles";
import { Stack } from "../../utils/stack";
import { Typography } from "../../utils/theme/components/typography";
import { hexToCssRgb } from "../../utils/theme/theme";

type SolarDataType = Array<{ date: DateTime; sfi: number }>;
type MagneticDataType = Array<{ date: DateTime; kIndex: number }>;

const ssn = (sfi: number) => 1.14 * sfi - 73.21;

export type SolarDataProps = {};

export type SolarDataComponent = React.FC<SolarDataProps>;

export const SolarData: SolarDataComponent = (): JSX.Element => {
    const [solarData, setSolarData] = React.useState<SolarDataType>();
    const [magneticData, setMagneticData] = React.useState<MagneticDataType>();
    const { theme } = useStyles();
    const today = DateTime.local();
    useEffect(() => {
        axios
            .get(
                `https://lasp.colorado.edu/lisird/latis/dap/penticton_radio_flux.json?time,observed_flux&time%3E=${today
                    .minus({ days: 16 })
                    .toFormat("yyyy-MM-dd")}T00:00:00Z&time%3C=${today.toFormat(
                    "yyyy-MM-dd",
                )}T23:59:59Z&formatTime(yyyy-MM-dd%27T%27HH:mm:ss)`,
            )
            .then(({ data }) =>
                setSolarData(
                    data.penticton_radio_flux.samples.map(
                        ({ time, observed_flux }: { time: string; observed_flux: number }) => ({
                            date: DateTime.fromISO(time),
                            sfi: observed_flux,
                        }),
                    ),
                ),
            );
        axios.get("https://services.swpc.noaa.gov/products/noaa-planetary-k-index.json").then(({ data }) =>
            setMagneticData(
                data.splice(1).map((e: string[]) => ({
                    date: DateTime.fromFormat(e[0].substring(0, e[0].length - 4), "yyyy-MM-dd HH:mm:ss"),
                    kIndex: +e[1],
                })),
            ),
        );
    }, []);
    const contentInset = { top: 20, bottom: 20 };

    return (
        <Stack gap="xxl">
            <Typography variant="h2">Solar Data</Typography>
            {solarData && (
                <Stack style={{ flex: 1 }}>
                    <Typography>Solar flux index (Currently: {solarData[solarData.length - 1].sfi})</Typography>
                    <View style={{ height: 150, flexDirection: "row" }}>
                        <YAxis contentInset={contentInset} data={solarData.map(({ sfi }) => sfi)} numberOfTicks={3} />
                        <BarChart
                            contentInset={contentInset}
                            style={{ height: 150, flexGrow: 1 }}
                            data={solarData.map(({ sfi }) => sfi)}
                            svg={{ fill: hexToCssRgb(theme.colours.primary[theme.shades.dark]) }}
                        >
                            <Grid />
                        </BarChart>
                    </View>
                </Stack>
            )}
            {!solarData && <Typography>Looking for solar data...</Typography>}
            {magneticData && (
                <Stack style={{ flex: 1 }}>
                    <Typography>K index (Currently: {magneticData[magneticData.length - 1].kIndex})</Typography>
                    <View style={{ height: 150, flexDirection: "row" }}>
                        <YAxis
                            contentInset={contentInset}
                            data={magneticData.map(({ kIndex }) => kIndex)}
                            numberOfTicks={3}
                        />
                        <BarChart
                            contentInset={contentInset}
                            style={{ height: 150, flexGrow: 1 }}
                            data={magneticData.map(({ kIndex }) => kIndex)}
                            svg={{ fill: hexToCssRgb(theme.colours.primary[theme.shades.dark]) }}
                        >
                            <Grid />
                        </BarChart>
                    </View>
                </Stack>
            )}
            {!magneticData && <Typography>Looking for magnetic data...</Typography>}
        </Stack>
    );
};
