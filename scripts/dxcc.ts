/**
 * get the file here:
 * https://github.com/amazingproducer/dxcc-world-map
 */
import { writeFileSync } from "node:fs";
import { encode } from "../src/utils/polydec";
import { Polygon } from "../src/utils/polygon";

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

const dxccData = Object.fromEntries(
    (dxcc as GeoJSONFeatureCollection).features.map((d) => [
        String(d.properties.dxcc_entity_code).padStart(3, "0"),
        (d.geometry.type === "MultiPolygon"
            ? (d.geometry.coordinates as Array<Polygon[]>).map((ps) => ps.map((p) => encode(p)))
            : [(d.geometry.coordinates as Polygon[]).map((p) => encode(p))]
        ).flat(),
    ])
);

writeFileSync("./src/data/dxcc.json", JSON.stringify(dxccData), "utf8");
