/**
 * State outlines for the WAS and WAVKCA maps, out of Natural Earth's admin-1 boundaries (public
 * domain): https://www.naturalearthdata.com/downloads/50m-cultural-vectors/
 *
 * Projected here rather than in the app: each map is drawn in its own fixed viewBox, so the
 * outlines are stored already in it, x then y, polyline-encoded to a tenth of a unit. The US gets
 * the usual layout, Alaska and Hawaii moved under the lower 48 at their own scales; Australia is a
 * plain equirectangular squeezed by the cosine of its middle latitude.
 *
 * Build-time only, writes src/lib/data/state-maps.json.
 */
import { readFileSync, writeFileSync } from "node:fs";
import { encode } from "../src/lib/utils/polydec";

type Ring = number[][];
type Feature = {
    properties: { adm0_a3: string; postal: string };
    geometry: { type: "Polygon"; coordinates: Ring[] } | { type: "MultiPolygon"; coordinates: Ring[][] };
};

const source = JSON.parse(readFileSync("./scripts/ne_50m_admin_1_states_provinces.geojson", "utf8")) as {
    features: Feature[];
};

const rad = (deg: number) => (deg * Math.PI) / 180;

// Albers equal-area conic, y pointing up.
const albers = (lat0: number, lng0: number, lat1: number, lat2: number) => {
    const n = (Math.sin(rad(lat1)) + Math.sin(rad(lat2))) / 2;
    const c = Math.cos(rad(lat1)) ** 2 + 2 * n * Math.sin(rad(lat1));
    const rho0 = Math.sqrt(c - 2 * n * Math.sin(rad(lat0))) / n;
    return ([lng, lat]: number[]) => {
        const rho = Math.sqrt(c - 2 * n * Math.sin(rad(lat))) / n;
        const theta = n * rad(lng - lng0);
        return [rho * Math.sin(theta), rho0 - rho * Math.cos(theta)];
    };
};

const ringsOf = (f: Feature): Ring[] =>
    f.geometry.type === "Polygon" ? f.geometry.coordinates : f.geometry.coordinates.flat();

type Group = { ids: string[]; project: (p: number[]) => number[]; scale: number; x: number; y: number };
type Projected = Record<string, Ring[]>;

/**
 * Projects each group, then scales it and moves its top-left corner to (x, y), in units of the
 * map's width. Returns the shapes and the height the whole map ended up.
 */
const layout = (features: Feature[], groups: Group[], width: number) => {
    const shapes: Projected = {};
    let height = 0;
    for (const { ids, project, scale, x, y } of groups) {
        const rings: [string, Ring][] = features
            .filter((f) => ids.includes(f.properties.postal))
            .flatMap((f) => ringsOf(f).map((r): [string, Ring] => [f.properties.postal, r.map(project)]));
        const xs = rings.flatMap(([, r]) => r.map((p) => p[0]));
        const ys = rings.flatMap(([, r]) => r.map((p) => p[1]));
        const [minX, maxX, maxY] = [Math.min(...xs), Math.max(...xs), Math.max(...ys)];
        const k = (scale * width) / (maxX - minX);
        for (const [id, ring] of rings) {
            const placed = ring.map(([px, py]) => [x * width + (px - minX) * k, y * width + (maxY - py) * k]);
            height = Math.max(height, ...placed.map((p) => p[1]));
            (shapes[id] ||= []).push(placed);
        }
    }
    return { shapes, height };
};

// Drops points that land on the same tenth of a unit as the previous one, then encodes.
const encodeRings = (rings: Ring[]): string[] =>
    rings
        .map((ring) =>
            ring
                .map(([x, y]) => [Math.round(x * 10) / 10, Math.round(y * 10) / 10])
                .filter((p, i, all) => i === 0 || p[0] !== all[i - 1][0] || p[1] !== all[i - 1][1]),
        )
        .filter((ring) => ring.length > 2)
        .map((ring) => encode(ring, 1));

const WIDTH = 1000;

const us = source.features.filter((f) => f.properties.adm0_a3 === "USA" && f.properties.postal !== "DC");
// Aleutians past the antimeridian come back on the same side as the rest of Alaska.
const westOfDateline = ([lng, lat]: number[]) => [lng > 0 ? lng - 360 : lng, lat];
const lower48 = us.map((f) => f.properties.postal).filter((id) => !["AK", "HI"].includes(id));
const usMap = layout(
    us,
    [
        { ids: lower48, project: albers(37.5, -96, 29.5, 45.5), scale: 1, x: 0, y: 0 },
        {
            ids: ["AK"],
            project: (p) => albers(50, -154, 55, 65)(westOfDateline(p)),
            scale: 0.24,
            x: 0,
            y: 0.5,
        },
        { ids: ["HI"], project: albers(3, -157, 8, 18), scale: 0.12, x: 0.25, y: 0.58 },
    ],
    WIDTH,
);

// Jervis Bay is administered from the ACT and its stations sign VK1, so it's drawn as part of it.
const auIds: Record<string, string> = {
    CT: "VK1",
    JB: "VK1",
    NS: "VK2",
    VI: "VK3",
    QL: "VK4",
    SA: "VK5",
    WA: "VK6",
    TS: "VK7",
    NT: "VK8",
};
// Macquarie Island is part of Tasmania but signs VK0, and dragging the map down to 55°S for it would
// leave most of the map empty ocean.
const au = source.features
    .filter((f) => f.properties.adm0_a3 === "AUS")
    .map((f) => ({ ...f, properties: { ...f.properties, postal: auIds[f.properties.postal] } }))
    .filter((f) => f.properties.postal);
const auProject = ([lng, lat]: number[]) => [lng * Math.cos(rad(27)), lat];
const auFeatures = au.map((f) => ({
    ...f,
    geometry: {
        type: "MultiPolygon" as const,
        coordinates: ringsOf(f)
            .filter((ring) => ring.every(([, lat]) => lat > -50))
            .map((ring) => [ring]),
    },
}));
const auMap = layout(auFeatures, [{ ids: Object.values(auIds), project: auProject, scale: 0.86, x: 0, y: 0 }], WIDTH);

const round = (n: number) => Math.ceil(n);
const out = {
    us: {
        width: WIDTH,
        height: round(usMap.height),
        shapes: Object.fromEntries(Object.entries(usMap.shapes).map(([id, rings]) => [id, encodeRings(rings)])),
    },
    au: {
        width: WIDTH,
        height: round(auMap.height),
        shapes: Object.fromEntries(Object.entries(auMap.shapes).map(([id, rings]) => [id, encodeRings(rings)])),
    },
};

writeFileSync("./src/lib/data/state-maps.json", JSON.stringify(out), "utf8");
