import React, { useEffect } from "react";
import { useFormContext } from "react-hook-form";
import links from "../../data/potawwfflinks.json";
import { EventType, capitalise, eventDataMap } from "../../utils/event-rules";
import { Input } from "../../utils/theme/components/input";
import { QSO } from "../qso";
import { ReferenceInfo } from "../reference-info";
import { Stack } from "../stack";

export type ReferenceInputProps = {
    event: EventType;
    mine?: boolean;
};

const flip = (obj: Record<string, string>): Record<string, string> =>
    Object.fromEntries(Object.entries(obj).map((a) => a.reverse()));
const linksFlipped = flip(links);

export type ReferenceInputComponent = React.FC<ReferenceInputProps>;

export const ReferenceInput: ReferenceInputComponent = ({ event, mine = false }): JSX.Element => {
    const { getValues, setValue } = useFormContext<QSO>();
    const qso = getValues();
    const key = (mine ? `my${capitalise(event)}` : event) as keyof QSO;
    const value = qso[key] as string;

    useEffect(() => {
        if (value in eventDataMap[event]) {
            const { name, locator } = eventDataMap[event][value];
            const qthKey = (mine ? `myQth` : "qth") as keyof QSO;
            const locatorKey = (mine ? `myLocator` : "locator") as keyof QSO;
            if (qso[qthKey] != name) setValue(qthKey, name);
            if (qso[locatorKey] != locator) setValue(locatorKey, locator);
        }

        if (["wwff", "pota"].includes(event)) {
            const otherEvent = event === "wwff" ? "pota" : "wwff";
            const otherKey = (mine ? `my${capitalise(otherEvent)}` : otherEvent) as keyof QSO;
            const otherValue = qso[otherKey] as string;

            const eventLinks: Record<string, string> = event === "pota" ? links : linksFlipped;
            if (value && !otherValue && value in eventLinks) {
                setValue(otherKey, eventLinks[value]);
            }
        }
    }, [value]);

    return (
        <Stack>
            <Input value={value} onChangeText={(v) => setValue(key, v.toUpperCase())} />
            <ReferenceInfo event={event} reference={value} data={eventDataMap[event]} />
        </Stack>
    );
};
