import { DateTime } from "luxon";
import React from "react";
import { Pressable, ScrollView, View } from "react-native";
import { StyleSheet } from "react-native-unistyles";
import { useWidthMatches } from "../ui/breakpoints";
import { Button } from "../ui/button";
import { Typography } from "../ui/typography";
import { useStore } from "../utils/store";
import { useSettings } from "../utils/use-settings";
import { filterQsos } from "./filters";
import { useQsos } from "./qso";
import { Stack } from "./stack";

const WEEKS = 53;
const DAYS = 7;
const GAP = 2;
const LEVELS = 4;
// The weekday column is a fixed width so the month header can offset itself by exactly as much.
const LABELWIDTH = 30;
// Mon/Wed/Fri only, like GitHub: seven labels don't fit next to cells this size.
const dayLabels = ["Mon", "", "Wed", "", "Fri", "", ""];
// The filters a cell owns, so pressing one replaces its own selection and leaves the rest alone.
const dateFilters = ["year", "month", "day"];

const styles = StyleSheet.create((theme) => {
    // Level 0 is "nothing logged" and stays grey. 1-4 walk the primary palette away from the
    // background, which darkens in the light theme and brightens in the dark one.
    const levels = [
        theme.colours.grey.light,
        theme.colours.primary.light,
        theme.colours.primary.main,
        theme.colours.primary.dark,
        theme.colours.primary.darker,
    ];
    return {
        container: {
            backgroundColor: theme.background,
        },
        grid: {
            flexDirection: "row",
            gap: GAP,
        },
        week: {
            gap: GAP,
        },
        cell: (size: number, level: number, selected: boolean) => ({
            width: size,
            height: size,
            borderRadius: theme.margins.md,
            backgroundColor: levels[level],
            borderWidth: theme.margins.xs,
            borderColor: selected ? theme.colours.secondary.main : "transparent",
        }),
        // Days after today keep their slot so the last column stays aligned with the rest.
        spacer: (size: number) => ({
            width: size,
            height: size,
        }),
        labels: {
            width: LABELWIDTH,
            gap: GAP,
        },
        label: (size: number) => ({
            height: size,
            lineHeight: size,
            fontSize: size - 1,
            color: theme.colours.grey.main,
        }),
        months: {
            flexDirection: "row",
            gap: GAP,
        },
        month: (width: number, size: number) => ({
            width,
            fontSize: size - 1,
            color: theme.colours.grey.main,
        }),
    };
});

export const level = (count: number, max: number) => (count === 0 ? 0 : Math.ceil((count / max) * LEVELS));

// One bucket per UTC day: the grid is drawn in UTC, and so is every log entry.
const countByDay = (dates: DateTime[]) =>
    dates.reduce<Record<string, number>>((acc, date) => {
        const day = date.toUTC().toISODate() as string;
        acc[day] = (acc[day] || 0) + 1;
        return acc;
    }, {});

// Consecutive columns sharing a month, so the header can label a month once over its own width.
// A month that only shows one column is left unlabelled rather than overflowing into its neighbour.
const monthSegments = (weeks: DateTime[][]) =>
    weeks.reduce<{ month: number; label: string; weeks: number }[]>((acc, week) => {
        const month = week[0].month;
        const last = acc[acc.length - 1];
        if (last && last.month === month) {
            last.weeks += 1;
            return acc;
        }
        return [...acc, { month, label: week[0].toFormat("MMM"), weeks: 1 }];
    }, []);

export const QsoHeatmap = () => {
    const qsos = useQsos();
    const filters = useStore((state) => state.filters);
    const updateFilters = useStore((state) => state.updateFilters);
    const updateSetting = useStore((state) => state.updateSetting);
    const settings = useSettings();
    const [selected, setSelected] = React.useState<string | undefined>(undefined);
    const smallScreen = useWidthMatches(undefined, "md");
    const scroll = React.useRef<ScrollView>(null);

    const size = smallScreen ? 9 : 11;

    // Whole weeks ending with the one containing today, so the last column is the current week.
    const today = DateTime.utc().startOf("day");
    const todayIso = today.toISODate() as string;
    const startIso = today
        .startOf("week")
        .minus({ weeks: WEEKS - 1 })
        .toISODate() as string;

    const weeks = React.useMemo(() => {
        const start = DateTime.fromISO(startIso, { zone: "utc" });
        return Array.from({ length: WEEKS }, (_, w) =>
            Array.from({ length: DAYS }, (_, d) => start.plus({ weeks: w, days: d })),
        );
    }, [startIso]);

    // The heatmap honours the same filters as the list below it, minus the date ones a cell sets
    // itself — those would collapse the whole grid down to the single day just picked.
    const counts = React.useMemo(
        () =>
            countByDay(
                filterQsos(
                    qsos,
                    filters.filter((f) => !dateFilters.includes(f.name)),
                ).map((q) => q.date),
            ),
        [qsos, filters],
    );

    const days = React.useMemo(() => weeks.flat().map((d) => counts[d.toISODate() as string] || 0), [weeks, counts]);
    const max = Math.max(...days, 1);
    const total = days.reduce((acc, c) => acc + c, 0);

    const handlePress = (date: DateTime) => () => {
        const iso = date.toISODate() as string;
        const others = filters.filter((f) => !dateFilters.includes(f.name));
        if (selected === iso) {
            setSelected(undefined);
            updateFilters(others);
            return;
        }
        setSelected(iso);
        updateFilters([
            ...others,
            { name: "year", values: [String(date.year)] },
            { name: "month", values: [String(date.month)] },
            { name: "day", values: [String(date.day)] },
        ]);
    };

    const selectedDate = selected ? DateTime.fromISO(selected, { zone: "utc" }) : undefined;

    return (
        <Stack style={styles.container}>
            <Stack direction="row" gap="xxl">
                <Typography variant="em">{smallScreen ? "Activity:" : "QSO Activity:"}</Typography>
                <Typography variant="subtitle" style={{ flexGrow: 1 }}>
                    {selectedDate
                        ? `${selectedDate.toFormat(settings.datemonth ? "MM-dd-yyyy" : "dd/MM/yyyy")}: ${
                              counts[selected as string] || 0
                          } QSOs`
                        : `${total} QSOs over the last year`}
                </Typography>
                {!smallScreen && (
                    <Stack direction="row" gap="md">
                        <Typography variant="subtitle">Less</Typography>
                        {Array.from({ length: LEVELS + 1 }, (_, l) => (
                            <View key={l} style={styles.cell(size, l, false)} />
                        ))}
                        <Typography variant="subtitle">More</Typography>
                    </Stack>
                )}
                <Button startIcon="close" onPress={() => updateSetting("showHeatmap", false)} style={{ flexGrow: 0 }} />
            </Stack>
            <ScrollView
                horizontal
                ref={scroll}
                showsHorizontalScrollIndicator={false}
                // Centred while the grid fits, scrollable from the left edge once it doesn't.
                contentContainerStyle={{ flexGrow: 1, justifyContent: "center" }}
                // The recent weeks are the interesting end, so the grid starts scrolled to it.
                onContentSizeChange={() => scroll.current?.scrollToEnd({ animated: false })}
            >
                <View>
                    <View style={styles.months}>
                        <View style={styles.spacer(LABELWIDTH)} />
                        {monthSegments(weeks).map((segment, s) => (
                            <Typography
                                key={s}
                                style={styles.month(segment.weeks * (size + GAP) - GAP, size)}
                            >
                                {segment.weeks > 1 ? segment.label : ""}
                            </Typography>
                        ))}
                    </View>
                    <View style={styles.grid}>
                        <View style={styles.labels}>
                            {dayLabels.map((label, d) => (
                                <Typography key={d} style={styles.label(size)}>
                                    {label}
                                </Typography>
                            ))}
                        </View>
                        {weeks.map((week, w) => (
                            <View key={w} style={styles.week}>
                                {week.map((date) => {
                                    const iso = date.toISODate() as string;
                                    if (iso > todayIso) return <View key={iso} style={styles.spacer(size)} />;
                                    const count = counts[iso] || 0;
                                    return (
                                        <Pressable
                                            key={iso}
                                            accessibilityLabel={`${count} QSOs on ${iso}`}
                                            onPress={handlePress(date)}
                                            style={styles.cell(size, level(count, max), selected === iso)}
                                        />
                                    );
                                })}
                            </View>
                        ))}
                    </View>
                </View>
            </ScrollView>
        </Stack>
    );
};
