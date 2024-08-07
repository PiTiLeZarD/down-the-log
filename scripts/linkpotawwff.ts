import { closest } from "fastest-levenshtein";
import { readFileSync, writeFileSync } from "node:fs";
import { ReferenceDatum } from "../app/lib/components/reference-info";

const pota: Record<string, ReferenceDatum> = JSON.parse(readFileSync("./app/lib/data/pota.json", "utf8"));
const wwff: Record<string, ReferenceDatum> = JSON.parse(readFileSync("./app/lib/data/wwff.json", "utf8"));

const links: Record<string, string> = {};

const cleanParkName = (name: string) =>
    [
        "forest",
        "national",
        "park",
        "reserve",
        "conservation",
        "wildlife",
        "reserve",
        "sanctuary",
        "recreation",
        "nature",
        "historic",
        "site",
        "natura",
        "scenic",
        "trail",
        "country",
        "landscape",
        "area",
        "wetland",
        "ecological",
        "memoral",
        "parkway",
    ]
        .reduce((acc, curr) => acc.replaceAll(curr, ""), name.toLowerCase())
        .trim()
        .replace(/\s{2,}/, " ");

const wwffnames = Object.fromEntries(Object.entries(wwff).map(([wwffref, wwffdatum]) => [wwffdatum.name, wwffref]));
Object.keys(pota).forEach((potaref) => {
    if (pota[potaref].name in wwffnames) {
        links[potaref] = wwffnames[pota[potaref].name];
    }
});

const total = Object.keys(pota).length - Object.keys(links).length;
Object.keys(pota)
    .filter((ref) => !(ref in links))
    .forEach((potaref, i) => {
        console.log(`${i} / ${total}`);
        const locationMatch = Object.keys(wwff).filter(
            (wwffref) => !!wwff[wwffref].locator && wwff[wwffref].locator === pota[potaref].locator,
        );
        if (locationMatch.length === 1) {
            links[potaref] = locationMatch[0];
            return;
        }

        const parksAround =
            locationMatch.length > 1
                ? locationMatch
                : Object.keys(wwff).filter(
                      (wwffref) => wwff[wwffref].locator?.substring(0, 4) === pota[potaref].locator?.substring(0, 4),
                  );
        if (parksAround.length === 0) return;

        if (parksAround.length === 1) {
            links[potaref] = parksAround[0];
            return;
        }

        const closewwffnames = Object.fromEntries(parksAround.map((p) => [cleanParkName(wwff[p].name), p]));
        const match = closest(cleanParkName(pota[potaref].name), Object.keys(closewwffnames));
        links[potaref] = closewwffnames[match];
    });

writeFileSync("./app/lib/data/potawwfflinks.json", JSON.stringify(links));
