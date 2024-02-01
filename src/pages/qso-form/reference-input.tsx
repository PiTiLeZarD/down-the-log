import React from "react";
import { useFormContext } from "react-hook-form";
import { QSO } from "../../utils/qso";
import { Stack } from "../../utils/stack";
import { Input } from "../../utils/theme/components/input";
import { EventType, capitalise, eventDataMap } from "../events/rules";
import { ReferenceInfo } from "./reference-info";

export type ReferenceInputProps = {
    event: EventType;
    mine?: boolean;
};

export type ReferenceInputComponent = React.FC<ReferenceInputProps>;

export const ReferenceInput: ReferenceInputComponent = ({ event, mine = false }): JSX.Element => {
    const { getValues, setValue } = useFormContext<QSO>();
    const qso = getValues();
    const key = (mine ? `my${capitalise(event)}` : event) as keyof QSO;
    const value = qso[key] as string;

    if (["wwff", "pota"].includes(event)) {
        const otherEvent = event === "wwff" ? "pota" : "wwff";
        const otherKey = (mine ? `my${capitalise(otherEvent)}` : otherEvent) as keyof QSO;
        const otherValue = qso[otherKey] as string;

        if (!value && otherValue && otherValue in eventDataMap[otherEvent]) {
            const newRef = Object.entries(eventDataMap[event]).find(
                ([ref, { name }]) => name.toLowerCase() === eventDataMap[otherEvent][otherValue].name.toLowerCase(),
            );
            if (newRef) {
                setValue(key, newRef[0]);
            }
        }
    }

    return (
        <Stack>
            <Input value={value} onChangeText={(v) => setValue(key, v.toUpperCase())} />
            <ReferenceInfo reference={value} data={eventDataMap[event]} />
        </Stack>
    );
};
