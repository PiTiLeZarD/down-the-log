import React from "react";
import { useFormContext } from "react-hook-form";
import { View } from "react-native";
import { Alert } from "../ui/alert";
import { Button } from "../ui/button";
import { Typography } from "../ui/typography";
import { QsoIssue, getQsoIssues, ignoreIssue, issueFieldLabel, issueKey, restoreIssue } from "../utils/qso-issues";
import { QSO } from "./qso";
import { Stack } from "./stack";

export type QsoIssueLineProps = {
    issue: QsoIssue;
    action: string;
    variant?: "body" | "subtitle";
    onPress: () => void;
};

const QsoIssueLine = ({ issue, action, variant = "body", onPress }: QsoIssueLineProps) => (
    <Stack direction="row">
        <Typography variant={variant} style={{ flexGrow: 1 }}>
            {issueFieldLabel(issue.field)}: {issue.description}
        </Typography>
        <View>
            <Button variant="chip" colour="grey" text={action} onPress={onPress} />
        </View>
    </Stack>
);

// Both halves work off the form rather than the saved QSO, so a line leaves as soon as the field is
// fixed, without waiting for the autosave to come back around.
const useIssues = () => {
    const { watch, setValue } = useFormContext<QSO>();
    const qso = watch() as QSO;

    return {
        qso,
        issues: getQsoIssues(qso),
        // undefined rather than [] so a QSO that never ignored anything doesn't gain the field, and an
        // ADIF export doesn't gain an empty tag.
        setIgnored: (keys: string[]) => setValue("ignoredIssues", keys.length ? keys : undefined),
    };
};

export const QsoIssues = () => {
    const { qso, issues, setIgnored } = useIssues();
    const open = issues.filter((issue) => !issue.ignored);

    if (open.length === 0) return <></>;

    return (
        <Alert severity="danger">
            <Stack style={{ flexGrow: 1 }} gap="sm">
                <Typography variant="em">
                    {open.length === 1 ? "1 issue" : `${open.length} issues`} with this QSO
                </Typography>
                {open.map((issue) => (
                    <QsoIssueLine
                        key={issueKey(issue)}
                        issue={issue}
                        action="Ignore"
                        onPress={() => setIgnored(ignoreIssue(qso.ignoredIssues, issue))}
                    />
                ))}
            </Stack>
        </Alert>
    );
};

// Deliberately not an Alert and parked at the foot of the form: these are the ones the operator has
// already decided are fine, so they only have to stay findable, not visible.
export const QsoIgnoredIssues = () => {
    const { qso, issues, setIgnored } = useIssues();
    const [expanded, setExpanded] = React.useState<boolean>(false);
    const ignored = issues.filter((issue) => issue.ignored);

    if (ignored.length === 0) return <></>;

    return (
        <Stack gap="sm">
            <Button
                variant="chip"
                colour="grey"
                startIcon={expanded ? "arrow-up" : "arrow-down"}
                text={`${ignored.length} ignored ${ignored.length === 1 ? "issue" : "issues"}`}
                onPress={() => setExpanded(!expanded)}
            />
            {expanded &&
                ignored.map((issue) => (
                    <QsoIssueLine
                        key={issueKey(issue)}
                        issue={issue}
                        action="Restore"
                        variant="subtitle"
                        onPress={() => setIgnored(restoreIssue(qso.ignoredIssues, issue))}
                    />
                ))}
        </Stack>
    );
};
