import { LatLng } from "../../utils/locator";

export type FeatureSize = "tiny" | "mid" | "small";
export type FeatureIcon = "tree";
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
    icon: FeatureIcon;
};
export type FeaturePathStyle = {
    weight: number;
    color: FeatureColor;
    fillcolor: FeatureColor;
    geodesic: boolean;
};

export type MarkerFeature = {
    type: "markers";
    style?: Partial<FeatureMarkerStyle>;
    points: LatLng[];
    onPress?: () => void;
};
export type PathFeature = { type: "path"; style?: Partial<FeaturePathStyle>; points: LatLng[] };
export type Feature = MarkerFeature | PathFeature;

export type RenderFeature<T> = { renderFeature: (props: T) => Feature | null };

const NAMED_COLORS: Record<string, string> = {
    black: "#000000",
    brown: "#a52a2a",
    green: "#008000",
    purple: "#800080",
    yellow: "#ffff00",
    blue: "#0000ff",
    gray: "#808080",
    grey: "#808080",
    orange: "#ffa500",
    red: "#ff0000",
    white: "#ffffff",
};

// Accepts the named colours the old static-map styles used, plus `0xRRGGBB[AA]` and plain CSS.
export const resolveColor = (color: FeatureColor | undefined, fallback: string): string => {
    if (!color) return fallback;
    if (NAMED_COLORS[color.toLowerCase()]) return NAMED_COLORS[color.toLowerCase()];
    if (/^0x[0-9a-f]{6,8}$/i.test(color)) return `#${color.substring(2)}`;
    return color;
};
