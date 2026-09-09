import { View } from "react-native";
import { StyleSheet } from "react-native-unistyles";
import { Alert } from "../../ui/alert";
import { Button } from "../../ui/button";
import { Typography } from "../../ui/typography";
import { useStore } from "../../utils/store";
import { QSO, findMatchingQsos, useQsos } from "../qso";
import { Stack } from "../stack";
import { QSL_IGNORED, UnmatchedQsl, confirmQso } from "./index";

// A day either side. The importer's own window is 20 minutes, which is the point: everything in
// here already failed that, so the candidate list has to be wide enough to show the QSO whose clock
// disagrees by an hour — or by a whole UTC day, the usual near-midnight case.
const CANDIDATE_WINDOW_MINUTES = 24 * 60;

const styles = StyleSheet.create((theme) => ({
    row: {
        borderTopWidth: 1,
        borderTopColor: theme.colours.grey.light,
        paddingTop: theme.margins.md,
    },
}));

const describe = (qso: QSO) =>
    [qso.date.toFormat("yyyy-MM-dd HH:mm"), qso.band, qso.mode].filter((s) => !!s).join(" · ");

export type UnmatchedQslsProps = {
    unmatched: UnmatchedQsl[];
    onClear: () => void;
};

export const UnmatchedQsls = ({ unmatched, onClear }: UnmatchedQslsProps) => {
    const qsos = useQsos();
    const log = useStore((state) => state.log);
    const resolutions = useStore((state) => state.qslResolutions);
    const resolveQsl = useStore((state) => state.resolveQsl);

    const handleMatch = (item: UnmatchedQsl, target: QSO) => () => {
        const confirmed = confirmQso(target, item.record);
        if (confirmed) log(confirmed);
        resolveQsl(item.key, target.id);
    };

    return (
        <Stack gap="lg">
            <Typography variant="h3">Unmatched confirmations ({unmatched.length})</Typography>
            <Alert severity="info">
                <Typography>
                    These confirmations name a contact the log couldn&apos;t place within 20 minutes of the QSO. Pick
                    the QSO each one belongs to and it will be remembered, so importing the same download again
                    won&apos;t ask twice.
                </Typography>
            </Alert>

            {unmatched.map((item) => {
                const resolved = resolutions[item.key];
                const target = resolved && resolved !== QSL_IGNORED ? qsos.find((q) => q.id === resolved) : undefined;
                // Sorted by how far off the clocks are: the likeliest answer is the closest one.
                const candidates = findMatchingQsos(qsos, item.record, CANDIDATE_WINDOW_MINUTES).sort(
                    (qa, qb) =>
                        Math.abs(qa.date.diff(item.record.date).toMillis()) -
                        Math.abs(qb.date.diff(item.record.date).toMillis()),
                );

                return (
                    <View key={item.key} style={styles.row}>
                        <Stack>
                            <Typography variant="h4">{item.record.callsign}</Typography>
                            <Typography variant="subtitle">{describe(item.record)}</Typography>

                            {resolved ? (
                                <Stack direction="row" gap="md">
                                    <Typography>
                                        {resolved === QSL_IGNORED
                                            ? "Ignored"
                                            : target
                                              ? `Matched to ${target.callsign} · ${describe(target)}`
                                              : "Matched to a QSO that is no longer in the log"}
                                    </Typography>
                                    <View>
                                        <Button
                                            variant="chip"
                                            colour="grey"
                                            text="Undo"
                                            // Only the remembered answer goes: a confirmation already
                                            // written to the QSO stays, the same way nothing else in the
                                            // app takes one back.
                                            onPress={() => resolveQsl(item.key, null)}
                                        />
                                    </View>
                                </Stack>
                            ) : (
                                <Stack gap="sm">
                                    {candidates.length ? (
                                        candidates.map((candidate) => (
                                            <Button
                                                key={candidate.id}
                                                variant="outlined"
                                                startIcon="link-outline"
                                                text={`${candidate.callsign} · ${describe(candidate)}`}
                                                onPress={handleMatch(item, candidate)}
                                            />
                                        ))
                                    ) : (
                                        <Typography variant="subtitle">
                                            No QSO with this callsign within a day of it — this contact is probably
                                            not in this log.
                                        </Typography>
                                    )}
                                    <Stack direction="row">
                                        <View>
                                            <Button
                                                variant="chip"
                                                colour="grey"
                                                text="Ignore"
                                                onPress={() => resolveQsl(item.key, QSL_IGNORED)}
                                            />
                                        </View>
                                    </Stack>
                                </Stack>
                            )}
                        </Stack>
                    </View>
                );
            })}

            <Stack direction="row">
                <View>
                    <Button variant="chip" colour="grey" text="Clear list" onPress={onClear} />
                </View>
            </Stack>
        </Stack>
    );
};
