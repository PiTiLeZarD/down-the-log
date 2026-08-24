import { Image } from "expo-image";
import React, { PropsWithChildren } from "react";
import { GestureResponderEvent, LayoutChangeEvent, Platform, Pressable, Text, View, ViewStyle } from "react-native";
import Svg, { Circle, Path as SvgPath, Rect, Text as SvgText } from "react-native-svg";
import { LatLng } from "../../utils/locator";
import { Feature, FeatureMarkerStyle, FeaturePathStyle, MarkerFeature, PathFeature, resolveColor } from "./common";
import {
    MAX_ZOOM,
    TILE_SIZE,
    World,
    boundsOf,
    geodesicPoints,
    project,
    unwrapLongitudes,
    zoomToFit,
} from "./projection";

const TILE_URL = "https://tile.openstreetmap.org";
// The OSM tile usage policy wants a real identifying User-Agent. Browsers set their own and ignore
// this, but the native image loaders would otherwise send a generic one.
const TILE_HEADERS = { "User-Agent": "down-the-log (https://github.com/PiTiLeZarD/down-the-log)" };
// Enough room for the tallest pin to stay inside the viewport once the bounds are fitted.
const DEFAULT_PADDING = 32;

// Panning and zooming happen in discrete steps off buttons rather than off gestures, so a pan
// never has to be arbitrated against the scroll views these maps are embedded in.
const PAN_STEP = 0.25;
// Fractional zoom is already handled downstream: whole zooms pick the tile level and the remainder
// scales the tiles, so a half step is as valid as a whole one.
const ZOOM_STEP = 0.5;
// Thin enough to leave the map readable, wide enough to stay a usable touch target on mobile.
const EDGE = 28;
// The pan strips are as thin as they are on purpose, so the shortfall against the 44px touch target
// guidance is taken up by hitSlop rather than by eating more of the map.
const EDGE_SLOP = 8;
// Square controls, comfortably past the point where a near miss is likely.
const BUTTON = 40;

// A double tap recentres on the tapped point, so it earns a bigger jump than the +/- buttons.
const DOUBLE_TAP_ZOOM_STEP = 1;
const DOUBLE_TAP_MS = 300;
// Fingers move between the two taps; without this only a pixel-perfect repeat would register.
const DOUBLE_TAP_SLOP = 20;

const blurhash =
    "|rF?hV%2WCj[ayj[a|j[az_NaeWBj@ayfRayfQfQM{M|azj[azf6fQfQfQIpWXofj[ayj[j[fQayWCoeoeaya}j[ayfQa{oLj?j[WVj[ayayj[fQoff7azayj[ayj[j[ayofayayayj[fQj[ayayj[ayfjj[j[ayjuayj[";

// A path is drawn through every intermediate point, so a geodesic leg has to be sampled before it
// gets projected. Longitudes are unwrapped afterwards to keep the drawn line on the short side.
const pathPoints = (feature: PathFeature): LatLng[] => {
    const style = (feature.style || {}) as Partial<FeaturePathStyle>;
    const points = style.geodesic
        ? feature.points.flatMap((point, i, all) => (i === 0 ? [point] : geodesicPoints(all[i - 1], point).slice(1)))
        : feature.points;
    return unwrapLongitudes(points);
};

// Features are unwrapped independently, so they also have to be pulled onto the same turn of the
// globe as each other. Without this a marker at 179°E and its path leg at 181°E would blow the
// fitted bounds out to the whole world.
const shiftToReference = (points: LatLng[], reference: number): LatLng[] => {
    let shift = 0;
    while (points[0].longitude + shift - reference > 180) shift -= 360;
    while (points[0].longitude + shift - reference < -180) shift += 360;
    return shift ? points.map((p) => ({ ...p, longitude: p.longitude + shift })) : points;
};

const toSvgPoints = (points: World[], zoom: number, origin: World) =>
    points.map((p) => ({ x: p.x * 2 ** zoom - origin.x, y: p.y * 2 ** zoom - origin.y }));

const toSvgPathData = (points: { x: number; y: number }[]) =>
    points.map((p, i) => `${i ? "L" : "M"}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(" ");

const MARKER_RADIUS: Record<string, number> = { tiny: 4, small: 6, mid: 8 };

// Every marker shape is drawn standing on the point it marks, so the tap target reaches upwards
// from it rather than being centred on it.
const MARKER_HIT_WIDTH = 26;
const MARKER_HIT_ABOVE = 37;
const MARKER_HIT_BELOW = 4;

// Centre of the pin's head, and the radius of the hole punched out of it.
const PIN_HEAD = 24;
const PIN_HOLE = 7.5;
const TRUNK_COLOR = "#6b4423";
const TREE_COLOR = "#2e7d32";

// A teardrop pin with a tree standing in the hole, rather than the hole being left empty. The tree
// keeps its own colours so the pin body stays free to carry state.
const TreePin = ({ x, y, color }: { x: number; y: number; color: string }) => {
    const cy = y - PIN_HEAD;
    return (
        <>
            <SvgPath
                d={`M${x},${y} L${x - 8},${y - 27} L${x + 8},${y - 27} Z`}
                fill={color}
                stroke="#ffffff"
                strokeWidth={1.5}
            />
            <Circle cx={x} cy={cy} r={11} fill={color} stroke="#ffffff" strokeWidth={1.5} />
            <Circle cx={x} cy={cy} r={PIN_HOLE} fill="#ffffff" />
            <SvgPath
                d={`M${x - 1},${cy + 5.5} L${x + 1},${cy + 5.5} L${x + 1},${cy + 1} L${x - 1},${cy + 1} Z`}
                fill={TRUNK_COLOR}
            />
            <SvgPath d={`M${x - 5},${cy + 2.5} L${x + 5},${cy + 2.5} L${x},${cy - 2} Z`} fill={TREE_COLOR} />
            <SvgPath d={`M${x - 4},${cy - 0.5} L${x + 4},${cy - 0.5} L${x},${cy - 6} Z`} fill={TREE_COLOR} />
        </>
    );
};

const MarkerShape = ({ x, y, style }: { x: number; y: number; style?: Partial<FeatureMarkerStyle> }) => {
    const color = resolveColor(style?.color, style?.icon === "tree" ? "#2e7d32" : "#ff0000");

    if (style?.icon === "tree") return <TreePin x={x} y={y} color={color} />;

    // Google only ever drew a label on the full-size pin; the smaller sizes were plain dots.
    if (style?.size) {
        return (
            <Circle cx={x} cy={y} r={MARKER_RADIUS[style.size] || 6} fill={color} stroke="#ffffff" strokeWidth={1.5} />
        );
    }

    return (
        <>
            <SvgPath
                d={`M${x},${y} L${x - 6.5},${y - 14} L${x + 6.5},${y - 14} Z`}
                fill={color}
                stroke="#ffffff"
                strokeWidth={1.5}
            />
            <Circle cx={x} cy={y - 19} r={9} fill={color} stroke="#ffffff" strokeWidth={1.5} />
            {!!style?.label && (
                <SvgText x={x} y={y - 15} fontSize={11} fontWeight="bold" fill="#ffffff" textAnchor="middle">
                    {style.label.substring(0, 1).toUpperCase()}
                </SvgText>
            )}
        </>
    );
};

// A caption is measured rather than laid out, so its box needs a width from the string alone. The
// factor is the widest the bold face gets for the uppercase alphanumerics callsigns are made of.
const CAPTION_FONT = 11;
const CAPTION_CHAR = 7;
const CAPTION_PAD = 5;
const CAPTION_HEIGHT = 16;
// Clear of the point itself, so the box reads as hanging off the marker rather than covering it.
const CAPTION_GAP = 4;

// Captions are drawn as their own layer above every pin, so a box is never half-hidden behind the
// marker that happens to come after it.
const MarkerCaption = ({ x, y, text }: { x: number; y: number; text: string }) => {
    const width = text.length * CAPTION_CHAR + CAPTION_PAD * 2;
    return (
        <>
            <Rect
                x={x - width / 2}
                y={y + CAPTION_GAP}
                width={width}
                height={CAPTION_HEIGHT}
                rx={2}
                fill="#ffffff"
                fillOpacity={0.9}
                stroke="#222222"
                strokeWidth={1}
            />
            <SvgText
                x={x}
                y={y + CAPTION_GAP + CAPTION_HEIGHT - 4.5}
                fontSize={CAPTION_FONT}
                fontWeight="bold"
                fill="#222222"
                textAnchor="middle"
            >
                {text}
            </SvgText>
        </>
    );
};

// Keeps the viewport inside the world vertically; there is no map above 85°N or below 85°S to pan
// into. Longitude is deliberately not clamped, the tile loop already wraps it.
const clampCenterY = (y: number, zoom: number, height: number): number => {
    const half = height / 2 / 2 ** zoom;
    return half * 2 >= TILE_SIZE ? TILE_SIZE / 2 : Math.max(half, Math.min(TILE_SIZE - half, y));
};

const CONTROL_BACKGROUND = "rgba(255, 255, 255, 0.7)";

// A double click on the web build otherwise lands as a text selection, which drags a highlight
// across the whole map rather than zooming. react-native-web takes user-select on any node, the RN
// types only declare it for Text, and native has no mouse to drag a selection with anyway.
const NO_SELECT = (Platform.OS === "web" ? { userSelect: "none" } : null) as ViewStyle | null;

const ControlButton = ({
    label,
    accessibilityLabel,
    onPress,
    hitSlop,
    style,
}: {
    label: string;
    accessibilityLabel: string;
    onPress: () => void;
    hitSlop?: number;
    style?: object;
}) => (
    <Pressable
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel}
        onPress={onPress}
        hitSlop={hitSlop}
        style={[
            {
                alignItems: "center",
                justifyContent: "center",
                backgroundColor: CONTROL_BACKGROUND,
                cursor: "pointer",
            },
            style,
        ]}
    >
        <Text style={{ fontSize: 12, lineHeight: 14, color: "#222222" }}>{label}</Text>
    </Pressable>
);

type MapControlsProps = {
    onPan: (dx: number, dy: number) => void;
    onZoom: (delta: number) => void;
    onReset: () => void;
};

// The horizontal strips run the full width and the vertical ones are inset between them, so the
// four corners belong to exactly one button each.
const MapControls = ({ onPan, onZoom, onReset }: MapControlsProps) => (
    <>
        <ControlButton
            label="▲"
            accessibilityLabel="Pan north"
            onPress={() => onPan(0, -1)}
            hitSlop={EDGE_SLOP}
            style={{ position: "absolute", left: 0, right: 0, top: 0, height: EDGE }}
        />
        <ControlButton
            label="▼"
            accessibilityLabel="Pan south"
            onPress={() => onPan(0, 1)}
            hitSlop={EDGE_SLOP}
            style={{ position: "absolute", left: 0, right: 0, bottom: 0, height: EDGE }}
        />
        <ControlButton
            label="◀"
            accessibilityLabel="Pan west"
            onPress={() => onPan(-1, 0)}
            hitSlop={EDGE_SLOP}
            style={{ position: "absolute", left: 0, top: EDGE, bottom: EDGE, width: EDGE }}
        />
        <ControlButton
            label="▶"
            accessibilityLabel="Pan east"
            onPress={() => onPan(1, 0)}
            hitSlop={EDGE_SLOP}
            style={{ position: "absolute", right: 0, top: EDGE, bottom: EDGE, width: EDGE }}
        />
        <View style={{ position: "absolute", left: EDGE + 6, bottom: EDGE + 6, gap: 6 }}>
            <ControlButton
                label="+"
                accessibilityLabel="Zoom in"
                onPress={() => onZoom(ZOOM_STEP)}
                style={{ width: BUTTON, height: BUTTON, borderRadius: 4 }}
            />
            <ControlButton
                label="−"
                accessibilityLabel="Zoom out"
                onPress={() => onZoom(-ZOOM_STEP)}
                style={{ width: BUTTON, height: BUTTON, borderRadius: 4 }}
            />
            <ControlButton
                label="⤢"
                accessibilityLabel="Reset view"
                onPress={onReset}
                style={{ width: BUTTON, height: BUTTON, borderRadius: 4 }}
            />
        </View>
    </>
);

export type MapProps = PropsWithChildren<{
    width?: number | "auto";
    height: number;
    padding?: number;
    interactive?: boolean;
}>;

export const Map = ({ width = "auto", height, padding = DEFAULT_PADDING, interactive = false, children }: MapProps) => {
    // "auto" is measured from a zero-height probe view rather than read off a ref during render,
    // which only ever produced a width because some parent happened to re-render us.
    const [measuredWidth, setMeasuredWidth] = React.useState<number | null>(null);
    // null means "follow the fitted bounds", which is both the initial state and what the reset
    // button restores. Once set it is left alone, so adding a QSO doesn't yank the view back.
    const [view, setView] = React.useState<{ center: World; zoom: number } | null>(null);
    // Pressable has no double press of its own, so the previous one is remembered and matched
    // against the next on both time and distance.
    const lastTap = React.useRef<{ at: number; x: number; y: number } | null>(null);
    const onLayout = React.useCallback(
        ({ nativeEvent }: LayoutChangeEvent) =>
            setMeasuredWidth((current) => (current === nativeEvent.layout.width ? current : nativeEvent.layout.width)),
        [],
    );

    const features = React.Children.toArray(children)
        .filter((f) => (React.isValidElement(f) ? "renderFeature" in (f as any).type : false))
        .map((f: any) => f.type.renderFeature(f.props) as Feature | null)
        .filter((f): f is Feature => f !== null);

    const actualWidth = typeof width === "number" ? width : measuredWidth;
    const actualHeight = height;

    const reference = features.length ? features[0].points[0].longitude : 0;

    // Everything below is in zoom-0 world coordinates until the viewport is known.
    const paths = features
        .filter((f): f is PathFeature => f.type === "path")
        .map((f) => ({
            style: (f.style || {}) as Partial<FeaturePathStyle>,
            points: shiftToReference(pathPoints(f), reference).map(project),
        }));
    const markers = features
        .filter((f): f is MarkerFeature => f.type === "markers")
        .map((f) => ({
            style: f.style as Partial<FeatureMarkerStyle> | undefined,
            point: project(shiftToReference(f.points, reference)[0]),
            onPress: f.onPress,
        }));

    const bounds = boundsOf([...paths.flatMap((p) => p.points), ...markers.map((m) => m.point)]);

    if (!actualWidth || !bounds) {
        return <View style={{ width: "100%", height: 0 }} onLayout={onLayout} />;
    }

    const fit = {
        center: { x: (bounds.min.x + bounds.max.x) / 2, y: (bounds.min.y + bounds.max.y) / 2 },
        zoom: zoomToFit(bounds, actualWidth, actualHeight, padding),
    };
    const { center, zoom } = view ?? fit;

    // Top-left of the viewport in pixels at the given zoom, which is what turns a press position on
    // the map back into a world coordinate.
    const originOf = (at: { center: World; zoom: number }): World => ({
        x: at.center.x * 2 ** at.zoom - actualWidth / 2,
        y: at.center.y * 2 ** at.zoom - actualHeight / 2,
    });

    const origin = originOf({ center, zoom });

    // Steps are a fraction of the viewport, so a tap moves the same visible distance at every zoom.
    const onPan = (dx: number, dy: number) =>
        setView((current) => {
            const from = current ?? fit;
            const step = 2 ** from.zoom;
            return {
                zoom: from.zoom,
                center: {
                    x: from.center.x + (dx * actualWidth * PAN_STEP) / step,
                    y: clampCenterY(from.center.y + (dy * actualHeight * PAN_STEP) / step, from.zoom, actualHeight),
                },
            };
        });

    // Anchored on the viewport centre, which is the centre of the state, so it needs no correction.
    const onZoom = (delta: number) =>
        setView((current) => {
            const from = current ?? fit;
            const next = Math.max(0, Math.min(MAX_ZOOM, from.zoom + delta));
            return { zoom: next, center: { ...from.center, y: clampCenterY(from.center.y, next, actualHeight) } };
        });

    // Recentres on the tapped point, so the world coordinate under the finger is read at the zoom
    // the map is currently at and simply becomes the new centre.
    const onZoomAt = (x: number, y: number) =>
        setView((current) => {
            const from = current ?? fit;
            const step = 2 ** from.zoom;
            const at = originOf(from);
            const next = Math.max(0, Math.min(MAX_ZOOM, from.zoom + DOUBLE_TAP_ZOOM_STEP));
            return {
                zoom: next,
                center: { x: (at.x + x) / step, y: clampCenterY((at.y + y) / step, next, actualHeight) },
            };
        });

    const onTap = ({ nativeEvent }: GestureResponderEvent) => {
        // The event carries its own clock, which keeps this out of reach of the purity rule that a
        // Date.now() here would trip.
        const { locationX, locationY, timestamp } = nativeEvent;

        // A missing field would otherwise reach the centre as NaN, and a NaN centre renders no
        // tiles at all and survives every later zoom, leaving reset as the only way out.
        if (![locationX, locationY, timestamp].every(Number.isFinite)) return;

        const previous = lastTap.current;
        lastTap.current = { at: timestamp, x: locationX, y: locationY };

        if (
            !previous ||
            timestamp - previous.at > DOUBLE_TAP_MS ||
            Math.hypot(locationX - previous.x, locationY - previous.y) > DOUBLE_TAP_SLOP
        ) {
            return;
        }

        // Cleared so a third tap starts a fresh pair rather than zooming again off the second.
        lastTap.current = null;
        onZoomAt(locationX, locationY);
    };

    // Tiles only exist at whole zooms, so the remainder of the fitted zoom is taken out by drawing
    // them up to 2x larger than their native size.
    const tileZoom = Math.floor(zoom);
    const tileSize = TILE_SIZE * 2 ** (zoom - tileZoom);
    const tileCount = 2 ** tileZoom;

    const tiles: { key: string; url: string; left: number; top: number }[] = [];
    for (let x = Math.floor(origin.x / tileSize); x <= Math.floor((origin.x + actualWidth) / tileSize); x++) {
        for (let y = Math.floor(origin.y / tileSize); y <= Math.floor((origin.y + actualHeight) / tileSize); y++) {
            if (y < 0 || y >= tileCount) continue;
            // x wraps around the antimeridian, y does not exist past the poles.
            const wrappedX = ((x % tileCount) + tileCount) % tileCount;
            tiles.push({
                key: `${x}/${y}`,
                url: `${TILE_URL}/${tileZoom}/${wrappedX}/${y}.png`,
                left: x * tileSize - origin.x,
                top: y * tileSize - origin.y,
            });
        }
    }

    return (
        <>
            <View style={{ width: "100%", height: 0 }} onLayout={onLayout} />
            <View
                style={[
                    { width: actualWidth, height: actualHeight, overflow: "hidden", backgroundColor: "#aad3df" },
                    NO_SELECT,
                ]}
            >
                {tiles.map((tile) => (
                    <Image
                        key={tile.key}
                        source={{ uri: tile.url, headers: TILE_HEADERS }}
                        placeholder={blurhash}
                        cachePolicy="memory-disk"
                        // +1 hides the hairline seam sub-pixel tile positions leave between tiles.
                        style={{
                            position: "absolute",
                            left: tile.left,
                            top: tile.top,
                            width: tileSize + 1,
                            height: tileSize + 1,
                        }}
                    />
                ))}
                <Svg width={actualWidth} height={actualHeight} style={{ position: "absolute", left: 0, top: 0 }}>
                    {paths.map((path, i) => (
                        <SvgPath
                            key={`path-${i}`}
                            d={toSvgPathData(toSvgPoints(path.points, zoom, origin))}
                            stroke={resolveColor(path.style.color, "#0000ff")}
                            strokeWidth={path.style.weight ?? 5}
                            strokeLinejoin="round"
                            strokeLinecap="round"
                            fill={path.style.fillcolor ? resolveColor(path.style.fillcolor, "none") : "none"}
                            fillOpacity={path.style.fillcolor ? 0.3 : 0}
                        />
                    ))}
                    {markers.map((marker, i) => {
                        const [point] = toSvgPoints([marker.point], zoom, origin);
                        return <MarkerShape key={`marker-${i}`} x={point.x} y={point.y} style={marker.style} />;
                    })}
                    {markers.map((marker, i) => {
                        if (!marker.style?.caption) return null;
                        const [point] = toSvgPoints([marker.point], zoom, origin);
                        return (
                            <MarkerCaption
                                key={`caption-${i}`}
                                x={point.x}
                                y={point.y}
                                text={marker.style.caption}
                            />
                        );
                    })}
                </Svg>
                {interactive && (
                    // Sits above the drawn features but below the controls and the attribution, so
                    // those keep their presses.
                    //
                    // Deliberately the responder system rather than a Pressable: on web
                    // Pressable.onPress is dispatched from a DOM click, so its nativeEvent is a
                    // MouseEvent with no locationX/locationY/timestamp on it at all.
                    <View
                        onStartShouldSetResponder={() => true}
                        onResponderRelease={onTap}
                        style={{ position: "absolute", left: 0, top: 0, right: 0, bottom: 0 }}
                    />
                )}
                {/* Above the pan overlay, so a press on a marker is the marker's and never also a
                    half of a double tap. Real views rather than hit-testing inside the overlay,
                    which is what earns them a pointer cursor of their own on web. Later markers
                    are on top, matching the order they were drawn in. */}
                {markers.map((marker, i) => {
                    if (!marker.onPress) return null;
                    const [point] = toSvgPoints([marker.point], zoom, origin);
                    return (
                        <Pressable
                            key={`marker-hit-${i}`}
                            accessibilityRole="button"
                            accessibilityLabel={marker.style?.label || "Marker"}
                            onPress={marker.onPress}
                            style={{
                                position: "absolute",
                                left: point.x - MARKER_HIT_WIDTH / 2,
                                top: point.y - MARKER_HIT_ABOVE,
                                width: MARKER_HIT_WIDTH,
                                height: MARKER_HIT_ABOVE + MARKER_HIT_BELOW,
                                cursor: "pointer",
                            }}
                        />
                    );
                })}
                <View
                    style={{
                        position: "absolute",
                        right: 0,
                        // Rides above the southward pan strip, which would otherwise cover it.
                        bottom: interactive ? EDGE : 0,
                        paddingHorizontal: 4,
                        backgroundColor: CONTROL_BACKGROUND,
                    }}
                >
                    <Text style={{ fontSize: 9, color: "#222222" }}>© OpenStreetMap contributors</Text>
                </View>
                {interactive && <MapControls onPan={onPan} onZoom={onZoom} onReset={() => setView(null)} />}
            </View>
        </>
    );
};
