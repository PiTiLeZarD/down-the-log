import { normalise } from "./locator";
import { TILE_LENGTH } from "./tota";

// The poster side of TOTA: tiles laid out where they actually sit on the planet, so a run of
// activations reads as a shape rather than as a list of grid names. Maidenhead is already a grid of
// nested grids, so a tile has an integer (x, y) on a single world-wide lattice of subsquares — the
// whole poster is that lattice cropped to the tiles we own.
//
// x counts subsquares east from 180°W, y counts them north from 90°S, which is the direction the
// letters run. Rows are drawn top down, so a row's y decreases as it goes down the page.
const FIELDS = "ABCDEFGHIJKLMNOPQR";
const SUBS = "abcdefghijklmnopqrstuvwx";

// Subsquares to a square, and tiles to a field: a field is 10 squares of 24 subsquares either way.
export const SQUARE_TILES = SUBS.length;
const FIELD_TILES = 10 * SQUARE_TILES;
// 18 fields of 240 tiles. Same both ways: a field is twice as wide as it is tall, and so is a tile.
export const WORLD_TILES = FIELDS.length * FIELD_TILES;

export type TileIndex = {
    x: number;
    y: number;
};

// Anything that isn't a full tile has no place on the lattice, which includes the 4-character
// locators the rest of the page already reports as missing.
export const tileIndex = (tile: string): TileIndex | undefined => {
    const t = normalise(tile);
    if (!t || t.length < TILE_LENGTH) return undefined;

    const fx = FIELDS.indexOf(t.charAt(0));
    const fy = FIELDS.indexOf(t.charAt(1));
    const sx = Number(t.charAt(2));
    const sy = Number(t.charAt(3));
    const ux = SUBS.indexOf(t.charAt(4));
    const uy = SUBS.indexOf(t.charAt(5));
    if (fx < 0 || fy < 0 || ux < 0 || uy < 0 || !Number.isInteger(sx) || !Number.isInteger(sy)) return undefined;

    return { x: fx * FIELD_TILES + sx * SQUARE_TILES + ux, y: fy * FIELD_TILES + sy * SQUARE_TILES + uy };
};

// The 4-character square a lattice cell belongs to, which is what labels a region of the poster.
export const squareOf = ({ x, y }: TileIndex): string =>
    FIELDS.charAt(Math.floor(x / FIELD_TILES)) +
    FIELDS.charAt(Math.floor(y / FIELD_TILES)) +
    (Math.floor(x / SQUARE_TILES) % 10) +
    (Math.floor(y / SQUARE_TILES) % 10);

export const tileOfIndex = (index: TileIndex): string =>
    squareOf(index) + SUBS.charAt(index.x % SQUARE_TILES) + SUBS.charAt(index.y % SQUARE_TILES);

// The subsquare letter of a column or a row, which is how the poster's edges are labelled.
export const subLabel = (i: number): string => SUBS.charAt(i % SQUARE_TILES);

// Rows are counted up from y, so the top row of a grid is y + rows - 1.
export type TileGrid = {
    x: number;
    y: number;
    cols: number;
    rows: number;
};

// A ring of empty tiles around the activated ones, so the shape isn't jammed against the edge.
export const POSTER_MARGIN = 1;
// Past this the cells are too small to see and the poster is mostly empty space. A log that spans
// more than this is drawn as one grid per square instead of one grid with two specks in it.
export const MAX_SPAN = 48;

const fit = (indices: TileIndex[], margin: number, min: TileIndex, max: TileIndex): TileGrid => {
    const xs = indices.map((i) => i.x);
    const ys = indices.map((i) => i.y);
    const x = Math.max(min.x, Math.min(...xs) - margin);
    const y = Math.max(min.y, Math.min(...ys) - margin);
    return {
        x,
        y,
        cols: Math.min(max.x, Math.max(...xs) + margin) - x + 1,
        rows: Math.min(max.y, Math.max(...ys) + margin) - y + 1,
    };
};

const WORLD_MIN: TileIndex = { x: 0, y: 0 };
const WORLD_MAX: TileIndex = { x: WORLD_TILES - 1, y: WORLD_TILES - 1 };

// One grid per square, each cropped to the tiles inside that square, ordered the way the squares
// are named. This is the fallback for a log spread across the planet, where a single crop would be
// a continent of empty cells.
const perSquare = (indices: TileIndex[], margin: number): TileGrid[] => {
    const squares = indices.reduce<Record<string, TileIndex[]>>((acc, index) => {
        const square = squareOf(index);
        return { ...acc, [square]: [...(acc[square] || []), index] };
    }, {});

    return Object.keys(squares)
        .sort()
        .map((square) => {
            const [{ x, y }] = squares[square];
            const corner = {
                x: Math.floor(x / SQUARE_TILES) * SQUARE_TILES,
                y: Math.floor(y / SQUARE_TILES) * SQUARE_TILES,
            };
            return fit(squares[square], margin, corner, {
                x: corner.x + SQUARE_TILES - 1,
                y: corner.y + SQUARE_TILES - 1,
            });
        });
};

// The grids to draw for a set of tiles: one crop around the lot when they're close enough to share
// a poster, one crop per square when they aren't.
export const tileGrids = (tiles: string[], margin: number = POSTER_MARGIN, maxSpan: number = MAX_SPAN): TileGrid[] => {
    const indices = tiles.map(tileIndex).filter((i): i is TileIndex => !!i);
    if (!indices.length) return [];

    const whole = fit(indices, margin, WORLD_MIN, WORLD_MAX);
    return whole.cols <= maxSpan && whole.rows <= maxSpan ? [whole] : perSquare(indices, margin);
};

// The squares the log has tiles in, named the way they sort: the poster can be cropped to any one
// of them instead of to the tiles themselves.
export const tileSquares = (tiles: string[]): string[] =>
    Array.from(
        new Set(
            tiles
                .map(tileIndex)
                .filter((i): i is TileIndex => !!i)
                .map(squareOf),
        ),
    ).sort();

// A whole 4-character square, tiles or no tiles, which is the other thing a poster can be cropped
// to: 24x24 of empty lattice with whatever has been activated inside it. A 6-character locator is
// accepted and trimmed, so pasting a tile in asks for the square it sits in.
export const squareGrid = (square: string): TileGrid | undefined => {
    const corner = tileIndex(`${square.substring(0, 4)}aa`);
    return corner && { ...corner, cols: SQUARE_TILES, rows: SQUARE_TILES };
};

// The squares a grid covers, each with the cell its label goes in: the top-left cell of the square
// that is actually on the poster, so a crop straddling two squares names both of them.
export type GridSquare = {
    square: string;
    col: number;
    row: number;
};

export const gridSquares = ({ x, y, cols, rows }: TileGrid): GridSquare[] => {
    const top = y + rows - 1;
    // The first column of each square inside the crop, and the first row counting down from the top.
    const startCols = Array.from({ length: cols }, (_, c) => c).filter((c) => c === 0 || (x + c) % SQUARE_TILES === 0);
    const startRows = Array.from({ length: rows }, (_, r) => r).filter(
        (r) => r === 0 || (top - r) % SQUARE_TILES === SQUARE_TILES - 1,
    );

    return startCols.flatMap((col) =>
        startRows.map((row) => ({ square: squareOf({ x: x + col, y: top - row }), col, row })),
    );
};
