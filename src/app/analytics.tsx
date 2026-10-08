import { useLocalSearchParams } from "expo-router";
import React from "react";
import { View } from "react-native";
import { StyleSheet } from "react-native-unistyles";
import { AwardOverview } from "../lib/components/analytics/award-overview";
import { StatsTable } from "../lib/components/analytics/stats-table";
import { UnitList } from "../lib/components/analytics/unit-list";
import { Filters, useFilteredQsos } from "../lib/components/filters";
import { PageLayout } from "../lib/components/page-layout";
import { Stack } from "../lib/components/stack";
import { TabsLayout } from "../lib/components/tabs-layout";
import { Button } from "../lib/ui/button";
import { Typography } from "../lib/ui/typography";
import { unitLogs } from "../lib/utils/award-progress";
import { AwardKey, awards } from "../lib/utils/awards";

// Short names other screens link with, e.g. /analytics?award=was&tab=list. Overview and list are
// both views of the Awards tab; stats is a tab of its own.
type AwardView = "overview" | "list";

const styles = StyleSheet.create((theme) => ({
    picker: {
        flexDirection: "row",
        flexWrap: "wrap",
        alignItems: "center",
        gap: theme.margins.lg,
    },
    award: {
        flex: 0,
        minWidth: 100,
    },
    views: {
        flexDirection: "row",
        flexWrap: "wrap",
        alignItems: "center",
        gap: theme.margins.lg,
    },
    // Its own spot at the end of the view toggle, so it stays put whatever the picker wraps to.
    title: {
        flexGrow: 1,
        textAlign: "right",
    },
    view: (shown: boolean) => ({
        display: shown ? "flex" : "none",
    }),
}));

const Analytics = () => {
    const params = useLocalSearchParams<{ tab?: string; award?: string }>();
    const [award, setAward] = React.useState<AwardKey>(
        params.award && params.award in awards ? (params.award as AwardKey) : "dxcc",
    );
    // The log filters apply to every tab, so they sit above them: a filter left on from the log
    // screen would otherwise quietly shrink the counts.
    const qsos = useFilteredQsos();
    const logs = React.useMemo(() => unitLogs(qsos, awards[award].unitOf), [qsos, award]);
    const current = awards[award];
    const [view, setView] = React.useState<AwardView>(params.tab === "list" ? "list" : "overview");

    return (
        <PageLayout title="Analytics">
            <Stack>
                <Filters />
                {/* The award picker sits inside Awards, over the two views that depend on it: Stats
                    is the same whichever award is picked, so it's a tab of its own beside them. */}
                <TabsLayout tabs={["Awards", "Stats"]} initial={params.tab === "stats" ? 1 : 0}>
                    <Stack gap="lg">
                        <View style={styles.picker}>
                            {Object.values(awards).map((a) => (
                                <Button
                                    key={a.key}
                                    text={a.label}
                                    variant={a.key === award ? "contained" : "outlined"}
                                    style={styles.award}
                                    onPress={() => setAward(a.key)}
                                />
                            ))}
                        </View>
                        <View style={styles.views}>
                            {(
                                [
                                    ["overview", "Overview"],
                                    ["list", current.listTitle],
                                ] as [AwardView, string][]
                            ).map(([key, label]) => (
                                <View key={key}>
                                    <Button
                                        variant="chip"
                                        colour={view === key ? "primary" : "grey"}
                                        text={label}
                                        onPress={() => setView(key)}
                                    />
                                </View>
                            ))}
                            <Typography variant="subtitle" style={styles.title}>
                                {current.title}
                            </Typography>
                        </View>
                        {/* Both stay mounted, like tabs, so the list keeps its search and sort while
                            the overview is up. Keyed on the award so a selection or filter from one
                            doesn't carry over to the next. */}
                        <View style={styles.view(view === "overview")}>
                            <AwardOverview key={award} award={current} logs={logs} />
                        </View>
                        <View style={styles.view(view === "list")}>
                            <UnitList key={award} award={current} logs={logs} />
                        </View>
                    </Stack>
                    <StatsTable />
                </TabsLayout>
            </Stack>
        </PageLayout>
    );
};

export default Analytics;
