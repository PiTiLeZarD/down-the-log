import React from "react";
import { Pressable, View, ViewStyle } from "react-native";
import BigList from "react-native-big-list";
import { createStyleSheet, useStyles } from "react-native-unistyles";
import { QSO } from ".";
import { Modal } from "../../utils/modal";
import { useStore } from "../../utils/store";
import { Button } from "../../utils/theme/components/button";
import { mergeStyles } from "../../utils/theme/components/styles";
import { Typography } from "../../utils/theme/components/typography";
import { useSettings } from "../../utils/use-settings";
import { useThrottle } from "../../utils/use-throttle";
import { Stack } from "../stack";
import { QsoListItem } from "./qso-list-item";
import { QsoMap } from "./qso-map";
import { QsoRow } from "./qso-row";

const qsos2sections = (qsos: QSO[]): QSO[][] =>
    Object.values(
        qsos.reduce<Record<string, QSO[]>>((sections, qso, index) => {
            qso.position = qsos.length - index - 1;
            const title = qso.date.toFormat("dd/MM/yyyy");
            sections[title] = [...(sections[title] || []), qso];
            return sections;
        }, {}),
    );

const LINEHEIGHT = 28;

const stylesheet = createStyleSheet((theme) => ({
    biglist: {
        backgroundColor: theme.background,
    },
    sectionHeader: {
        flex: 1,
        display: "flex",
        alignItems: "center",
        borderStyle: "solid",
        borderColor: theme.colours.primary[theme.shades.darker],
        borderTopWidth: 1,
        borderBottomWidth: 1,
        backgroundColor: theme.colours.primary[theme.shades.lighter],
    },
    sectionHeaderText: {
        lineHeight: LINEHEIGHT,
    },
}));

export type QsoListSectionHeaderProps = {
    section: number;
    sections: QSO[][];
};

export type QsoListSectionHeaderComponent = React.FC<QsoListSectionHeaderProps>;
``;
export const QsoListSectionHeader: QsoListSectionHeaderComponent = ({ section, sections }): JSX.Element => {
    const [mapOpen, setmapOpen] = React.useState<boolean>(false);
    const settings = useSettings();
    const { styles } = useStyles(stylesheet);
    const text = `${sections[section][0].date.toFormat(settings.datemonth ? "MM-dd-yyyy" : "dd/MM/yyyy")} (${sections[section].length})`;

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
                        <QsoMap qsos={sections[section]} width={640} height={640} />
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

export type QsoListComponent = React.FC<QsoListProps>;

const applyFilters = (qsos: QSO[], filters: QsoListProps["filters"]) =>
    filters ? qsos.filter((qso) => filters.reduce((facc, f) => facc && f(qso), true)) : qsos;

export const QsoList: QsoListComponent = ({ style, filters, qsos, onQsoPress }): JSX.Element => {
    const { styles } = useStyles(stylesheet);
    const settings = useStore((state) => state.settings);
    const launch = (q: QSO[], f: QsoListProps["filters"]) => qsos2sections(applyFilters(q, f));
    const throttled = useThrottle(launch, 250);
    const sections = throttled(qsos, filters);

    if (!sections) return <></>;

    return (
        <BigList
            style={mergeStyles<ViewStyle>(styles.biglist, style)}
            placeholder
            stickySectionHeadersEnabled={false}
            sections={sections}
            keyExtractor={(item) => item.id}
            renderItem={({ item, index }) => (
                <QsoListItem {...{ onQsoPress, item, index, lineHeight: LINEHEIGHT, imperial: settings.imperial }} />
            )}
            renderHeader={() => (
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
            )}
            renderSectionHeader={(section) => <QsoListSectionHeader section={section} sections={sections} />}
            renderFooter={() => <></>}
            itemHeight={LINEHEIGHT}
            headerHeight={LINEHEIGHT}
            sectionHeaderHeight={LINEHEIGHT}
        />
    );
};
