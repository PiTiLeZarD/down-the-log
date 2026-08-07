// https://storage.sota.org.uk/summitslist.csv

import { parse } from "csv-parse";
import { readFileSync, writeFileSync } from "node:fs";
import { latlong2Maidenhead } from "../src/lib/utils/locator";

const data = readFileSync("./scripts/summitslist.csv", "utf8").split("\n").splice(1).join("\n");
const parser = parse();

let header: string[] | null = null;
const records: Record<string, string>[] = [];

parser.on("readable", () => {
    let record;
    while ((record = parser.read()) != null) {
        if (header === null) header = record;
        else records.push(Object.fromEntries(record.map((e: string, i: number) => [(header as string[])[i], e])));
    }
});
parser.on("end", () => {
    writeFileSync(
        "./src/lib/data/sota.json",
        JSON.stringify(
            Object.fromEntries(
                // Retired summits are kept so historical QSOs still resolve their reference.
                records.map((r) => [
                    r.SummitCode,
                    {
                        name: r.SummitName,
                        locator: latlong2Maidenhead({ latitude: +r.Latitude, longitude: +r.Longitude }),
                    },
                ]),
            ),
        ),
    );
});
parser.write(data);
parser.end();
