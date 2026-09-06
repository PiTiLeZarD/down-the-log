import React from "react";
import { EventType } from "../../utils/event-rules";
import { searchReferences } from "../../utils/reference-search";
import { Button } from "../../ui/button";
import { Stack } from "../stack";

export type ReferenceSuggestionsProps = {
    event: EventType;
    query?: string;
    onPick: (reference: string) => void;
};

// Shown whenever the box holds something that isn't a reference yet — no focus tracking. Hiding the
// list on blur would take it away before the tap that picked one of its entries ever landed.
export const ReferenceSuggestions = ({ event, query, onPick }: ReferenceSuggestionsProps) => {
    const matches = React.useMemo(() => searchReferences(event, query), [event, query]);
    if (matches.length === 0) return <></>;

    return (
        <Stack>
            {matches.map(({ reference, name }) => (
                <Button
                    key={reference}
                    variant="chip"
                    colour="secondary"
                    numberOfLines={1}
                    text={`${reference} ${name}`}
                    onPress={() => onPick(reference)}
                />
            ))}
        </Stack>
    );
};
