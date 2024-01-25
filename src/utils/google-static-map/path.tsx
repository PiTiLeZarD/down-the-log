import React from "react";
import { LatLng } from "../locator";
import { Polygon, coord2latlng } from "../polygon";
import { FeaturePathStyle, RenderFeature, latLngToPosition } from "./common";

export type PathProps = {
    from?: LatLng;
    to?: LatLng;
    polygon?: Polygon;
    polyline?: string;
} & { style?: Partial<FeaturePathStyle> };

export type PathComponent = React.FC<PathProps> & RenderFeature<PathProps>;

export const Path: PathComponent = () => null;
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
