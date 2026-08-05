import React from "react";
import { LatLng } from "../../utils/locator";
import { Polygon, coord2latlng } from "../../utils/polygon";
import { FeaturePathStyle, RenderFeature, latLngToPosition } from "./common";

export type PathProps = {
    from?: LatLng;
    to?: LatLng;
    polygon?: Polygon;
    polyline?: string;
} & { style?: Partial<FeaturePathStyle> };

// The intersection is load-bearing: `Map` reads the static `renderFeature` off the element type.
export const Path: React.FC<PathProps> & RenderFeature<PathProps> = () => null;
Path.renderFeature = ({ from, to, polygon, polyline, style }) => {
    if (from && to)
        return {
            type: "path",
            data: `${latLngToPosition(from)}|${latLngToPosition(to)}`,
            style,
        };
    if (polygon)
        return {
            type: "path",
            data: polygon.map((coord) => latLngToPosition(coord2latlng(coord))).join("|"),
            style,
        };
    if (polyline)
        return {
            type: "path",
            data: `enc:${polyline}`,
            style,
        };
    return null;
};
