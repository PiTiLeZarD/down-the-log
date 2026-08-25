import React from "react";
import { ScrollView, View, useWindowDimensions } from "react-native";
import { StyleSheet } from "react-native-unistyles";
import {
    SQUARE_TILES,
    TileGrid,
    gridSquares,
    squareGrid,
    subLabel,
    tileGrids,
    tileIndex,
    tileSquares,
} from "../utils/tota-grid";
import { Input } from "../ui/input";
import { SelectInput } from "../ui/select-input";
import { Typography } from "../ui/typography";
import { Stack } from "./stack";

// The progress poster: every tile activated, drawn where it sits on the Maidenhead lattice. It is
// deliberately not the one on their site — no margin slider, no figure to complete, no colours to
// pick, no export. Once there's nothing left to upload the page has nothing to ask for, so what's
// left to show is the shape of the work.
//
// The one choice it does offer is what to crop to: the tiles themselves, one of the squares they
// fall in, or any square at all — a square you've barely started is the one worth looking at, and
// it doesn't show up as anything but a speck on a crop fitted to where you've actually been.
const MIN_CELL = 6;
const MAX_CELL = 26;
// Below this the letter doesn't fit in the cell it belongs to, so the edges go unlabelled.
const LABELLED_CELL = 12;
// Room for a row letter next to the grid, and for the poster to sit inside a page's padding.
const GUTTER = 18;
const PAGE_PADDING = 90;
const MAX_WIDTH = 620;

// Crop to the tiles, or to a named square. The picker's other values are square names themselves.
const AUTO = "auto";
const OTHER = "other";

const styles = StyleSheet.create((theme) => ({
    grid: {
        borderLeftWidth: 1,
        borderTopWidth: 1,
        borderColor: theme.colours.grey.main,
        borderRightWidth: 1,
        borderBottomWidth: 1,
    },
    row: {
        flexDirection: "row",
    },
    // The lattice is drawn by the cells themselves: a faint line between tiles, a firm one wherever
    // a 4-character square ends, which is what makes the squares readable without drawing boxes.
    cell: (size: number, activated: boolean, endOfSquareX: boolean, endOfSquareY: boolean) => ({
        width: size,
        height: size,
        // Nothing on the poster is see-through: an empty tile is its own solid shade, so an
        // activated one reads as filled in rather than as a hole onto the page behind it.
        backgroundColor: activated ? theme.colours.success.main : theme.colours.grey[theme.rowShade(true)],
        borderRightWidth: 1,
        borderBottomWidth: 1,
        borderRightColor: endOfSquareX ? theme.colours.grey.main : theme.colours.grey.light,
        borderBottomColor: endOfSquareY ? theme.colours.grey.main : theme.colours.grey.light,
    }),
    labels: {
        flexDirection: "row",
        marginLeft: GUTTER,
    },
    columnLabel: (size: number) => ({
        width: size,
        fontSize: Math.min(size - 2, 12),
        textAlign: "center",
        color: theme.colours.grey.main,
    }),
    rowLabel: (size: number) => ({
        width: GUTTER,
        height: size,
        lineHeight: size,
        fontSize: Math.min(size - 2, 12),
        textAlign: "center",
        color: theme.colours.grey.main,
    }),
    // Sits over its cell rather than in it: a square name is wider than the tile it starts on.
    squareLabel: (left: number, top: number) => ({
        position: "absolute",
        left: left + 2,
        top,
        fontWeight: "bold",
        fontSize: 12,
        color: theme.colours.grey.darker,
    }),
    picker: {
        flexGrow: 1,
        flexBasis: 0,
        maxWidth: 240,
    },
    swatch: {
        width: 12,
        height: 12,
        borderRadius: 2,
        backgroundColor: theme.colours.success.main,
    },
}));

export type TotaPosterProps = {
    tiles: string[];
};

type PosterGridProps = {
    grid: TileGrid;
    size: number;
    activated: Set<string>;
};

const PosterGrid = ({ grid, size, activated }: PosterGridProps) => {
    const { x, y, cols, rows } = grid;
    const labelled = size >= LABELLED_CELL;
    // Drawn top down, so the first row is the northernmost one.
    const top = y + rows - 1;

    return (
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View>
                {labelled && (
                    <View style={styles.labels}>
                        {Array.from({ length: cols }, (_, c) => (
                            <Typography key={c} style={styles.columnLabel(size)}>
                                {subLabel(x + c)}
                            </Typography>
                        ))}
                    </View>
                )}
                <View style={styles.row}>
                    <View>
                        {Array.from({ length: rows }, (_, r) => (
                            <Typography key={r} style={styles.rowLabel(size)}>
                                {labelled ? subLabel(top - r) : ""}
                            </Typography>
                        ))}
                    </View>
                    <View style={styles.grid}>
                        {Array.from({ length: rows }, (_, r) => (
                            <View key={r} style={styles.row}>
                                {Array.from({ length: cols }, (_, c) => (
                                    <View
                                        key={c}
                                        style={styles.cell(
                                            size,
                                            activated.has(`${x + c}/${top - r}`),
                                            (x + c) % SQUARE_TILES === SQUARE_TILES - 1,
                                            (top - r) % SQUARE_TILES === 0,
                                        )}
                                    />
                                ))}
                            </View>
                        ))}
                        {labelled &&
                            gridSquares(grid).map(({ square, col, row }) => (
                                <Typography key={square} style={styles.squareLabel(col * size, row * size)}>
                                    {square}
                                </Typography>
                            ))}
                    </View>
                </View>
            </View>
        </ScrollView>
    );
};

export const TotaPoster = ({ tiles }: TotaPosterProps) => {
    const { width } = useWindowDimensions();
    const [area, setArea] = React.useState<string>(AUTO);
    const [other, setOther] = React.useState<string>("");

    const squares = React.useMemo(() => tileSquares(tiles), [tiles]);
    const fitted = React.useMemo(() => tileGrids(tiles), [tiles]);
    const activated = React.useMemo(
        () =>
            new Set(
                tiles
                    .map(tileIndex)
                    .filter((i) => !!i)
                    .map((i) => `${i.x}/${i.y}`),
            ),
        [tiles],
    );

    // A square that stops being one of ours as the log is edited falls back to the auto crop, the
    // same way the map drops a selected tile that has gone.
    const chosen = area === AUTO || (area !== OTHER && !squares.includes(area)) ? AUTO : area;
    const square = chosen === OTHER ? other : chosen;
    const grids = chosen === AUTO ? fitted : ([squareGrid(square)].filter((g): g is TileGrid => !!g) as TileGrid[]);

    // The count follows the crop: on a square poster it's what has been activated in that square,
    // not everywhere, or a mostly-empty square would claim the whole log's total.
    const shown = grids.reduce(
        (count, grid) =>
            count +
            Array.from(activated).filter((cell) => {
                const [x, y] = cell.split("/").map(Number);
                return x >= grid.x && x < grid.x + grid.cols && y >= grid.y && y < grid.y + grid.rows;
            }).length,
        0,
    );

    const items = [
        { label: "All my tiles", value: AUTO },
        ...squares.map((s) => ({ label: `Square ${s}`, value: s })),
        { label: "Another square…", value: OTHER },
    ];

    // Every grid gets the same cell size, so two posters side by side are the same scale, and the
    // widest one is what has to fit. Anything that still overflows scrolls sideways.
    const budget = Math.min(width - PAGE_PADDING, MAX_WIDTH) - GUTTER;
    const widest = Math.max(...grids.map((g) => g.cols), 1);
    const size = Math.max(MIN_CELL, Math.min(MAX_CELL, Math.floor(budget / widest)));

    return (
        <Stack gap="lg">
            <Stack direction="row" gap="md">
                <View style={styles.picker}>
                    <SelectInput value={chosen} items={items} onValueChange={(v) => setArea(v)} />
                </View>
                {chosen === OTHER && (
                    <View style={styles.picker}>
                        <Input
                            value={other}
                            onChangeText={setOther}
                            placeholder="e.g. QG62"
                            maxLength={6}
                            transformValue={(v) => v.toUpperCase()}
                        />
                    </View>
                )}
            </Stack>
            {!grids.length ? (
                <Typography variant="subtitle">
                    {chosen === OTHER ? "Enter a square to draw, for example QG62." : "No tiles activated yet"}
                </Typography>
            ) : (
                <>
                    <Stack direction="row" gap="md">
                        <View style={styles.swatch} />
                        <Typography variant="em">
                            {shown} tile{shown === 1 ? "" : "s"} activated
                        </Typography>
                    </Stack>
                    {grids.map((grid) => (
                        <PosterGrid key={`${grid.x}/${grid.y}`} grid={grid} size={size} activated={activated} />
                    ))}
                </>
            )}
        </Stack>
    );
};
