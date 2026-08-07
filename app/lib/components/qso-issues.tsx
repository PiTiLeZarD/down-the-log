import { useFormContext } from "react-hook-form";
import { Alert } from "../ui/alert";
import { Typography } from "../ui/typography";
import { getQsoIssues, issueFieldLabel } from "../utils/qso-issues";
import { QSO } from "./qso";
import { Stack } from "./stack";

// Watching the whole form rather than the saved QSO is what makes this useful: the list clears field
// by field as the operator fixes things, without waiting for the autosave to come back around.
export const QsoIssues = () => {
    const { watch } = useFormContext<QSO>();
    const issues = getQsoIssues(watch() as QSO);

    if (issues.length === 0) return <></>;

    return (
        <Alert severity="danger">
            <Stack style={{ flexGrow: 1 }} gap="sm">
                <Typography variant="em">
                    {issues.length === 1 ? "1 issue" : `${issues.length} issues`} with this QSO
                </Typography>
                {issues.map((issue) => (
                    <Typography key={`${issue.field}-${issue.description}`}>
                        {issueFieldLabel(issue.field)}: {issue.description}
                    </Typography>
                ))}
            </Stack>
        </Alert>
    );
};
