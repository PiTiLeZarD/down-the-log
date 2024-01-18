import React from "react";
import { LatLng } from "../locator";
import { RenderFeature, latLngToPosition } from "./common";

export type MarkerProps = {
    location: LatLng;
    label?: string;
};

export type MarkerComponent = React.FC<MarkerProps> & RenderFeature<MarkerProps>;

export const Marker: MarkerComponent = () => null;
Marker.renderFeature = ({ location, label }) => ({
    type: "markers",
    data: latLngToPosition(location),
});
