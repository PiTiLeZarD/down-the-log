import { readFileSync, writeFileSync } from 'node:fs';
import { encode } from '../src/utils/polydec';
import { Coord } from '../src/utils/polygon';
/**
 * Download countries geojson from here:
 * https://datahub.io/core/geo-countries#data
 * This script will turn this into a { country_iso3: encodeedPolygons[] }
 *
 * run it with ts-node world.ts path/to/countries.geojson
 */

// @ts-ignore
const [, , filepath] = process.argv;

type GeoJSONProperties = {
    ADMIN: string;
    ISO_A3: string;
};
type GeoJSONFeature = {
    type: 'Feature';
    geometry: {
        type: 'Polygon' | 'MultiPolygon';
        coordinates: Array<Coord[]> | Array<Array<Coord[]>>;
    };
    properties: GeoJSONProperties;
};
type GeoJSONFeatureCollection = {
    type: 'FeatureCollection';
    features: GeoJSONFeature[];
};
const data: GeoJSONFeatureCollection = JSON.parse(readFileSync(filepath, 'utf8'));

const countries = Object.fromEntries(
    data.features.map((d) => [
        d.properties.ISO_A3,
        d.geometry.type === 'MultiPolygon'
            ? (d.geometry.coordinates as Array<Array<Coord[]>>).map((acoords) => acoords.map((c) => encode(c)))
            : (d.geometry.coordinates as Array<Coord[]>).map((c) => encode(c)),
    ])
);

writeFileSync('./src/data/world.json', JSON.stringify(countries), 'utf8');
