import React from "react";
import { FlatList, Pressable, View, ViewStyle } from "react-native";
import { StyleSheet } from "react-native-unistyles";
import { QSO } from ".";
import { Modal } from "../../utils/modal";
import { hasOpenIssues } from "../../utils/qso-issues";
import { sessionLabels } from "../../utils/session";
import { SpineInfo, sessionSpines } from "../../utils/session-spine";
import { useStore } from "../../utils/store";
import { useWidthMatches } from "../../ui/breakpoints";
import { Button } from "../../ui/button";
import { mergeStyles } from "../../ui/styles";
import { Typography } from "../../ui/typography";
import { useSettings } from "../../utils/use-settings";
import { Stack } from "../stack";
import { QsoListItem } from "./qso-list-item";
import { QsoMap } from "./qso-map";
import { QsoRow } from "./qso-row";
import { SessionSpine } from "./session-spine";

// position is a display concern, so it goes on a copy: writing it onto the QSO itself would
// stamp a render-order field onto the persisted store.
const qsos2sections = (qsos: QSO[]): QSO[][] =>
    Object.values(
        qsos.reduce<Record<string, QSO[]>>((sections, qso, index) => {
            const positioned = { ...qso, position: qsos.length - index - 1 };
            const title = positioned.date.toFormat("dd/MM/yyyy");
            sections[title] = [...(sections[title] || []), positioned];
            return sections;
        }, {}),
    );

// SectionList can't give exact layout without hand-rolling the index maths, so the grouped log is
// flattened into one row list instead and the header rows are told apart by `kind`.
type Row = { kind: "section"; key: string; qsos: QSO[] } | { kind: "qso"; key: string; qso: QSO; index: number };

const sections2rows = (sections: QSO[][]): Row[] =>
    sections.flatMap((qsos, section) => [
        { kind: "section" as const, key: `section-${section}`, qsos },
        ...qsos.map((qso, index) => ({ kind: "qso" as const, key: qso.id, qso, index })),
    ]);

// The spine logic works off the rendered row order alone, so the rows are handed over as the two
// things it needs to know about each one: whether it's a QSO, and which session it belongs to.
const rows2spineRows = (rows: Row[]) =>
    rows.map((row) => ({
        key: row.key,
        qso: row.kind === "qso",
        sessionId: row.kind === "qso" ? row.qso.sessionId : undefined,
    }));

const LINEHEIGHT = 28;

const styles = StyleSheet.create((theme) => ({
    list: {
        flexGrow: 1,
        backgroundColor: theme.background,
    },
    sectionHeader: {
        flex: 1,
        display: "flex",
        alignItems: "center",
        borderStyle: "solid",
        borderColor: theme.colours.primary.darker,
        borderTopWidth: 1,
        borderBottomWidth: 1,
        backgroundColor: theme.colours.primary.lighter,
    },
    sectionHeaderText: {
        lineHeight: LINEHEIGHT,
    },
}));

export type QsoListSectionHeaderProps = {
    qsos: QSO[];
    spine?: SpineInfo;
    onSpinePress?: (sessionId: string) => void;
};

export const QsoListSectionHeader = ({ qsos, spine, onSpinePress }: QsoListSectionHeaderProps) => {
    const [mapOpen, setmapOpen] = React.useState<boolean>(false);
    const settings = useSettings();
    const text = `${qsos[0].date.toFormat(settings.datemonth ? "MM-dd-yyyy" : "dd/MM/yyyy")} (${qsos.length})`;

    // The modal is deliberately a sibling of the Pressable, not a child. RN renders it through a
    // portal, but presses still bubble up the React tree, so nesting it made every press inside the
    // modal that no control claimed toggle the header and close it again.
    return (
        <>
            <Pressable onPress={() => setmapOpen(true)}>
                <Stack style={styles.sectionHeader}>
                    <Typography style={styles.sectionHeaderText}>{text}</Typography>
                </Stack>
                {spine && <SessionSpine spine={spine} onPress={onSpinePress} />}
            </Pressable>
            <Modal wide open={mapOpen} onClose={() => setmapOpen(false)}>
                <Stack gap="xl">
                    <QsoMap qsos={qsos} height={640} interactive />
                    <Button text="Ok" colour="success" onPress={() => setmapOpen(false)} />
                </Stack>
            </Modal>
        </>
    );
};

export type QsoListProps = {
    qsos: QSO[];
    onQsoPress: (qso: QSO) => void;
    filters?: ((qso: QSO) => boolean)[];
    style?: ViewStyle;
};

const applyFilters = (qsos: QSO[], filters: QsoListProps["filters"]) =>
    filters ? qsos.filter((qso) => filters.reduce((facc, f) => facc && f(qso), true)) : qsos;

export const QsoList = ({ style, filters, qsos, onQsoPress }: QsoListProps) => {
    const settings = useStore((state) => state.settings);
    // Both props have to be referentially stable for this to hold: a fresh row array on every render
    // re-runs the grouping over the whole log.
    const rows = React.useMemo(() => sections2rows(qsos2sections(applyFilters(qsos, filters))), [qsos, filters]);

    // A phone row is already one line of callsign, band and icons with nothing to spare, so the
    // bracket and the gutter it needs are left to the screens with room for them.
    const wide = useWidthMatches("md");
    const spines: Record<string, SpineInfo> = React.useMemo(
        () => (wide ? sessionSpines(rows2spineRows(rows)) : {}),
        [rows, wide],
    );
    const gutter = Object.keys(spines).length > 0;
    const extraData = React.useMemo(() => ({ imperial: settings.imperial, spines }), [settings.imperial, spines]);

    // Pressing a bracket filters the log down to its session. Replaces any session filter already
    // set rather than adding to it — two sessions at once is what the filter modal is for. Read off
    // the store at press time rather than subscribed: the rows are memoised, so a handler closing
    // over the filters would keep whichever ones were set when the row last rendered.
    const handleSpinePress = React.useCallback((sessionId: string) => {
        const { sessions, filters: current, updateFilters } = useStore.getState();
        const label = sessionLabels(sessions)[sessionId];
        if (!label) return;
        updateFilters([...current.filter((f) => f.name !== "session"), { name: "session", values: [label] }]);
    }, []);

    return (
        // The wrapper carries the theming: FlatList isn't processed by unistyles, so a stylesheet handed
        // straight to it would arrive empty.
        <View style={mergeStyles<ViewStyle>(styles.list, style)}>
            {/* A sibling of the list rather than its ListHeaderComponent, so the column titles stay
                put and the rows scroll under them. */}
            <QsoRow
                header
                gutter={gutter}
                lineHeight={LINEHEIGHT}
                position="ID"
                time="Time"
                duration="Duration"
                callsign="Callsign"
                name="Name"
                band="Band"
            />
            <FlatList
                // Plain object, not a unistyles sheet: FlatList isn't processed, so a sheet arrives
                // empty here. Takes whatever height the pinned header leaves.
                style={{ flex: 1 }}
                data={rows}
                // The spines belong in here as well as the units: they can change while the row
                // list itself doesn't — resizing the window past `md` is exactly that — and the
                // FlatList would otherwise have no reason to ask for the rows again.
                extraData={extraData}
                keyExtractor={(row) => row.key}
                initialNumToRender={40}
                renderItem={({ item: row }) =>
                    row.kind === "section" ? (
                        <QsoListSectionHeader qsos={row.qsos} spine={spines[row.key]} onSpinePress={handleSpinePress} />
                    ) : (
                        <QsoListItem
                            {...{
                                onQsoPress,
                                item: row.qso,
                                index: row.index,
                                openIssues: hasOpenIssues(row.qso),
                                lineHeight: LINEHEIGHT,
                                imperial: settings.imperial,
                                gutter,
                                spine: spines[row.key],
                                onSpinePress: handleSpinePress,
                            }}
                        />
                    )
                }
            />
        </View>
    );
};
