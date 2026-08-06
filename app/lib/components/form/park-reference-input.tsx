import React, { useEffect } from "react";
import { useFormContext } from "react-hook-form";
import links from "../../data/potawwfflinks.json";
import { EventType, capitalise, eventDataMap } from "../../utils/event-rules";
import { Button } from "../../utils/theme/components/button";
import { Input } from "../../utils/theme/components/input";
import { QSO } from "../qso";
import { ReferenceInfo } from "../reference-info";
import { Stack } from "../stack";

export type ParkReferenceInputProps = {
    event: EventType;
    mine?: boolean;
};

const flip = (obj: Record<string, string>): Record<string, string> =>
    Object.fromEntries(Object.entries(obj).map((a) => a.reverse()));
const linksFlipped = flip(links);

export const ParkReferenceInput = ({ event, mine = false }: ParkReferenceInputProps) => {
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

    const handleHintClick = () => setValue(otherKey, hint);

    return (
        <Stack>
            <Input value={value} onChangeText={(v) => setValue(key, v.toUpperCase())} />
            <ReferenceInfo event={event} reference={value} data={eventDataMap[event]} />
            {hint && (
                <Button
                    variant="chip"
                    colour="secondary"
                    text={`Match found for ${otherEvent}`}
                    onPress={handleHintClick}
                />
            )}
        </Stack>
    );
};
