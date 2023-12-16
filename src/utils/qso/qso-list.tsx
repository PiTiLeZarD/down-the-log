import React from "react";
import { SectionList, View } from "react-native";
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
};

export type QsoListComponent = React.FC<QsoListProps>;

export const QsoList: QsoListComponent = ({ qsos, onQsoPress }): JSX.Element => (
    <SectionList
        ListHeaderComponent={<QsoRow header position="ID" time="Time" callsign="Callsign" name="Name" band="Band" />}
        sections={qsos2sections(qsos)}
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
