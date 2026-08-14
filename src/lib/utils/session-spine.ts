// Type only: the theme reaches into react-native for the font scale, and nothing here renders.
import type { ColourVariant } from "../ui/theme";

/**
 * Where the session brackets go down the left of the log. A bracket joins a run of QSOs logged in
 * the same session, and the run is decided by adjacency in the list as it is actually rendered, not
 * by the session's own membership: filter half a session out and the bracket honestly breaks in
 * two rather than claiming to join QSOs with other people's in between.
 *
 * The date headers are the reason this is worth having. An evening's operating at UTC+11 crosses
 * midnight UTC halfway through, so the log splits one unbroken run across two date sections — the
 * bracket runs straight through the header and says they were the same outing.
 */
export type SpineKind = "start" | "middle" | "end" | "single";

export type SpineInfo = { kind: SpineKind; variant: ColourVariant; sessionId: string };

// One row of the rendered log: a QSO carrying the session it was logged in, or a date header.
export type SpineRow = { key: string; qso: boolean; sessionId?: string };

// Two colours, handed out in the order the sessions show up, so a session ending on one row and the
// next starting on the one below still read as two brackets rather than one long one.
const spineVariants: ColourVariant[] = ["secondary", "primary"];

export const sessionSpines = (rows: SpineRow[]): Record<string, SpineInfo> => {
    const qsoRows = rows.flatMap((row, index) => (row.qso ? [{ ...row, index }] : []));
    const spines: Record<string, SpineInfo> = {};
    const variants: Record<string, ColourVariant> = {};

    qsoRows.forEach(({ key, sessionId, index }, i) => {
        if (!sessionId) return;
        if (!variants[sessionId])
            variants[sessionId] = spineVariants[Object.keys(variants).length % spineVariants.length];
        const variant = variants[sessionId];

        const above = qsoRows[i - 1]?.sessionId === sessionId;
        const below = qsoRows[i + 1]?.sessionId === sessionId;
        spines[key] = { kind: above ? (below ? "middle" : "end") : below ? "start" : "single", variant, sessionId };

        // Anything between this QSO and the next one of the same session is a date header, and the
        // bracket carries on through it rather than restarting on the other side.
        if (below)
            for (let row = index + 1; row < qsoRows[i + 1].index; row++)
                spines[rows[row].key] = { kind: "middle", variant, sessionId };
    });
    return spines;
};

export const sameSpine = (a?: SpineInfo, b?: SpineInfo): boolean =>
    a?.kind === b?.kind && a?.variant === b?.variant && a?.sessionId === b?.sessionId;
