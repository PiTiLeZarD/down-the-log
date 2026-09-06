import sotaData from "../data/sota.json";

// Every SOTA reference is <association>/<region>-<number>, where the association is 1 to 3
// alphanumerics, the region exactly 2 letters and the number exactly 3 digits. Nothing else is
// valid, so the separators never have to be typed on a summit — they are derived from the data.
type SotaIndex = { associations: Set<string>; regions: Set<string>; ambiguous: Set<string> };
let index: SotaIndex | undefined;

const sotaIndex = (): SotaIndex => {
    if (index) return index;

    const associations = new Set<string>();
    const regions = new Set<string>();
    for (const reference of Object.keys(sotaData)) {
        const [association, rest] = reference.split("/");
        associations.add(association);
        regions.add(`${association}/${rest.slice(0, 2)}`);
    }
    // An association that is the start of a longer one can't be split off yet: G is a reference on
    // its own and also the first half of GM, so that one waits for another character before the
    // slash goes in. Splitting early would leave GM unreachable — the slash would be in the way.
    const list = [...associations];
    const ambiguous = new Set(list.filter((a) => list.some((other) => other !== a && other.startsWith(a))));

    index = { associations, regions, ambiguous };
    return index;
};

// Separators are only ever written between characters that exist, never trailing. A mask that
// re-adds the slash the operator just deleted is a trap: the value can never shrink past it again.
const join = (association: string, region: string, number: string, slash: boolean, dash: boolean) =>
    `${association}${region || slash ? "/" : ""}${region}${number || dash ? "-" : ""}${number}`;

const splitRest = (rest: string): [string, string] => {
    const [, region = "", number = ""] = /^([A-Z]{0,2})(\d{0,3})/.exec(rest) || [];
    return [region, number];
};

export const formatSotaReference = (input: string): string => {
    const { associations, regions, ambiguous } = sotaIndex();
    const upper = input.toUpperCase();
    const slash = upper.includes("/");
    const dash = upper.includes("-");
    const alnum = (s: string) => s.replace(/[^A-Z0-9]/g, "");

    // A slash that is already there settles where the association ends, whether it was typed, pasted
    // or written by an earlier keystroke. Only a bare run of characters has to be guessed at.
    if (slash) {
        const [head, ...tail] = upper.split("/");
        const association = alnum(head).slice(0, 3);
        const [region, number] = splitRest(alnum(tail.join("")));
        return join(association, region, number, slash, dash);
    }

    const typed = alnum(upper);
    for (const length of [3, 2, 1]) {
        const association = typed.slice(0, length);
        if (association.length < length || !associations.has(association)) continue;
        if (typed.length === length && ambiguous.has(association)) continue;

        const [region, number] = splitRest(typed.slice(length));
        // W7A/MN and W7/AM are both plausible readings of the same keystrokes. The one that names a
        // region SOTA actually has wins; a shorter association is tried next when it doesn't.
        if (region.length === 2 && !regions.has(`${association}/${region}`)) continue;
        return join(association, region, number, slash, dash);
    }
    return typed;
};

// What the half-typed reference means once the box is left: SOTA numbers are always 3 digits, so
// W7A/MN-1 is W7A/MN-001 and is worth saving as such rather than as an unknown reference.
export const completeSotaReference = (value: string): string => {
    const match = /^([A-Z0-9]{1,3})\/([A-Z]{2})-(\d{1,3})$/.exec(value.toUpperCase());
    if (!match) return value.replace(/[/-]+$/, "");

    const [, association, region, number] = match;
    return `${association}/${region}-${number.padStart(3, "0")}`;
};
