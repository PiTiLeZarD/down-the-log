import { useRouter } from "expo-router";
import React from "react";
import { View } from "react-native";
import { unique } from "../utils/arrays";
import { EventType, capitalise, eventDataMap } from "../utils/event-rules";
import { useStore } from "../utils/store";
import { Alert } from "../utils/theme/components/alert";
import { Button } from "../utils/theme/components/button";
import { Typography } from "../utils/theme/components/typography";
import { QSO, useQsos } from "./qso";
import { Stack } from "./stack";

export type MissingReferencesWarningProps = {
    event: EventType;
};

export type MissingReferencesWarningComponent = React.FC<MissingReferencesWarningProps>;

export const MissingReferencesWarning: MissingReferencesWarningComponent = ({ event }): JSX.Element => {
    const updateFilters = useStore((state) => state.updateFilters);
    const { navigate } = useRouter();
    const references = unique(
        useQsos()
            .map((q) => [q[event], q[`my${capitalise(event)}` as keyof QSO]])
            .flat(),
    )
        .filter((e) => !!e)
        .filter((ref) => !((ref as string) in eventDataMap[event]));

    if (event === "sig" || references.length === 0) return <></>;
    return (
        <Alert severity="warning">
            <Stack direction="row" style={{ width: "95%" }}>
                <Typography style={{ flexGrow: 1 }}>You have {references.length} missing references</Typography>
                <View style={{ flex: 1 }}>
                    <Button
                        text="Check them here"
                        onPress={() => {
                            updateFilters([{ name: event, values: references }]);
                            navigate("/");
                        }}
                    />
                </View>
            </Stack>
        </Alert>
    );
};
