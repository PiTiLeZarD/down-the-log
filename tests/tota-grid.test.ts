import { describe, expect, test } from "vitest";
import {
    SQUARE_TILES,
    gridSquares,
    squareGrid,
    tileSquares,
    squareOf,
    subLabel,
    tileGrids,
    tileIndex,
    tileOfIndex,
} from "../src/lib/utils/tota-grid";

describe("tileIndex", () => {
    test("puts the south-west corner of the world at the origin", () => {
        expect(tileIndex("AA00aa")).toEqual({ x: 0, y: 0 });
    });

    test("counts subsquares east and north", () => {
        const aa = tileIndex("IN78aa");
        expect(tileIndex("IN78ba")).toEqual({ x: (aa?.x as number) + 1, y: aa?.y });
        expect(tileIndex("IN78ab")).toEqual({ x: aa?.x, y: (aa?.y as number) + 1 });
    });

    test("carries from one square into the next", () => {
        const last = tileIndex("IN78xx") as { x: number; y: number };
        expect(tileIndex("IN89aa")).toEqual({ x: last.x + 1, y: last.y + 1 });
    });

    test("reads a locator in any case, and refuses one that isn't a tile", () => {
        expect(tileIndex("in78rj")).toEqual(tileIndex("IN78RJ"));
        expect(tileIndex("IN78")).toBeUndefined();
        expect(tileIndex("ZZ99zz")).toBeUndefined();
    });

    test("round trips back to the tile it came from", () => {
        expect(tileOfIndex(tileIndex("QG62mo") as { x: number; y: number })).toBe("QG62mo");
    });
});

describe("squareOf", () => {
    test("is the 4-character square the tile sits in", () => {
        expect(squareOf(tileIndex("QG62mo") as { x: number; y: number })).toBe("QG62");
    });
});

describe("subLabel", () => {
    test("labels a column or row with its subsquare letter", () => {
        const { x } = tileIndex("QG62mo") as { x: number; y: number };
        expect(subLabel(x)).toBe("m");
        expect(subLabel(x + 1)).toBe("n");
    });
});

describe("tileGrids", () => {
    test("crops to the tiles with a margin around them", () => {
        const { x, y } = tileIndex("QG62mo") as { x: number; y: number };
        expect(tileGrids(["QG62mo"])).toEqual([{ x: x - 1, y: y - 1, cols: 3, rows: 3 }]);
    });

    test("has nothing to draw without a tile", () => {
        expect(tileGrids([])).toEqual([]);
        expect(tileGrids(["IN78"])).toEqual([]);
    });

    test("holds neighbouring tiles in one grid", () => {
        const grids = tileGrids(["QG62mo", "QG62po"]);
        expect(grids).toHaveLength(1);
        expect(grids[0].cols).toBe(6);
        expect(grids[0].rows).toBe(3);
    });

    test("splits into one grid per square when the tiles are too far apart to share one", () => {
        const grids = tileGrids(["QG62mo", "IN78rj"]);
        expect(grids).toHaveLength(2);
        expect(grids.map((g) => squareOf({ x: g.x, y: g.y }))).toEqual(["IN78", "QG62"]);
        expect(grids.every((g) => g.cols === 3 && g.rows === 3)).toBe(true);
    });

    test("keeps a split grid inside its own square", () => {
        const [grid] = tileGrids(["QG62aa", "IN78rj"]).filter((g) => squareOf({ x: g.x, y: g.y }) === "QG62");
        const corner = tileIndex("QG62aa") as { x: number; y: number };
        expect(grid).toEqual({ x: corner.x, y: corner.y, cols: 2, rows: 2 });
    });
});

describe("gridSquares", () => {
    test("labels the top-left cell of the crop", () => {
        const [grid] = tileGrids(["QG62mo"]);
        expect(gridSquares(grid)).toEqual([{ square: "QG62", col: 0, row: 0 }]);
    });

    test("names both squares when the crop straddles a boundary", () => {
        const grids = tileGrids(["QG62xx", "QG73aa"]);
        expect(grids).toHaveLength(1);
        const squares = gridSquares(grids[0]);
        expect(squares.map((s) => s.square).sort()).toEqual(["QG62", "QG63", "QG72", "QG73"]);
        // The QG73 label goes where that square starts inside the crop, not at the corner of the crop.
        expect(squares.find((s) => s.square === "QG73")).toEqual({ square: "QG73", col: 2, row: 0 });
    });

    test("a whole square is labelled once, at its own corner", () => {
        const corner = tileIndex("QG62aa") as { x: number; y: number };
        expect(gridSquares({ ...corner, cols: SQUARE_TILES, rows: SQUARE_TILES })).toEqual([
            { square: "QG62", col: 0, row: 0 },
        ]);
    });
});

describe("tileSquares", () => {
    test("is the squares the tiles fall in, once each, in name order", () => {
        expect(tileSquares(["QG62mo", "IN78rj", "QG62po", "IN78"])).toEqual(["IN78", "QG62"]);
    });
});

describe("squareGrid", () => {
    test("is the whole square, from its own corner", () => {
        expect(squareGrid("QG62")).toEqual({
            ...(tileIndex("QG62aa") as { x: number; y: number }),
            cols: SQUARE_TILES,
            rows: SQUARE_TILES,
        });
    });

    test("takes a tile and draws the square it sits in", () => {
        expect(squareGrid("QG62mo")).toEqual(squareGrid("QG62"));
    });

    test("has no grid for something that isn't a square", () => {
        expect(squareGrid("QG")).toBeUndefined();
        expect(squareGrid("ZZ99")).toBeUndefined();
    });
});
