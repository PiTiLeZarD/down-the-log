import React from "react";
import { View } from "react-native";
import { StyleSheet } from "react-native-unistyles";
import { Typography } from "../ui/typography";

const LABELHEIGHT = 12;

const styles = StyleSheet.create((theme) => ({
    container: (height: number) => ({
        height,
        flexDirection: "row",
    }),
    axis: {
        width: 36,
        paddingRight: theme.margins.lg,
    },
    // Both the tick labels and the grid lines are placed by percentage off the same scale, so they line
    // up whatever the container ends up measuring.
    axisLabel: (top: number) => ({
        position: "absolute",
        right: theme.margins.lg,
        top: `${top}%`,
        marginTop: -LABELHEIGHT / 2,
        fontSize: 10,
        lineHeight: LABELHEIGHT,
        color: theme.colours.grey.main,
    }),
    plot: {
        flexGrow: 1,
    },
    gridLine: (top: number) => ({
        position: "absolute",
        left: 0,
        right: 0,
        top: `${top}%`,
        height: theme.margins.xs,
        backgroundColor: theme.colours.grey.light,
    }),
    bars: {
        flexDirection: "row",
        height: "100%",
    },
    barColumn: {
        flex: 1,
        marginHorizontal: theme.margins.xs,
    },
    bar: (top: number, bottom: number) => ({
        position: "absolute",
        left: 0,
        right: 0,
        top: `${top}%`,
        bottom: `${bottom}%`,
        backgroundColor: theme.colours.primary.dark,
    }),
}));

export type BarChartProps = {
    data: number[];
    height?: number;
    numberOfTicks?: number;
};

export const BarChart = ({ data, height = 150, numberOfTicks = 3 }: BarChartProps) => {
    if (!data.length) return <></>;

    // Zero is always in the domain, so the bars have a baseline to grow from either way.
    const max = Math.max(...data, 0);
    const min = Math.min(...data, 0);
    const range = max - min || 1;
    const top = (value: number) => ((max - value) / range) * 100;
    const ticks = Array.from({ length: numberOfTicks + 1 }, (_, i) => min + (range * i) / numberOfTicks);

    return (
        <View style={styles.container(height)}>
            <View style={styles.axis}>
                {ticks.map((tick) => (
                    <Typography key={tick} style={styles.axisLabel(top(tick))}>
                        {String(Math.round(tick))}
                    </Typography>
                ))}
            </View>
            <View style={styles.plot}>
                {ticks.map((tick) => (
                    <View key={tick} style={styles.gridLine(top(tick))} />
                ))}
                <View style={styles.bars}>
                    {data.map((value, index) => (
                        <View key={index} style={styles.barColumn}>
                            <View style={styles.bar(top(Math.max(value, 0)), 100 - top(Math.min(value, 0)))} />
                        </View>
                    ))}
                </View>
            </View>
        </View>
    );
};
