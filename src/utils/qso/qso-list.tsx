import debounce from "debounce";
import React, { useEffect } from "react";
import { View, ViewStyle } from "react-native";
import BigList from "react-native-big-list";
import { createStyleSheet, useStyles } from "react-native-unistyles";
import { QSO } from ".";
import { useStore } from "../../store";
import { Typography } from "../theme/components/typography";
import { QsoListItem } from "./qso-list-item";
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
    const [sections, setSections] = React.useState<QSO[][]>(qsos2sections(applyFilters(qsos, filters)));
    const settings = useStore((state) => state.settings);
    const { styles } = useStyles(stylesheet);

    useEffect(
        debounce(() => {
            setSections(qsos2sections(applyFilters(qsos, filters)));
        }, 250),
        [qsos, filters],
    );

    return (
        <BigList
            style={style}
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
                    callsign="Callsign"
                    name="Name"
                    band="Band"
                />
            )}
            renderSectionHeader={(section) => (
                <View>
                    <View style={styles.sectionHeader}>
                        <Typography style={styles.sectionHeaderText}>
                            {sections[section][0].date.toFormat("dd/MM/yyyy")} ({sections[section].length})
                        </Typography>
                    </View>
                </View>
            )}
            renderFooter={() => <></>}
            itemHeight={LINEHEIGHT}
            headerHeight={LINEHEIGHT}
            sectionHeaderHeight={LINEHEIGHT}
        />
    );
};
