/**
 * get the file here:
 * https://github.com/amazingproducer/dxcc-world-map
 */
import { writeFileSync } from "node:fs";
import { encode } from "../app/lib/utils/polydec";
import { Polygon } from "../app/lib/utils/polygon";

import dxcc from "./dxcc.json";

type GeoJSONProperties = {
    dxcc_prefix: string;
    dxcc_name: string;
    dxcc_entity_code: number;
};
type GeoJSONFeature = {
    type: "Feature";
    geometry: {
        type: "Polygon" | "MultiPolygon";
        coordinates: Polygon[] | Array<Polygon[]>;
    };
    properties: GeoJSONProperties;
};
type GeoJSONFeatureCollection = {
    type: "FeatureCollection";
    features: GeoJSONFeature[];
};

const reversePolygon = (p: Polygon): Polygon => p.map(([a, b]) => [b, a]);
const dxccData = Object.fromEntries(
    (dxcc as GeoJSONFeatureCollection).features.map((d) => [
        String(d.properties.dxcc_entity_code).padStart(3, "0"),
        (d.geometry.type === "MultiPolygon"
            ? (d.geometry.coordinates as Array<Polygon[]>).map((ps) => ps.map((p) => encode(reversePolygon(p))))
            : [(d.geometry.coordinates as Polygon[]).map((p) => encode(reversePolygon(p)))]
        ).flat(),
    ]),
);

writeFileSync("./app/lib/data/dxcc.json", JSON.stringify(dxccData), "utf8");
