import React from "react";
import { LatLng } from "../../utils/locator";
import { Polygon, coord2latlng } from "../../utils/polygon";
import { FeaturePathStyle, RenderFeature } from "./common";

export type PathProps = {
    from?: LatLng;
    to?: LatLng;
    polygon?: Polygon;
} & { style?: Partial<FeaturePathStyle> };

// The intersection is load-bearing: `Map` reads the static `renderFeature` off the element type.
export const Path: React.FC<PathProps> & RenderFeature<PathProps> = () => null;
Path.renderFeature = ({ from, to, polygon, style }) => {
    if (from && to) return { type: "path", points: [from, to], style };
    if (polygon) return { type: "path", points: polygon.map(coord2latlng), style };
    return null;
};
