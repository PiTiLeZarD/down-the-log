import React, { useEffect } from "react";
import { useFormContext } from "react-hook-form";
import links from "../../data/potawwfflinks.json";
import { EventType, capitalise, eventDataMap } from "../../utils/event-rules";
import { completeSotaReference, formatSotaReference } from "../../utils/sota-reference";
import { Button } from "../../ui/button";
import { Input } from "../../ui/input";
import { QSO } from "../qso";
import { ReferenceInfo } from "../reference-info";
import { Stack } from "../stack";
import { ReferenceSuggestions } from "./reference-suggestions";

export type ParkReferenceInputProps = {
    event: EventType;
    mine?: boolean;
    // Told which field the cross reference was just written into. The QSO form draws every programme
    // already, but a session only draws the fields it holds — activating a park that is also a WWFF
    // has to add that field to the session or the value has nowhere to live.
    onCrossFill?: (field: keyof QSO) => void;
};

// Only SOTA has a shape rigid enough to type for the operator — see `formatSotaReference`. The other
// programmes number their references however they like, so their boxes only fold the case.
const upperCase = (v: string) => v.toUpperCase();

const flip = (obj: Record<string, string>): Record<string, string> =>
    Object.fromEntries(Object.entries(obj).map((a) => a.reverse()));
const linksFlipped = flip(links);

export const ParkReferenceInput = ({ event, mine = false, onCrossFill }: ParkReferenceInputProps) => {
    const { getValues, setValue, watch } = useFormContext<QSO>();
    const key = (mine ? `my${capitalise(event)}` : event) as keyof QSO;
    // An untouched field watches as undefined, and everything below — the mask, the search, the
    // cross reference lookup — reads it as a string.
    const value = (watch(key) as string) || "";

    const otherEvent = event === "wwff" ? "pota" : "wwff";
    const otherKey = (mine ? `my${capitalise(otherEvent)}` : otherEvent) as keyof QSO;
    const otherValue = (watch(otherKey) as string) || "";

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

    const transformValue = event === "sota" ? formatSotaReference : upperCase;

    return (
        <Stack>
            <Input
                value={value}
                transformValue={transformValue}
                onChangeText={(v) => setValue(key, v)}
                // A number is only padded out to its three digits once the box is left: doing it on
                // every keystroke would turn the 1 of a 150 into 001 before the 5 was ever typed.
                onBlur={() => event === "sota" && setValue(key, completeSotaReference(value))}
            />
            <ReferenceSuggestions event={event} query={value} onPick={(reference) => setValue(key, reference)} />
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
