/**
 * Generates a random ADIF log, mostly to have something big enough to stress the app with.
 *
 * Usage: pnpm tsx scripts/random-log.ts [count] [outfile] [--seed=1234] [--years=10]
 *   pnpm tsx scripts/random-log.ts 1000000 ./random-1m.adif
 *
 * References (POTA/SOTA), prefixes, DXCC entities and grids come from the app's own data files, so
 * an imported QSO resolves to a real park/summit/country rather than to a lookup miss.
 */

import { createWriteStream, readFileSync } from "node:fs";
import { Band, bands, modeBandMap } from "../src/lib/data/bands";
import { CallsignData, callsigns } from "../src/lib/data/callsigns";
import { countries } from "../src/lib/data/countries";
import { maidenDistance } from "../src/lib/utils/locator";
import { roundTo } from "../src/lib/utils/math";

type Ref = { name: string; locator: string };
const readRefs = (path: string): [string, Ref][] => Object.entries(JSON.parse(readFileSync(path, "utf8")) as Record<string, Ref>);

const args = process.argv.slice(2);
const flag = (name: string, fallback: number) => {
    const found = args.find((a) => a.startsWith(`--${name}=`));
    return found ? +found.split("=")[1] : fallback;
};
const positional = args.filter((a) => !a.startsWith("--"));
const count = positional[0] ? +positional[0] : 1_000_000;
const outfile = positional[1] || "./random-log.adif";
const years = flag("years", 10);

// Seeded so a rerun with the same arguments gives the same file: chasing a bug that only shows up
// on one particular log is impossible when the log changes under you.
let seed = flag("seed", 20240427) >>> 0;
const random = () => {
    seed = (seed + 0x6d2b79f5) >>> 0;
    let t = seed;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
};
const pick = <T>(values: T[]): T => values[Math.floor(random() * values.length)];
const between = (min: number, max: number) => min + random() * (max - min);
const chance = (probability: number) => random() < probability;

const letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
const digits = "0123456789";
const upper = "ABCDEFGHIJKLMNOPQRSTUVWX";
const lower = upper.toLowerCase();

/**
 * The country table keys callsigns by regexp, which can't be run backwards, but nearly all of them
 * are a plain list of prefix literals (`/^(T6|YA).*&#47;`). Those we can read off; the handful using
 * character classes or lookarounds are dropped rather than guessed at.
 */
const prefixesOf = (entry: CallsignData): string[] =>
    entry.regexp.source
        .replace(/^\^/, "")
        .replace(/[.][*][$]?$/, "")
        .replace(/^[(]([^)]*)[)]$/, "$1")
        .split("|")
        .map((p) => p.trim().toUpperCase())
        .filter((p) => /^[A-Z0-9]{1,3}$/.test(p));

const entities = callsigns
    .map((entry) => ({ entry, prefixes: prefixesOf(entry) }))
    .filter(({ prefixes }) => prefixes.length > 0);

const callsignFor = (prefix: string) => {
    // A prefix is either already region-numbered (`OH0`, `VK4`) or wants a call area digit.
    const base = /[0-9]$/.test(prefix) ? prefix : prefix + pick(digits.split(""));
    const suffix = Array.from({ length: chance(0.75) ? 3 : 2 }, () => pick(letters.split(""))).join("");
    return base + suffix;
};

/**
 * The entity grid is its centre, so every QSO from one country would otherwise land on the same
 * pixel of the map. Keep the field (first two characters), scatter the square and subsquare.
 */
const locatorNear = (grid: string) =>
    grid.slice(0, 2).toUpperCase() +
    pick(digits.split("")) +
    pick(digits.split("")) +
    pick(lower.split("")) +
    pick(lower.split(""));

const modes = ["FT8", "SSB", "CW", "FT8", "SSB", "FT4", "RTTY", "PSK", "FM", "JS8", "SSB", "CW"];
const bandNames = Object.keys(bands) as Band[];
// Weighted towards what an HF station actually works, rather than uniform over 26 bands.
const bandPool: Band[] = [
    ...Array<Band>(6).fill("20m"),
    ...Array<Band>(5).fill("40m"),
    ...Array<Band>(3).fill("15m"),
    ...Array<Band>(3).fill("80m"),
    ...Array<Band>(2).fill("10m"),
    ...Array<Band>(2).fill("17m"),
    ...Array<Band>(2).fill("30m"),
    ...Array<Band>(2).fill("2m"),
    "12m",
    "160m",
    "6m",
    "60m",
    "70cm",
    ...bandNames,
];

const names = "John,Pat,Ian,Maria,Kenji,Olav,Sven,Anna,Luis,Peter,Dave,Mike,Sue,Hans,Yuki,Paolo,Marc,Kate,Tom,Nina".split(",");
const rigs = "Icom IC-7100,Icom IC-705,Yaesu FT-891,Yaesu FT-818,Elecraft KX2,Xiegu G90,Kenwood TS-590".split(",");
const antennas = "Custom Fan Dipole 40/20/17/12/10,EFHW 10-40,Vertical GP,Buddipole,Random Wire 9:1,Yagi 3el".split(",");
const comments = [
    "Thanks for the contact, 73!",
    "Strong signal, nice chat about the weather.",
    "Park to park, thanks for the hunt.",
    "First contact on this band, very happy.",
    "QRP 5W, tough copy but made it.",
    "Rag chew about antennas for 20 minutes.",
];

const potaRefs = readRefs("./src/lib/data/pota.json");
const sotaRefs = readRefs("./src/lib/data/sota.json");

// POTA references are prefixed with the ISO2 country code, and the only ISO2 we hold is the one
// baked into the country flag emoji (a pair of regional indicators), so read it back out of there.
const iso2 = (iso3: string) =>
    Array.from(countries[iso3]?.flag || "")
        .map((c) => String.fromCharCode((c.codePointAt(0) as number) - 0x1f1e6 + 65))
        .join("");

const potaByCountry = potaRefs.reduce<Record<string, [string, Ref][]>>((acc, ref) => {
    const country = ref[0].split("-")[0];
    (acc[country] = acc[country] || []).push(ref);
    return acc;
}, {});

// SOTA associations are callsign prefixes ("VK4/...", "W7A/..."), so an entity's summits are the
// associations starting with one of its prefixes. Built once per entity, then cached.
const sotaCache: Record<string, [string, Ref][]> = {};
const sotaFor = (prefixes: string[]) => {
    const key = prefixes.join(",");
    if (!sotaCache[key])
        sotaCache[key] = sotaRefs.filter((ref) => prefixes.some((p) => ref[0].toUpperCase().startsWith(p)));
    return sotaCache[key];
};

const rst = (mode: string) => {
    if (["FT8", "FT4", "JS8", "PSK", "RTTY"].includes(mode)) return String(Math.round(between(-24, 5)));
    if (mode === "CW") return `${Math.round(between(3, 5))}${Math.round(between(6, 9))}${Math.round(between(7, 9))}`;
    return `${Math.round(between(3, 5))}${Math.round(between(6, 9))}`;
};

const frequencyFor = (band: Band, mode: string) => {
    const digital = modeBandMap[mode as keyof typeof modeBandMap]?.[band];
    if (digital) return digital;
    const [low, high] = bands[band];
    return roundTo(between(low, high), 3);
};

const pad = (v: number, size = 2) => String(v).padStart(size, "0");
const stamp = (at: Date) => ({
    date: `${at.getUTCFullYear()}${pad(at.getUTCMonth() + 1)}${pad(at.getUTCDate())}`,
    time: `${pad(at.getUTCHours())}${pad(at.getUTCMinutes())}${pad(at.getUTCSeconds())}`,
});

const sanitize = (v: string) => v.replace(/[<>&'"”]/g, "");
const field = (label: string, value?: string | number) => {
    if (value === undefined || value === null || value === "") return "";
    const clean = sanitize(String(value));
    return `<${label.toUpperCase()}:${clean.length}>${clean}`;
};

// The operator side of the log: one home station, so the "my" fields stay consistent across QSOs.
const me = {
    callsign: "VK4ALE",
    locator: "QG62mp",
    country: "AUS",
    state: "QLD",
};

const qso = (): string => {
    const { entry, prefixes } = pick(entities);
    const prefix = pick(prefixes);
    const call = callsignFor(prefix);
    const mode = pick(modes);
    const band = pick(bandPool);
    const at = new Date(Date.now() - random() * years * 365.25 * 24 * 3600 * 1000);
    const on = stamp(at);
    const off = stamp(new Date(at.getTime() + Math.round(between(30, 2400)) * 1000));

    // Activations come in runs in a real log, but a per-QSO chance is enough to exercise the
    // reference lookups and the POTA/SOTA grouping. Refs are drawn from the worked entity, so a
    // Dominica callsign doesn't come back activating a Canadian park.
    const parks = potaByCountry[iso2(entry.iso3)];
    const summits = sotaFor(prefixes);
    const pota = parks?.length && chance(0.12) ? pick(parks) : undefined;
    const sota = summits.length && chance(0.04) ? pick(summits) : undefined;
    const myParks = potaByCountry[iso2(me.country)] || [];
    const myPota = myParks.length && chance(0.08) ? pick(myParks) : undefined;

    // On a park or summit the other operator is standing in it, so the grid follows the reference.
    const locator = pota?.[1].locator || sota?.[1].locator || locatorNear(entry.gs);
    const myLocator = myPota?.[1].locator || me.locator;

    return (
        [
            field("qso_date", on.date),
            field("time_on", on.time),
            field("qso_date_off", off.date),
            field("time_off", off.time),
            field("band", band),
            field("freq", frequencyFor(band, mode)),
            field("mode", mode),
            field("tx_pwr", pick([5, 5, 10, 20, 50, 100, 100, 400])),
            field("rst_sent", rst(mode)),
            field("rst_rcvd", rst(mode)),
            field("call", call),
            field("pfx", prefix),
            field("country", countries[entry.iso3]?.name || entry.iso3),
            field("name", chance(0.35) ? pick(names) : undefined),
            field("distance", roundTo(maidenDistance(myLocator, locator), 2)),
            field("station_callsign", me.callsign),
            field("operator", me.callsign),
            field("my_gridsquare", myLocator),
            field("gridsquare", locator),
            field("cont", entry.ctn),
            field("dxcc", +entry.dxcc),
            field("eqsl_qsl_rcvd", chance(0.3) ? "Y" : "N"),
            field("eqsl_qsl_sent", chance(0.4) ? "Y" : "N"),
            field("lotw_qsl_rcvd", chance(0.35) ? "Y" : "N"),
            field("lotw_qsl_sent", chance(0.5) ? "Y" : "N"),
            field("comment", chance(0.1) ? pick(comments) : undefined),
            field("pota_ref", pota?.[0]),
            field("my_pota_ref", myPota?.[0]),
            field("sota_ref", sota?.[0]),
            field("my_rig", pick(rigs)),
            field("my_antenna", pick(antennas)),
            field("my_country", me.country),
            field("my_state", me.state),
        ]
            .filter(Boolean)
            .join(" ") + "<EOR>"
    );
};

const header = [
    `ADIF Export from down-the-log by ${me.callsign}`,
    "for further info visit: https://github.com/PiTiLeZarD/down-the-log",
    field("adif_ver", "3.1.4"),
    field("created_timestamp", `${stamp(new Date()).date} ${stamp(new Date()).time}`),
    field("programid", "down-the-log"),
    field("programversion", "0.0.1"),
    "<EOH>",
    "",
    "",
].join("\n");

const main = async () => {
    const out = createWriteStream(outfile);
    const write = (chunk: string) =>
        out.write(chunk) ? undefined : new Promise<void>((resolve) => out.once("drain", () => resolve()));

    await write(header);

    // Batched: one write() per QSO spends more time in the stream than in generating the log.
    const batchSize = 5000;
    let batch: string[] = [];
    for (let i = 0; i < count; i++) {
        batch.push(qso());
        if (batch.length === batchSize) {
            await write(batch.join("\n") + "\n");
            batch = [];
            if ((i + 1) % 100_000 === 0) console.log(`${i + 1} / ${count}`);
        }
    }
    if (batch.length) await write(batch.join("\n") + "\n");

    await new Promise<void>((resolve, reject) => out.end((error?: Error) => (error ? reject(error) : resolve())));
    console.log(`${count} QSOs written to ${outfile}`);
};

main();
