import { entities } from "../../data/cty";
import dxccPolygons from "../../data/dxcc.json";
import stateMaps from "../../data/state-maps.json";
import { AwardKey } from "../../utils/awards";
import { maidenhead2Latlong } from "../../utils/locator";
import { decode } from "../../utils/polydec";

type Point = number[];
type Box = { minX: number; minY: number; maxX: number; maxY: number };

export type Shape = {
    id: string;
    /** In the map's own viewBox units, x then y. */
    rings: Point[][];
    d: string;
    box?: Box;
    /** Drawn as well as the outline when the outline is too small to see or tap, or instead of it. */
    dot?: Point;
    /** Keeps the dot up even before the unit is worked, for the few too small to find otherwise. */
    pinned?: boolean;
    label?: Point;
};

export type AwardShapes = { width: number; height: number; dot: number; shapes: Shape[] };

const boxOf = (rings: Point[][]): Box =>
    rings.flat().reduce(
        (b, [x, y]) => ({
            minX: Math.min(b.minX, x),
            minY: Math.min(b.minY, y),
            maxX: Math.max(b.maxX, x),
            maxY: Math.max(b.maxY, y),
        }),
        { minX: Infinity, minY: Infinity, maxX: -Infinity, maxY: -Infinity },
    );

const centre = (b: Box): Point => [(b.minX + b.maxX) / 2, (b.minY + b.maxY) / 2];

// A tenth of a unit is under a pixel at any size these are drawn at, and dropping the repeats it
// creates trims the paths noticeably.
const pathOf = (rings: Point[][]): string =>
    rings
        .map((ring) => {
            const points = ring
                .map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`)
                .filter((p, i, all) => i === 0 || p !== all[i - 1]);
            return points.length > 2 ? `M${points.join("L")}Z` : "";
        })
        .join("");

/** Anything smaller than `speck` either way gets a dot too, so it can be seen and tapped. */
const shape = (id: string, rings: Point[][], speck: number, label = false): Shape => {
    const box = boxOf(rings);
    const small = box.maxX - box.minX < speck && box.maxY - box.minY < speck;
    return {
        id,
        rings,
        d: pathOf(rings),
        box,
        dot: small ? centre(box) : undefined,
        label: label ? centre(box) : undefined,
    };
};

// Plain equirectangular, one unit per degree. The far south is only ocean and the Antarctic
// coastline, so it's cut off to keep the land big; the Arctic islands that count still fit.
const NORTH = 84;
const SOUTH = -60;

const dxccShapes = (): AwardShapes => {
    const polygons = dxccPolygons as Record<string, string[]>;
    const project = ([lat, lng]: Point): Point => [lng + 180, NORTH - lat];
    return {
        width: 360,
        height: NORTH - SOUTH,
        dot: 1.6,
        shapes: Object.values(entities).map(({ dxcc, gs }) => {
            const encoded = polygons[String(dxcc).padStart(3, "0")];
            if (!encoded) {
                // A handful of entities have no outline in the source; their reference grid places them.
                const { latitude, longitude } = maidenhead2Latlong(gs);
                return { id: String(dxcc), rings: [], d: "", dot: project([latitude, longitude]) };
            }
            return shape(
                String(dxcc),
                encoded.map((e) => decode(e).map(project)),
                1.5,
            );
        }),
    };
};

type StateMap = { width: number; height: number; shapes: Record<string, string[]> };

const stateShapes = ({ width, height, shapes }: StateMap, labels: boolean): AwardShapes => ({
    width,
    height,
    dot: 9,
    shapes: Object.entries(shapes).map(([id, encoded]) =>
        shape(
            id,
            encoded.map((e) => decode(e, 1)),
            14,
            labels,
        ),
    ),
});

const vkShapes = (): AwardShapes => {
    const map = stateShapes(stateMaps.au, true);
    // VK9 and VK0 are islands and bases scattered over a third of the globe, so they stand off the
    // coast as markers: VK9 out east where Lord Howe and Norfolk are, VK0 down south.
    const offshore = (id: string, x: number, y: number): Shape => ({
        id,
        rings: [],
        d: "",
        dot: [x, y],
        label: [x, y + 32],
    });
    // The ACT is a speck on this map, and Jervis Bay (also VK1) stretches its box out to the coast,
    // so it gets a pinned dot on the ACT proper, the bigger of the two, with its label beside it.
    const act = (s: Shape): Shape => {
        const biggest = s.rings.reduce((a, b) => (b.length > a.length ? b : a), []);
        const dot = centre(boxOf([biggest]));
        return { ...s, dot, pinned: true, label: [dot[0] + 34, dot[1]] };
    };
    return {
        ...map,
        dot: 14,
        shapes: [
            ...map.shapes.map((s) => (s.id === "VK1" ? act(s) : s)),
            offshore("VK9", 935, 330),
            offshore("VK0", 935, 730),
        ],
    };
};

const builders: Record<AwardKey, () => AwardShapes> = {
    dxcc: dxccShapes,
    was: () => {
        const map = stateShapes(stateMaps.us, false);
        // Hawaii's islands spread too wide to count as a speck, yet each one is barely a pixel.
        return {
            ...map,
            shapes: map.shapes.map((s) =>
                s.id === "HI" && s.box
                    ? { ...s, pinned: true, dot: [(s.box.minX + s.box.maxX) / 2, (s.box.minY + s.box.maxY) / 2] }
                    : s,
            ),
        };
    },
    wavkca: vkShapes,
};

const cache: Partial<Record<AwardKey, AwardShapes>> = {};
// Decoded on first use rather than at import, and once: the DXCC outlines alone are ~15k points.
export const awardShapes = (key: AwardKey): AwardShapes => (cache[key] ||= builders[key]());

// Ray casting over every ring together, so a hole (an even count of crossings) reads as outside.
const inside = (rings: Point[][], [x, y]: Point): boolean =>
    rings.reduce((acc, ring) => {
        for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
            const [xi, yi] = ring[i];
            const [xj, yj] = ring[j];
            if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) acc = !acc;
        }
        return acc;
    }, false);

/** The shape under a point, dots first since they sit over the outlines. */
export const shapeAt = (shapes: Shape[], point: Point, slop: number): Shape | undefined =>
    shapes.find((s) => s.dot && Math.hypot(s.dot[0] - point[0], s.dot[1] - point[1]) < slop) ||
    shapes.find(
        (s) =>
            s.box &&
            point[0] >= s.box.minX &&
            point[0] <= s.box.maxX &&
            point[1] >= s.box.minY &&
            point[1] <= s.box.maxY &&
            inside(s.rings, point),
    );
