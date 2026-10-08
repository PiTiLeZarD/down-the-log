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

// Short names other screens link with, e.g. /analytics?award=was&tab=list.
const tabParams = ["overview", "list", "stats"];

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

    return (
        <PageLayout title="Analytics">
            <Stack>
                <Filters />
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
                    <Typography variant="subtitle">{current.title}</Typography>
                </View>
                <TabsLayout
                    tabs={["Overview", current.listTitle, "Stats"]}
                    initial={Math.max(0, tabParams.indexOf(params.tab ?? ""))}
                >
                    {/* Keyed on the award so a selection or filter from one doesn't carry over. */}
                    <AwardOverview key={award} award={current} logs={logs} />
                    <UnitList key={award} award={current} logs={logs} />
                    <StatsTable />
                </TabsLayout>
            </Stack>
        </PageLayout>
    );
};

export default Analytics;
