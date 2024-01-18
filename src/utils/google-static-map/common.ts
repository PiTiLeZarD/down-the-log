import { LatLng } from "../locator";
import { roundTo } from "../math";

export const DELIMITER = "~|~";

export type FeatureSize = "tiny" | "mid" | "small";
export type FeatureColor =
    | "black"
    | "brown"
    | "green"
    | "purple"
    | "yellow"
    | "blue"
    | "gray"
    | "orange"
    | "red"
    | "white"
    | string;

export type FeatureMarkerStyle = {
    size: FeatureSize;
    color: FeatureColor;
    label: string;
};
export type FeaturePathStyle = {
    weight: number;
    color: FeatureColor;
    fillColor: FeatureColor;
    geodesic: boolean;
};
export type Feature = {
    type: "markers" | "path";
    style?: Partial<FeatureMarkerStyle> | Partial<FeaturePathStyle>;
    data: string;
};

export type RenderFeature<T> = { renderFeature: (props: T) => Feature };

export const latLngToPosition = (latlng: LatLng) => `${roundTo(latlng.latitude, 6)},${roundTo(latlng.longitude, 6)}`;
