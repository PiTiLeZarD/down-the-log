import { Image } from "expo-image";
import React, { PropsWithChildren } from "react";
import { LayoutChangeEvent, Text, View } from "react-native";
import Svg, { Circle, Path as SvgPath, Text as SvgText } from "react-native-svg";
import { LatLng } from "../../utils/locator";
import {
    Feature,
    FeatureMarkerStyle,
    FeaturePathStyle,
    MarkerFeature,
    PathFeature,
    resolveColor,
} from "./common";
import { TILE_SIZE, World, boundsOf, geodesicPoints, project, unwrapLongitudes, zoomToFit } from "./projection";

const TILE_URL = "https://tile.openstreetmap.org";
// The OSM tile usage policy wants a real identifying User-Agent. Browsers set their own and ignore
// this, but the native image loaders would otherwise send a generic one.
const TILE_HEADERS = { "User-Agent": "down-the-log (https://github.com/PiTiLeZarD/down-the-log)" };
// Enough room for the tallest pin to stay inside the viewport once the bounds are fitted.
const DEFAULT_PADDING = 32;

const blurhash =
    "|rF?hV%2WCj[ayj[a|j[az_NaeWBj@ayfRayfQfQM{M|azj[azf6fQfQfQIpWXofj[ayj[j[fQayWCoeoeaya}j[ayfQa{oLj?j[WVj[ayayj[fQoff7azayj[ayj[j[ayofayayayj[fQj[ayayj[ayfjj[j[ayjuayj[";

// A path is drawn through every intermediate point, so a geodesic leg has to be sampled before it
// gets projected. Longitudes are unwrapped afterwards to keep the drawn line on the short side.
const pathPoints = (feature: PathFeature): LatLng[] => {
    const style = (feature.style || {}) as Partial<FeaturePathStyle>;
    const points = style.geodesic
        ? feature.points.flatMap((point, i, all) =>
              i === 0 ? [point] : geodesicPoints(all[i - 1], point).slice(1),
          )
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

const MarkerShape = ({ x, y, style }: { x: number; y: number; style?: Partial<FeatureMarkerStyle> }) => {
    const color = resolveColor(style?.color, "#ff0000");

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

export type MapProps = PropsWithChildren<{
    width?: number | "auto";
    height: number;
    padding?: number;
}>;

export const Map = ({ width = "auto", height, padding = DEFAULT_PADDING, children }: MapProps) => {
    // "auto" is measured from a zero-height probe view rather than read off a ref during render,
    // which only ever produced a width because some parent happened to re-render us.
    const [measuredWidth, setMeasuredWidth] = React.useState<number | null>(null);
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
        }));

    const bounds = boundsOf([...paths.flatMap((p) => p.points), ...markers.map((m) => m.point)]);

    if (!actualWidth || !bounds) {
        return <View style={{ width: "100%", height: 0 }} onLayout={onLayout} />;
    }

    const zoom = zoomToFit(bounds, actualWidth, actualHeight, padding);
    const scale = 2 ** zoom;
    const origin: World = {
        x: ((bounds.min.x + bounds.max.x) / 2) * scale - actualWidth / 2,
        y: ((bounds.min.y + bounds.max.y) / 2) * scale - actualHeight / 2,
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
            <View style={{ width: actualWidth, height: actualHeight, overflow: "hidden", backgroundColor: "#aad3df" }}>
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
                </Svg>
                <View
                    style={{
                        position: "absolute",
                        right: 0,
                        bottom: 0,
                        paddingHorizontal: 4,
                        backgroundColor: "rgba(255, 255, 255, 0.7)",
                    }}
                >
                    <Text style={{ fontSize: 9, color: "#222222" }}>© OpenStreetMap contributors</Text>
                </View>
            </View>
        </>
    );
};
