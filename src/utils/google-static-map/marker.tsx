import React from "react";
import { LatLng } from "../locator";
import { FeatureMarkerStyle, RenderFeature, latLngToPosition } from "./common";

export type MarkerProps = {
    location: LatLng;
} & { style?: Partial<FeatureMarkerStyle> };

export type MarkerComponent = React.FC<MarkerProps> & RenderFeature<MarkerProps>;

export const Marker: MarkerComponent = () => null;
Marker.renderFeature = ({ location, style }) => ({
    type: "markers",
    data: latLngToPosition(location),
    style,
});
