import React, { useEffect } from "react";
import { useFormContext } from "react-hook-form";
import links from "../../data/potawwfflinks.json";
import { EventType, capitalise, eventDataMap } from "../../utils/event-rules";
import { Button } from "../../ui/button";
import { Input } from "../../ui/input";
import { QSO } from "../qso";
import { ReferenceInfo } from "../reference-info";
import { Stack } from "../stack";

export type ParkReferenceInputProps = {
    event: EventType;
    mine?: boolean;
    // Told which field the cross reference was just written into. The QSO form draws every programme
    // already, but a session only draws the fields it holds — activating a park that is also a WWFF
    // has to add that field to the session or the value has nowhere to live.
    onCrossFill?: (field: keyof QSO) => void;
};

const flip = (obj: Record<string, string>): Record<string, string> =>
    Object.fromEntries(Object.entries(obj).map((a) => a.reverse()));
const linksFlipped = flip(links);

export const ParkReferenceInput = ({ event, mine = false, onCrossFill }: ParkReferenceInputProps) => {
    const { getValues, setValue, watch } = useFormContext<QSO>();
    const key = (mine ? `my${capitalise(event)}` : event) as keyof QSO;
    const value = watch(key) as string;

    const otherEvent = event === "wwff" ? "pota" : "wwff";
    const otherKey = (mine ? `my${capitalise(otherEvent)}` : otherEvent) as keyof QSO;
    const otherValue = watch(otherKey) as string;

    // The POTA <-> WWFF cross reference is a derivation of the two fields, no state needed: filling the
    // other reference in is exactly what makes the chip go away.
    const eventLinks: Record<string, string> = event === "pota" ? links : linksFlipped;
    const hint =
        ["wwff", "pota"].includes(event) && value && !otherValue ? eventLinks[value] || undefined : undefined;

    useEffect(() => {
        if (!(value in eventDataMap[event])) return;

        const { name, locator } = eventDataMap[event][value];
        const qthKey = (mine ? `myQth` : "qth") as keyof QSO;
        const locatorKey = (mine ? `myLocator` : "locator") as keyof QSO;
        const qso = getValues();
        if (qso[qthKey] != name) setValue(qthKey, name);
        if (qso[locatorKey] != locator) setValue(locatorKey, locator);
    }, [value, event, mine, getValues, setValue]);

    const handleHintClick = () => {
        setValue(otherKey, hint);
        onCrossFill?.(otherKey);
    };

    return (
        <Stack>
            <Input value={value} onChangeText={(v) => setValue(key, v.toUpperCase())} />
            <ReferenceInfo event={event} reference={value} data={eventDataMap[event]} />
            {hint && (
                <Button
                    variant="chip"
                    colour="primary"
                    startIcon="add"
                    text={`Also ${otherEvent.toUpperCase()} ${hint}`}
                    numberOfLines={1}
                    onPress={handleHintClick}
                />
            )}
        </Stack>
    );
};
