import { Redirect } from "expo-router";

// Stats became the last tab of Analytics; this keeps old links and bookmarks landing on it.
const Stats = () => <Redirect href="/analytics?tab=stats" />;

export default Stats;
