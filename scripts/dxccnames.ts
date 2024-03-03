/**
 * Keep only what's non deleted and remove all the jibber jabber around it
 * https://www.arrl.org/files/file/DXCC/2020%20Current_Deleted.txt
 */
import { readFileSync, writeFileSync } from "node:fs";

const data = readFileSync("./scripts/dxcclist.txt", "utf8")
    .split("\n")
    .map((line) => ({
        prefix: line.substring(0, 24).trim(),
        name: line.substring(24, 59).trim(),
        continent: line.substring(59, 65).trim(),
        itu: +line.substring(65, 71).trim(),
        cq: +line.substring(71, 77).trim(),
        dxcc: +line.substring(77).trim(),
    }));

writeFileSync(
    "./app/lib/data/dxccnames.json",
    JSON.stringify(Object.fromEntries(data.map(({ dxcc, name }) => [String(dxcc).padStart(3, "0"), name]))),
);
