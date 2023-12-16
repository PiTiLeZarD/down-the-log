import React from "react";
import { SectionList, View } from "react-native";
import { freq2band } from "../../data/bands";
import { useStore } from "../../store";
import { findCountry, getCallsignData } from "../../utils/callsign";
import { maidenDistance } from "../../utils/locator";
import { QSO } from "../../utils/qso";
import { Stack } from "../../utils/stack";
import { Typography } from "../../utils/theme/components/typography";
import { Qso } from "./qso";

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

export type QsoListItemProps = {
    item: QSO;
    index: number;
    onQsoPress: QsoListProps["onQsoPress"];
};

export type QsoListItemComponent = React.FC<QsoListItemProps>;

export const QsoListItem: QsoListItemComponent = React.memo(
    ({ item: qso, index, onQsoPress }): JSX.Element => {
        const currentLocation = useStore((state) => state.currentLocation);
        const callsignData = getCallsignData(qso.callsign);
        return (
            <Qso
                position={String(index + 1)}
                time={qso.date.toFormat("HH:mm")}
                callsign={
                    <Stack direction="row">
                        <Typography>{findCountry(callsignData)?.flag}</Typography>
                        <Typography>{qso.callsign}</Typography>
                        <Typography>
                            ({maidenDistance(currentLocation, qso.locator || callsignData?.gs || currentLocation)}
                            km)
                        </Typography>
                    </Stack>
                }
                name={qso.name || "N/A"}
                band={`${qso.frequency ? freq2band(+qso.frequency) || "N/A" : "N/A"} (${qso.mode || "N/A"})`}
                onPress={() => onQsoPress(qso)}
            />
        );
    },
    (prevProps, nextProps) => nextProps.item.id === prevProps.item.id,
);

export type QsoListProps = {
    qsos: QSO[];
    onQsoPress: (qso: QSO) => void;
};

export type QsoListComponent = React.FC<QsoListProps>;

export const QsoList: QsoListComponent = ({ qsos, onQsoPress }): JSX.Element => (
    <SectionList
        ListHeaderComponent={<Qso header position="ID" time="Time" callsign="Callsign" name="Name" band="Band" />}
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
