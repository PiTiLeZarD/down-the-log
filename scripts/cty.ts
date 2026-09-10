/**
 * Builds src/lib/data/cty.json, the callsign -> DXCC entity table.
 *
 * Two inputs, because neither one is enough on its own:
 *
 *   scripts/cty.dat      AD1C's Big CTY (https://www.country-files.com/bigcty/cty.dat), updated
 *                        monthly. Every prefix and ~23k exception callsigns, with CQ/ITU zones and
 *                        a reference lat/long per entity — but no DXCC entity numbers at all.
 *   scripts/dxcclist.txt The ARRL DXCC list, which is where the entity numbers live.
 *
 * They're joined on the entity name, falling back to the primary prefix and then to a small manual
 * table for the names that match neither. cty.dat also carries entities the DXCC list doesn't have:
 * contest splits like Sicily or Shetland, marked with a `*` on their primary prefix. Those aren't
 * dropped — they fold into their parent entity, and their zones survive as per-prefix overrides,
 * which is the whole reason IT9 comes out as CQ 33 rather than Italy's 15.
 *
 * Both inputs are manual downloads that stay out of git (`pnpm refreshcty` fetches them), so they're
 * read at runtime like every other script in here.
 */
import { readFileSync, writeFileSync } from "node:fs";
import { dxccIso3 } from "./dxcc-iso3";
import { latlong2Maidenhead } from "../src/lib/utils/locator";

const CTY_DAT = "./scripts/cty.dat";
const DXCC_LIST = "./scripts/dxcclist.txt";
const OUTPUT = "./src/lib/data/cty.json";

const continents = ["NA", "SA", "EU", "AF", "OC", "AS", "AN"];

/** cty.dat entity names the DXCC list spells differently enough that neither join finds them. */
const nameOverrides: Record<string, number> = {
    "*4U1V": 206, // Vienna International Centre, in Austria
    DL: 230, // "Fed. Rep. of Germany"
    "FO/a": 508, // Austral Islands
    "*GM/s": 279, // Shetland, part of Scotland
    "*IG9": 248, // African Italy
    "*IT9": 248, // Sicily
    "*JW/b": 259, // Bear Island, part of Svalbard
    PY0S: 253, // St. Peter & St. Paul Rocks
    PY0T: 273, // Trindade & Martim Vaz
    "*TA1": 390, // European Turkey
    "VP8/h": 241, // South Shetland Islands
};

// ---------------------------------------------------------------------------- the ARRL DXCC list

type ArrlEntity = { name: string; dxcc: number; prefix: string; ctn: string };

/**
 * The list is fixed-column plain text and the column widths have moved between editions, so they're
 * read off the row of underscores that separates the header from the data rather than hardcoded.
 */
const arrlColumns = (text: string): number[] => {
    const ruler = text.split("\n").find((l) => /^\s+_{3,}( _{3,})+\s*$/.test(l));
    if (!ruler) throw new Error("no column ruler in the DXCC list: has the file format changed?");
    const columns = [...ruler.matchAll(/_+/g)].map((m) => m.index);
    if (columns.length < 3) throw new Error(`only ${columns.length} columns in the DXCC list ruler`);
    return columns;
};

const parseArrl = (text: string, columns: number[]): ArrlEntity[] =>
    text
        .split("\n")
        .map((line) => ({
            prefix: line.substring(columns[0], columns[1]).trim(),
            // The entity column is wide enough to hold the continent too, and the ruler doesn't
            // separate them: "Turkey                             EU,AS".
            name: line
                .substring(columns[1], columns[2])
                .trim()
                .replace(/\s+[A-Z]{2}(,[A-Z]{2})*$/, "")
                .trim(),
            ctn: (line.substring(columns[1], columns[2]).trim().match(/\s([A-Z]{2}(,[A-Z]{2})*)$/) || [])[1] || "",
            dxcc: +line.substring(columns[columns.length - 1]).trim(),
        }))
        // Notes, headers and the blank lines between them all fail one of these.
        .filter((e) => e.name && e.prefix && !Number.isNaN(e.dxcc) && e.dxcc > 0);

// ---------------------------------------------------------------------------------- cty.dat

type CtyPrefix = { key: string; cq?: number; itu?: number; ctn?: string };
type CtyEntity = {
    name: string;
    prefix: string;
    cq: number;
    itu: number;
    ctn: string;
    lat: number;
    lon: number;
    prefixes: CtyPrefix[];
    exceptions: CtyPrefix[];
};

/**
 * A prefix carries its own zones in brackets when it differs from its entity: `K6(3)[6]`. The
 * markers are stripped off the key here and kept beside it.
 */
const parseCtyPrefix = (raw: string): CtyPrefix | undefined => {
    const cq = raw.match(/\(([0-9]+)\)/);
    const itu = raw.match(/\[([0-9]+)\]/);
    const ctn = raw.match(/\{([A-Z]+)\}/);
    const key = raw.replace(/\([0-9]+\)|\[[0-9]+\]|<[^>]*>|\{[A-Z]+\}|~[^~]*~/g, "").trim();
    if (!key) return undefined;
    return { key, ...(cq ? { cq: +cq[1] } : {}), ...(itu ? { itu: +itu[1] } : {}), ...(ctn ? { ctn: ctn[1] } : {}) };
};

const parseCty = (text: string): CtyEntity[] =>
    text
        .split(";")
        .map((record) => record.trim())
        .filter(Boolean)
        .map((record) => {
            const split = record.indexOf("\n");
            const header = (split === -1 ? record : record.slice(0, split)).split(":");
            if (header.length < 8) throw new Error(`unreadable cty.dat record: ${record.slice(0, 60)}`);

            const prefixes: CtyPrefix[] = [];
            const exceptions: CtyPrefix[] = [];
            for (const raw of (split === -1 ? "" : record.slice(split + 1)).split(",")) {
                const trimmed = raw.replace(/\s+/g, "");
                if (!trimmed) continue;
                const parsed = parseCtyPrefix(trimmed.replace(/^=/, ""));
                if (parsed) (trimmed.startsWith("=") ? exceptions : prefixes).push(parsed);
            }

            return {
                name: header[0].trim(),
                cq: +header[1],
                itu: +header[2],
                ctn: header[3].trim(),
                lat: +header[4],
                // cty.dat writes west longitudes positive, which is the opposite of everywhere else
                // in this app. Getting this backwards puts every entity on the wrong side of the
                // planet and the distance readout with it.
                lon: -+header[5],
                prefix: header[7].trim(),
                prefixes,
                exceptions,
            };
        });

// ------------------------------------------------------------------------------------- the join

const normaliseName = (name: string) =>
    name
        .toUpperCase()
        .replace(/\bISLANDS\b/g, "IS")
        .replace(/\bISLAND\b/g, "I")
        .replace(/[^A-Z0-9]/g, "");

const main = () => {
    const listText = readFileSync(DXCC_LIST, "utf8");
    const columns = arrlColumns(listText);
    const [currentText, deletedText] = listText.split("DELETED ENTITIES");
    const current = parseArrl(currentText, columns);
    const deleted = deletedText ? parseArrl(deletedText, columns) : [];
    if (current.length < 300) throw new Error(`only ${current.length} current entities parsed, expected ~340`);

    const byName = new Map(current.map((e) => [normaliseName(e.name), e]));
    // Only prefixes that name exactly one entity are safe to join on: FO alone covers Clipperton,
    // French Polynesia, the Marquesas and the Australs.
    const prefixCounts = current.reduce<Map<string, number>>(
        (map, e) => map.set(e.prefix, (map.get(e.prefix) || 0) + 1),
        new Map(),
    );
    const byPrefix = new Map(current.filter((e) => prefixCounts.get(e.prefix) === 1).map((e) => [e.prefix, e]));
    // The list writes a prefix column, not a prefix: "KL,AL,NL,WL#*" or "EA6-EH6*".
    const primaryPrefix = (prefix: string) => prefix.split(/[,\-]/)[0].replace(/[^A-Z0-9/].*$/, "");
    const byPrimaryPrefix = new Map([...byPrefix.values()].map((e) => [primaryPrefix(e.prefix), e]));

    const cty = parseCty(readFileSync(CTY_DAT, "utf8"));
    const entityDxcc = new Map<CtyEntity, number>();
    const unmatched: string[] = [];
    for (const entity of cty) {
        const dxcc =
            nameOverrides[entity.prefix] ??
            byName.get(normaliseName(entity.name))?.dxcc ??
            byPrimaryPrefix.get(entity.prefix.replace(/^\*/, ""))?.dxcc;
        if (dxcc === undefined) unmatched.push(`${entity.prefix} — ${entity.name}`);
        else entityDxcc.set(entity, dxcc);
    }
    if (unmatched.length)
        throw new Error(
            `${unmatched.length} cty.dat entities match no DXCC entity. Add them to nameOverrides:\n  ${unmatched.join("\n  ")}`,
        );

    // The entity a DXCC number takes its defaults from. A starred cty entity is a contest split of
    // something else (Sicily, Shetland), so it never gets to define the parent's zones.
    const defaults = new Map<number, CtyEntity>();
    for (const entity of cty) {
        const dxcc = entityDxcc.get(entity)!;
        if (!defaults.has(dxcc) || (defaults.get(dxcc)!.prefix.startsWith("*") && !entity.prefix.startsWith("*")))
            defaults.set(dxcc, entity);
    }

    const entities: Record<string, unknown> = {};
    for (const arrl of current) {
        const source = defaults.get(arrl.dxcc);
        if (!source) {
            console.warn(`no cty.dat prefixes for DXCC ${arrl.dxcc} (${arrl.name}) — callsigns won't resolve to it`);
            continue;
        }
        // cty.dat has no Antarctic continent — it files the Antarctic entities under South America —
        // and the app's own map, the ADIF CONT field and the "no reference square means anything at
        // the pole" check in the issue list all expect AN. The DXCC list is right about this, so it
        // wins wherever it names one continent; cty.dat settles the entities it lists under two.
        const ctn = continents.includes(arrl.ctn) ? arrl.ctn : source.ctn;
        if (!continents.includes(ctn)) throw new Error(`unknown continent ${ctn} for ${arrl.name}`);
        entities[String(arrl.dxcc)] = {
            name: arrl.name,
            ...(dxccIso3[arrl.dxcc] ? { iso3: dxccIso3[arrl.dxcc] } : {}),
            ctn,
            cq: source.cq,
            itu: source.itu,
            gs: latlong2Maidenhead({ latitude: source.lat, longitude: source.lon }),
        };
    }

    const missingIso3 = current.filter((e) => entities[String(e.dxcc)] && !dxccIso3[e.dxcc]);
    if (missingIso3.length)
        console.warn(
            `${missingIso3.length} entities have no ISO country, so they show the entity name and no flag:\n  ` +
                missingIso3.map((e) => `${e.dxcc} ${e.name}`).join("\n  "),
        );

    // Deleted entities keep a name and nothing else. They resolve no callsign — that's what deleted
    // means — but a log imported from elsewhere can hold one, and a number with no name reads as a
    // bug rather than as a QSO with somewhere that stopped existing.
    const deletedNames: Record<string, string> = {};
    for (const entity of deleted) if (!entities[String(entity.dxcc)]) deletedNames[String(entity.dxcc)] = entity.name;

    /**
     * `KEY:dxcc[:cq[:itu[:continent]]]`, joined with commas — a string rather than an object because
     * there are 30k of these and a JSON object that size is a type TypeScript has to widen on every
     * build. Trailing fields are dropped when they match the entity, which is the common case.
     */
    const encodeList = (entries: Array<{ prefix: CtyPrefix; entity: CtyEntity }>): string =>
        entries
            .map(({ prefix, entity }) => {
                const dxcc = entityDxcc.get(entity)!;
                const target = entities[String(dxcc)] as { cq: number; itu: number; ctn: string } | undefined;
                const cq = prefix.cq ?? entity.cq;
                const itu = prefix.itu ?? entity.itu;
                // A continent override has to come from the prefix or from a split entity of its
                // own. Taking it from the entity unconditionally would hand every prefix of an
                // Antarctic entity cty.dat's "SA" back, undoing the AN the DXCC list just supplied.
                const ctn = prefix.ctn ?? (defaults.get(dxcc) === entity ? undefined : entity.ctn);
                const fields = [
                    prefix.key,
                    String(dxcc),
                    target && cq === target.cq ? "" : String(cq),
                    target && itu === target.itu ? "" : String(itu),
                    !ctn || (target && ctn === target.ctn) ? "" : ctn,
                ];
                while (fields.length > 2 && fields[fields.length - 1] === "") fields.pop();
                return fields.join(":");
            })
            .join(",");

    const prefixEntries = cty.flatMap((entity) => entity.prefixes.map((prefix) => ({ prefix, entity })));
    const exceptionEntries = cty.flatMap((entity) => entity.exceptions.map((prefix) => ({ prefix, entity })));

    const output = {
        entities,
        deleted: deletedNames,
        prefixes: encodeList(prefixEntries),
        exceptions: encodeList(exceptionEntries),
    };
    writeFileSync(OUTPUT, JSON.stringify(output), "utf8");

    console.log(
        `${Object.keys(entities).length} entities, ${Object.keys(deletedNames).length} deleted, ` +
            `${prefixEntries.length} prefixes, ${exceptionEntries.length} exceptions -> ${OUTPUT}`,
    );
};

main();
