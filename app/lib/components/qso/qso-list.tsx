import React from "react";
import { FlatList, Pressable, View, ViewStyle } from "react-native";
import { StyleSheet } from "react-native-unistyles";
import { QSO } from ".";
import { Modal } from "../../utils/modal";
import { useStore } from "../../utils/store";
import { Button } from "../../ui/button";
import { mergeStyles } from "../../ui/styles";
import { Typography } from "../../ui/typography";
import { useSettings } from "../../utils/use-settings";
import { Stack } from "../stack";
import { QsoListItem } from "./qso-list-item";
import { QsoMap } from "./qso-map";
import { QsoRow } from "./qso-row";

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
};

export const QsoListSectionHeader = ({ qsos }: QsoListSectionHeaderProps) => {
    const [mapOpen, setmapOpen] = React.useState<boolean>(false);
    const settings = useSettings();
    const text = `${qsos[0].date.toFormat(settings.datemonth ? "MM-dd-yyyy" : "dd/MM/yyyy")} (${qsos.length})`;

    if (!settings.google || !settings.google.key || !settings.google.secret) {
        return (
            <View>
                <View style={styles.sectionHeader}>
                    <Typography style={styles.sectionHeaderText}>{text}</Typography>
                </View>
            </View>
        );
    }

    return (
        <Pressable onPress={() => setmapOpen(!mapOpen)}>
            <Stack style={styles.sectionHeader}>
                <Typography style={styles.sectionHeaderText}>{text}</Typography>
                <Modal wide open={mapOpen} onClose={() => setmapOpen(false)}>
                    <Stack gap="xl">
                        <QsoMap qsos={qsos} width={640} height={640} />
                        <Button text="Ok" colour="success" onPress={() => setmapOpen(false)} />
                    </Stack>
                </Modal>
            </Stack>
        </Pressable>
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

    return (
        // The wrapper carries the theming: FlatList isn't processed by unistyles, so a stylesheet handed
        // straight to it would arrive empty.
        <View style={mergeStyles<ViewStyle>(styles.list, style)}>
            <FlatList
                data={rows}
                extraData={settings.imperial}
                keyExtractor={(row) => row.key}
                initialNumToRender={40}
                renderItem={({ item: row }) =>
                    row.kind === "section" ? (
                        <QsoListSectionHeader qsos={row.qsos} />
                    ) : (
                        <QsoListItem
                            {...{
                                onQsoPress,
                                item: row.qso,
                                index: row.index,
                                lineHeight: LINEHEIGHT,
                                imperial: settings.imperial,
                            }}
                        />
                    )
                }
                ListHeaderComponent={
                    <QsoRow
                        header
                        lineHeight={LINEHEIGHT}
                        position="ID"
                        time="Time"
                        duration="Duration"
                        callsign="Callsign"
                        name="Name"
                        band="Band"
                    />
                }
            />
        </View>
    );
};
