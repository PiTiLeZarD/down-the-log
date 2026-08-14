import React from "react";
import { Pressable } from "react-native";
import { StyleSheet } from "react-native-unistyles";
import { ColourVariant } from "../../ui/theme";
import { SpineInfo, SpineKind } from "../../utils/session-spine";

/**
 * The bracket drawn down the left of the log joining the QSOs of one session, the way a staple joins
 * the pages of one outing. It is a per-row segment rather than one tall shape: the list is a
 * FlatList of independently rendered rows, so nothing can span them, but a vertical line on every
 * row of the run with a cap on the first and the last reads as one bracket — including across the
 * date headers a session crosses at UTC+11. Which rows get what is worked out in `session-spine.ts`.
 */

// The lane the bracket lives in. Rows are padded by this much so it doesn't sit on the id column.
export const SPINE_GUTTER = 14;

const capped = (kind: SpineKind, end: "start" | "end") => kind === end || kind === "single";

const styles = StyleSheet.create((theme) => ({
    // Insetting the capped ends keeps the corners off the row's own edge, so the bracket looks drawn
    // around the run rather than butted against the rows above and below it.
    spine: (kind: SpineKind, colour: ColourVariant) => ({
        position: "absolute",
        // Rendered after the row's content and lifted above it: native paints children in tree
        // order, so a spine drawn first would end up under the row's own background.
        zIndex: 1,
        left: theme.margins.md,
        top: capped(kind, "start") ? theme.margins.lg : 0,
        bottom: capped(kind, "end") ? theme.margins.lg : 0,
        width: SPINE_GUTTER - theme.margins.lg,
        borderColor: theme.colours[colour].main,
        borderLeftWidth: 2,
        borderTopWidth: capped(kind, "start") ? 2 : 0,
        borderBottomWidth: capped(kind, "end") ? 2 : 0,
    }),
}));

export type SessionSpineProps = {
    spine: SpineInfo;
    onPress?: (sessionId: string) => void;
};

// Nested inside the row's own Pressable: the inner one wins the press, so pressing the bracket
// filters the log to its session while pressing anywhere else on the row still opens the QSO.
export const SessionSpine = ({ spine, onPress }: SessionSpineProps) => (
    <Pressable
        style={styles.spine(spine.kind, spine.variant)}
        onPress={onPress ? () => onPress(spine.sessionId) : undefined}
    />
);
