import React from "react";
import { unique } from "../utils/arrays";
import { corners2Path, fixLatLngForMercator, maidenhead2Corners, maidenhead2Latlong } from "../utils/locator";
import { latlng2coord } from "../utils/polygon";
import { TILE_LENGTH, TotaActivation } from "../utils/tota";
import { Typography } from "../ui/typography";
import { Map } from "./osm-map/map";
import { Marker } from "./osm-map/marker";
import { Path } from "./osm-map/path";
import { Stack } from "./stack";
import { TotaActivationRow } from "./tota-activation";

const TILE = "#7aa7ff";
const SELECTED_TILE = "#c62828";

export type TotaMapProps = {
    activations: TotaActivation[];
};

export const TotaMap = ({ activations }: TotaMapProps) => {
    const [selected, setSelected] = React.useState<string | null>(null);

    const tiles = unique(activations.map((a) => a.tile));
    // A tile selected before the log changed may not be on the map any more.
    const current = selected && tiles.includes(selected) ? selected : null;
    // Drawn last so an overlapping neighbour can't hide the one whose activations are on screen.
    const ordered = [...tiles].sort((t1, t2) => Number(t1 === current) - Number(t2 === current));

    if (!tiles.length) return <Typography>No tiles activated yet</Typography>;

    const tileSquare = (tile: string) => {
        const [c1, c2] = maidenhead2Corners(tile, TILE_LENGTH);
        const colour = tile === current ? SELECTED_TILE : TILE;
        return (
            <Path
                key={`tile-${tile}`}
                style={{ color: colour, fillcolor: colour, weight: 1 }}
                polygon={corners2Path(fixLatLngForMercator(c1), fixLatLngForMercator(c2)).map(latlng2coord)}
            />
        );
    };

    return (
        <Stack>
            <Map height={400} interactive>
                {ordered.map(tileSquare)}
                {ordered.map((tile) => (
                    <Marker
                        key={tile}
                        location={maidenhead2Latlong(tile)}
                        style={{
                            // A tile is small enough that its box disappears when the map is zoomed
                            // out to a whole log, so the pin is what stays tappable.
                            size: tiles.length === 1 ? undefined : "tiny",
                            caption: tile,
                            color: tile === current ? SELECTED_TILE : TILE,
                        }}
                        onPress={() => setSelected(tile)}
                    />
                ))}
            </Map>
            {current ? (
                activations
                    .filter((a) => a.tile === current)
                    .map((activation, i) => (
                        <TotaActivationRow
                            key={`${activation.tile}/${activation.date}`}
                            position={i}
                            activation={activation}
                        />
                    ))
            ) : (
                <Typography>Tap a tile to see its activations</Typography>
            )}
        </Stack>
    );
};
