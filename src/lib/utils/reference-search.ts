import { EventType, eventDataMap } from "./event-rules";

export type ReferenceMatch = { reference: string; name: string };
type IndexedReference = ReferenceMatch & { search: string };

// SOTA alone is 180k summits, so the entries are listed — and their names folded for comparison —
// once per programme, the first time somebody types into one of its boxes, not on every keystroke.
const indexes: Partial<Record<EventType, IndexedReference[]>> = {};
const referenceIndex = (event: EventType): IndexedReference[] =>
    (indexes[event] ??= Object.entries(eventDataMap[event]).map(([reference, { name }]) => ({
        reference,
        name,
        search: name.toUpperCase(),
    })));

export const searchReferences = (event: EventType, query: string | undefined, limit = 5): ReferenceMatch[] => {
    const wanted = (query || "").trim().toUpperCase();
    if (wanted.length < 2) return [];
    // The box already says what it holds, and the chip under it already names the summit.
    if (wanted in eventDataMap[event]) return [];

    // Reference matches come first however far down the list they were found, so a scan that fills up
    // on name matches early can't push the exact thing being typed off the end.
    const byReference: ReferenceMatch[] = [];
    const byName: ReferenceMatch[] = [];
    for (const entry of referenceIndex(event)) {
        if (entry.reference.startsWith(wanted)) {
            if (byReference.length < limit) byReference.push(entry);
        } else if (byName.length < limit && entry.search.includes(wanted)) {
            byName.push(entry);
        }
        if (byReference.length >= limit) break;
    }
    return [...byReference, ...byName].slice(0, limit);
};
