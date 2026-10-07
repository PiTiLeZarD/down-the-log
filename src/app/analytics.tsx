import { useLocalSearchParams } from "expo-router";
import React from "react";
import { CountryList } from "../lib/components/analytics/country-list";
import { DxccOverview } from "../lib/components/analytics/dxcc-overview";
import { StatsTable } from "../lib/components/analytics/stats-table";
import { Filters, useFilteredQsos } from "../lib/components/filters";
import { PageLayout } from "../lib/components/page-layout";
import { Stack } from "../lib/components/stack";
import { TabsLayout } from "../lib/components/tabs-layout";
import { entityLogs } from "../lib/utils/dxcc-progress";

const tabs = ["Overview", "Country List", "Stats"];
// Short names other screens link with, e.g. /analytics?tab=stats.
const tabParams = ["overview", "countries", "stats"];

const Analytics = () => {
    const { tab } = useLocalSearchParams<{ tab?: string }>();
    // The log filters apply to every tab, so they sit above them: a filter left on from the log
    // screen would otherwise quietly shrink the counts.
    const qsos = useFilteredQsos();
    const logs = React.useMemo(() => entityLogs(qsos), [qsos]);

    return (
        <PageLayout title="Analytics">
            <Stack>
                <Filters />
                <TabsLayout tabs={tabs} initial={Math.max(0, tabParams.indexOf(tab ?? ""))}>
                    <DxccOverview logs={logs} />
                    <CountryList logs={logs} />
                    <StatsTable />
                </TabsLayout>
            </Stack>
        </PageLayout>
    );
};

export default Analytics;
