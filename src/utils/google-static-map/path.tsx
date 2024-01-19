import React from "react";
import { LatLng } from "../locator";
import { FeaturePathStyle, RenderFeature, latLngToPosition } from "./common";

export type PathProps = {
    from: LatLng;
    to: LatLng;
} & { style?: Partial<FeaturePathStyle> };

export type PathComponent = React.FC<PathProps> & RenderFeature<PathProps>;

export const Path: PathComponent = () => null;
Path.renderFeature = ({ from, to, style }) => ({
    type: "path",
    data: `${latLngToPosition(from)}|${latLngToPosition(to)}`,
    style,
});
