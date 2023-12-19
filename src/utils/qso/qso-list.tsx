import debounce from "debounce";
import React, { useEffect } from "react";
import { View, ViewStyle } from "react-native";
import BigList from "react-native-big-list";
import { QSO } from ".";
import { Typography } from "../theme/components/typography";
import { QsoListItem } from "./qso-list-item";
import { QsoRow } from "./qso-row";

const qsos2sections = (qsos: QSO[]): QSO[][] =>
    Object.values(
        qsos.reduce<Record<string, QSO[]>>((sections, qso) => {
            const title = qso.date.toFormat("dd/MM/yyyy");
            sections[title] = [...(sections[title] || []), qso];
            return sections;
        }, {}),
    );

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

    const refresh = debounce(() => {
        setSections(qsos2sections(applyFilters(qsos, filters)));
    }, 250);

    useEffect(refresh, [qsos, filters]);

    return (
        <BigList
            style={style}
            placeholder
            stickySectionHeadersEnabled={false}
            sections={sections}
            keyExtractor={(item) => item.id}
            renderItem={({ item, index }) => <QsoListItem {...{ onQsoPress, item, index }} />}
            renderHeader={() => <QsoRow header position="ID" time="Time" callsign="Callsign" name="Name" band="Band" />}
            renderSectionHeader={(section) => (
                <View>
                    <View
                        style={{
                            flex: 1,
                            paddingHorizontal: 5,
                            paddingVertical: 3,
                            display: "flex",
                            alignItems: "center",
                            borderStyle: "solid",
                            borderColor: "black",
                            borderTopWidth: 1,
                            borderBottomWidth: 1,
                            backgroundColor: "white",
                        }}
                    >
                        <Typography>{sections[section][0].date.toFormat("dd/MM/yyyy")}</Typography>
                    </View>
                </View>
            )}
            renderFooter={() => <></>}
            itemHeight={28}
            headerHeight={28}
            sectionHeaderHeight={28}
        />
    );
};
