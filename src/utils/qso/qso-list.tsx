import debounce from "debounce";
import React, { useEffect } from "react";
import { SectionList, View, ViewStyle } from "react-native";
import { QSO } from ".";
import { Typography } from "../../utils/theme/components/typography";
import { QsoListItem } from "./qso-list-item";
import { QsoRow } from "./qso-row";

type QSOSection = {
    title: string;
    data: QSO[];
};

const qsos2sections = (qsos: QSO[]): QSOSection[] =>
    Object.entries(
        qsos.reduce<Record<string, QSO[]>>((sections, qso) => {
            const title = qso.date.toFormat("dd/MM/yyyy");
            sections[title] = [...(sections[title] || []), qso];
            return sections;
        }, {}),
    ).map(([title, data]) => ({ title, data }) as QSOSection);

export type QsoListProps = {
    qsos: QSO[];
    onQsoPress: (qso: QSO) => void;
    filters?: ((qso: QSO) => boolean)[];
    style?: ViewStyle;
};

export type QsoListComponent = React.FC<QsoListProps>;

const applyFilters = (sections: QSOSection[], filters: QsoListProps["filters"]) =>
    sections.reduce<QSOSection[]>((all, section) => {
        if (filters) {
            section.data = section.data.filter((qso) => filters.reduce((facc, f) => facc && f(qso), true));
        }
        if (section.data.length) {
            all.push(section);
        }
        return all;
    }, []);

export const QsoList: QsoListComponent = ({ style, filters, qsos, onQsoPress }): JSX.Element => {
    const [sections, setSections] = React.useState<QSOSection[]>(qsos2sections(qsos));

    const refresh = debounce(() => {
        setSections(applyFilters(qsos2sections(qsos), filters));
    }, 250);

    useEffect(refresh, [qsos, filters]);

    return (
        <SectionList
            style={style}
            ListHeaderComponent={
                <QsoRow header position="ID" time="Time" callsign="Callsign" name="Name" band="Band" />
            }
            sections={sections}
            keyExtractor={(item) => item.id}
            initialNumToRender={25}
            renderItem={({ item, index }) => <QsoListItem {...{ onQsoPress, item, index }} />}
            renderSectionHeader={({ section }) => (
                <View
                    style={{
                        paddingHorizontal: 5,
                        paddingVertical: 3,
                        display: "flex",
                        alignItems: "center",
                        borderStyle: "solid",
                        borderColor: "black",
                        borderTopWidth: 1,
                        borderBottomWidth: 1,
                    }}
                >
                    <Typography style={{ fontWeight: "bold" }}>{section.title}</Typography>
                </View>
            )}
        />
    );
};
