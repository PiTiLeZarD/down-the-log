import React from "react";
import { LatLng } from "../locator";
import { RenderFeature, latLngToPosition } from "./common";

export type PathProps = {
    from: LatLng;
    to: LatLng;
};

export type PathComponent = React.FC<PathProps> & RenderFeature<PathProps>;

export const Path: PathComponent = () => null;
Path.renderFeature = ({ from, to }) => ({
    type: "path",
    data: `${latLngToPosition(from)}|${latLngToPosition(to)}`,
});
