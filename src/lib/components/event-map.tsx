import React from "react";
import { EventActivations, EventType, eventDataMap } from "../utils/event-rules";
import { maidenhead2Latlong } from "../utils/locator";
import { Typography } from "../ui/typography";
import { Map } from "./osm-map/map";
import { Marker } from "./osm-map/marker";
import { Reference } from "./reference";
import { Stack } from "./stack";

const TREE = "#2e7d32";
const SELECTED_TREE = "#c62828";

export type EventMapProps = {
    event: EventType;
    activations: EventActivations;
    max?: number;
};

export const EventMap = ({ event, activations, max }: EventMapProps) => {
    const [selected, setSelected] = React.useState<string | null>(null);

    const references = Object.keys(activations);
    const located = references
        .map((reference) => ({ reference, locator: eventDataMap[event][reference]?.locator }))
        .filter((r): r is { reference: string; locator: string } => !!r.locator);

    // A reference selected before the log changed may not be on the map any more.
    const current = selected && activations[selected] ? selected : null;
    // Drawn last so an overlapping neighbour can't hide the one whose details are on screen, which
    // is also what makes it the marker a second tap in that spot resolves to.
    const ordered = [...located].sort((a, b) => Number(a.reference === current) - Number(b.reference === current));

    const missing = references.length - located.length;

    if (!located.length) {
        return <Typography>No references with a known location to show on a map</Typography>;
    }

    return (
        <Stack>
            <Map height={400} interactive>
                {ordered.map(({ reference, locator }) => (
                    <Marker
                        key={reference}
                        location={maidenhead2Latlong(locator)}
                        // The label is not drawn on a tree pin, it only names the marker for
                        // screen readers.
                        style={{ icon: "tree", label: reference, color: reference === current ? SELECTED_TREE : TREE }}
                        onPress={() => setSelected(reference)}
                    />
                ))}
            </Map>
            {!!missing && (
                <Typography variant="subtitle">
                    {missing} reference{missing > 1 ? "s" : ""} not shown, no known location
                </Typography>
            )}
            {current ? (
                <Reference
                    position={0}
                    event={event}
                    reference={current}
                    activations={activations[current]}
                    max={max}
                />
            ) : (
                <Typography>Tap a tree to see its activations</Typography>
            )}
        </Stack>
    );
};
