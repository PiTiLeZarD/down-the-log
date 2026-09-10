import { Continent } from "./callsigns";
import ctyData from "./cty.json";

/**
 * The DXCC entity table, built from AD1C's Big CTY and the ARRL DXCC list by scripts/cty.ts.
 *
 * The entity is what awards count, so it's the key here; `iso3` hangs off it for the flag and the
 * country name, and is missing for the three entities no ISO code covers. That split is the point:
 * the old table was keyed by ISO country and could only name one DXCC entity per country, which
 * left around a hundred current entities — the Canaries, Scotland, Sardinia, Crete, the Falklands —
 * with no way to resolve at all.
 */
export type DxccEntity = {
    dxcc: number;
    name: string;
    iso3?: string;
    ctn: Continent;
    /** The entity's default CQ zone. A callsign gets the zone of its own prefix, which may differ. */
    cq: number;
    itu: number;
    /** Reference gridsquare for the entity, used as the locator of last resort. */
    gs: string;
};

/** What a callsign resolves to: its entity, with the zones and continent its own prefix carries. */
export type CallsignData = DxccEntity;

type RawEntity = { name: string; iso3?: string; ctn: string; cq: number; itu: number; gs: string };
const raw = ctyData as unknown as {
    entities: Record<string, RawEntity>;
    deleted: Record<string, string>;
    prefixes: string;
    exceptions: string;
};

export const entities: Record<number, DxccEntity> = Object.fromEntries(
    Object.entries(raw.entities).map(([dxcc, e]) => [+dxcc, { ...e, dxcc: +dxcc, ctn: e.ctn as Continent }]),
);

export const dxccEntities: DxccEntity[] = Object.values(entities).sort((a, b) => a.name.localeCompare(b.name));

/**
 * Names a DXCC number, deleted entities included. A log imported from elsewhere can hold a QSO with
 * an entity that no longer exists, and a bare number reads as a bug rather than as somewhere that
 * stopped being a country.
 */
export const dxccName = (dxcc?: number): string | undefined =>
    dxcc === undefined ? undefined : entities[dxcc]?.name || raw.deleted[String(dxcc)];

/**
 * Prefixes and exceptions arrive as one `KEY:dxcc[:cq[:itu[:continent]]]` string apiece — 30k
 * records, which is more than is worth handing TypeScript as an object literal — and are unpacked
 * into maps the first time something is looked up rather than at import.
 */
const decode = (encoded: string): Map<string, DxccEntity> => {
    const map = new Map<string, DxccEntity>();
    for (const record of encoded.split(",")) {
        const [key, dxcc, cq, itu, ctn] = record.split(":");
        const entity = entities[+dxcc];
        if (!entity) continue;
        map.set(
            key,
            cq || itu || ctn
                ? {
                      ...entity,
                      ...(cq ? { cq: +cq } : {}),
                      ...(itu ? { itu: +itu } : {}),
                      ...(ctn ? { ctn: ctn as Continent } : {}),
                  }
                : entity,
        );
    }
    return map;
};

let prefixes: Map<string, DxccEntity> | undefined;
let exceptions: Map<string, DxccEntity> | undefined;
let longestPrefix = 0;

const prefixMap = () => {
    if (!prefixes) {
        prefixes = decode(raw.prefixes);
        longestPrefix = [...prefixes.keys()].reduce((max, key) => Math.max(max, key.length), 0);
    }
    return prefixes;
};

/** An exact callsign the table calls out by name: a DXpedition, a portable operation, a one-off. */
export const ctyException = (callsign: string): DxccEntity | undefined => {
    if (!exceptions) exceptions = decode(raw.exceptions);
    return exceptions.get(callsign);
};

/**
 * Longest prefix wins, which is the whole reason this replaced a list of regexps scanned in order:
 * EA8 has to beat EA, and KH6 has to beat K, without either of them needing a lookahead written by
 * hand to say so.
 */
export const ctyPrefix = (callsign: string): DxccEntity | undefined => {
    const map = prefixMap();
    for (let length = Math.min(callsign.length, longestPrefix); length > 0; length--) {
        const hit = map.get(callsign.substring(0, length));
        if (hit) return hit;
    }
    return undefined;
};
