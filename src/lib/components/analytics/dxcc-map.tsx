import React from "react";
import { GestureResponderEvent, LayoutChangeEvent, Pressable, View } from "react-native";
import Svg, { Circle, G, Path } from "react-native-svg";
import { entities } from "../../data/cty";
import dxccPolygons from "../../data/dxcc.json";
import { maidenhead2Latlong } from "../../utils/locator";
import { decode, findZone } from "../../utils/polydec";
import { EntityStatus } from "../../utils/dxcc-progress";
import { useAnalyticsColours } from "./colours";

// Plain equirectangular, one unit per degree. The far south is only ocean and the Antarctic
// coastline, so it's cut off to keep the land big; the Arctic islands that count still fit.
const NORTH = 84;
const SOUTH = -60;
const WIDTH = 360;
const HEIGHT = NORTH - SOUTH;
// Anything smaller than this either way is a speck at any width the map is shown at, so it gets a
// dot as well once it's worked. That's most of the islands, which are most of what DXCC chases.
const SPECK = 1.5;
const DOT = 1.6;
// A tap this close to a dot picks it, so a speck stays easy to hit with a finger.
const DOT_SLOP = 3;

type Shape = { dxcc: number; d: string; dot?: { x: number; y: number } };

const x = (lng: number) => lng + 180;
const y = (lat: number) => NORTH - lat;

let shapes: Shape[] | undefined;
// Decoded on first use rather than at import, and once: ~15k points is too many to redo per render.
const getShapes = (): Shape[] => {
    if (shapes) return shapes;
    const polygons = dxccPolygons as Record<string, string[]>;
    shapes = Object.values(entities).map(({ dxcc, gs }) => {
        const encoded = polygons[String(dxcc).padStart(3, "0")];
        if (!encoded) {
            // A handful of entities have no outline in the source; their reference grid places them.
            const { latitude, longitude } = maidenhead2Latlong(gs);
            return { dxcc, d: "", dot: { x: x(longitude), y: y(latitude) } };
        }
        let south = 90;
        let north = -90;
        let west = 180;
        let east = -180;
        const d = encoded
            .map((e) => {
                let previous = "";
                const points: string[] = [];
                for (const [lat, lng] of decode(e)) {
                    south = Math.min(south, lat);
                    north = Math.max(north, lat);
                    west = Math.min(west, lng);
                    east = Math.max(east, lng);
                    // A tenth of a degree is under a pixel at any size this is drawn at, and
                    // dropping the repeats it creates trims the path by about a tenth.
                    const point = `${x(lng).toFixed(1)},${y(lat).toFixed(1)}`;
                    if (point !== previous) points.push(point);
                    previous = point;
                }
                return points.length > 2 ? `M${points.join("L")}Z` : "";
            })
            .join("");
        const speck = north - south < SPECK && east - west < SPECK;
        return { dxcc, d, dot: speck ? { x: x((west + east) / 2), y: y((south + north) / 2) } : undefined };
    });
    return shapes;
};

export type DxccMapProps = {
    status: (dxcc: number) => EntityStatus;
    selected?: number;
    onSelect?: (dxcc: number) => void;
};

export const DxccMap = ({ status, selected, onSelect }: DxccMapProps) => {
    const colours = useAnalyticsColours();
    const [width, setWidth] = React.useState<number>(0);
    const coloured = getShapes().map((s) => ({ ...s, status: status(s.dxcc) }));

    // One handler for the whole map, hit-tested here: react-native-svg on web hands a shape's
    // press handlers to the DOM element as responder props, which React rejects for every path.
    const handlePress = (e: GestureResponderEvent) => {
        if (!onSelect || !width) return;
        // A click on web arrives as a plain MouseEvent, with no locationX/Y but an offsetX/Y
        // against the same element.
        const event = e.nativeEvent as GestureResponderEvent["nativeEvent"] & { offsetX?: number; offsetY?: number };
        const scale = WIDTH / width;
        const px = (event.locationX ?? event.offsetX ?? 0) * scale;
        const py = (event.locationY ?? event.offsetY ?? 0) * scale;
        const dot = coloured.find(
            ({ dot, status }) => dot && status !== "missing" && Math.hypot(dot.x - px, dot.y - py) < DOT_SLOP,
        );
        const dxcc = dot?.dxcc ?? +findZone(dxccPolygons, { latitude: NORTH - py, longitude: px - 180 });
        if (dxcc && entities[dxcc]) onSelect(dxcc);
    };

    return (
        <Pressable
            style={{ width: "100%", aspectRatio: WIDTH / HEIGHT }}
            onLayout={(e: LayoutChangeEvent) => setWidth(e.nativeEvent.layout.width)}
            onPress={handlePress}
        >
            {/* Taps land on the Pressable, so locationX/Y are measured against the whole map. */}
            <View style={{ flex: 1, pointerEvents: "none" }}>
                <Svg width="100%" height="100%" viewBox={`0 0 ${WIDTH} ${HEIGHT}`}>
                    {coloured.map(({ dxcc, d, status }) =>
                        d ? (
                            <Path
                                key={dxcc}
                                d={d}
                                fill={colours.status[status]}
                                fillRule="evenodd"
                                stroke={dxcc === selected ? colours.text : colours.background}
                                strokeWidth={dxcc === selected ? 0.4 : 0.15}
                            />
                        ) : null,
                    )}
                    <G>
                        {coloured.map(({ dxcc, dot, status }) =>
                            dot && (status !== "missing" || dxcc === selected) ? (
                                <Circle
                                    key={dxcc}
                                    cx={dot.x}
                                    cy={dot.y}
                                    r={DOT}
                                    fill={colours.status[status]}
                                    stroke={dxcc === selected ? colours.text : colours.background}
                                    strokeWidth={0.3}
                                />
                            ) : null,
                        )}
                    </G>
                </Svg>
            </View>
        </Pressable>
    );
};
