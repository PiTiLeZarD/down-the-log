import React from "react";
import { LatLng } from "../../utils/locator";
import { FeatureMarkerStyle, RenderFeature, latLngToPosition } from "./common";

export type MarkerProps = {
    location: LatLng;
} & { style?: Partial<FeatureMarkerStyle> };

// The intersection is load-bearing: `Map` reads the static `renderFeature` off the element type.
export const Marker: React.FC<MarkerProps> & RenderFeature<MarkerProps> = () => null;
Marker.renderFeature = ({ location, style }) => ({
    type: "markers",
    data: latLngToPosition(location),
    style,
});
