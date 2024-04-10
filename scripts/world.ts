import { readFileSync, writeFileSync } from "node:fs";
import { encode } from "../app/lib/utils/polydec";
import { Polygon } from "../app/lib/utils/polygon";
/**
 * Download countries geojson from here:
 * https://datahub.io/core/geo-countries#data
 * This script will turn this into a { country_iso3: encodeedPolygons[] }
 *
 * run it with
 * $ ts-node scripts/world.ts ./scripts/countries.geojson
 *
 * Get an updated file:
 * install gdal (brew install gdal)
 * mkdir world && cd world
 * http://www.naturalearthdata.com => Downloads => Large scale data, 1:10m Cultural => Admin 0 - Countries [Download countries]
 * unzip ne_10m_admin_0_countries.zip
 * ogr2ogr -select admin,iso_a3  -f geojson ./ne_10m_admin_0_countries.geojson ./ne_10m_admin_0_countries.shp
 * cat ./ne_10m_admin_0_countries.geojson | sed 's/"admin": /"name": /g' | sed 's/"iso_a3": /"ISO3166-1-Alpha-3": /g'  > ./interim.geojson
 * jq -c . < interim.geojson > ccountries.geojson
 */

// @ts-ignore
const [, , filepath] = process.argv;

type GeoJSONProperties = {
    ADMIN: string;
    ISO_A3: string;
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
const data: GeoJSONFeatureCollection = JSON.parse(readFileSync(filepath, "utf8"));

const countries = Object.fromEntries(
    data.features.map((d) => [
        d.properties.ADMIN,
        (d.geometry.type === "MultiPolygon"
            ? (d.geometry.coordinates as Array<Polygon[]>).map((ps) => ps.map((p) => encode(p)))
            : [(d.geometry.coordinates as Polygon[]).map((p) => encode(p))]
        ).flat(),
    ]),
);

writeFileSync("./app/lib/data/world.json", JSON.stringify(countries), "utf8");
