/** https://pota.app/all_parks_ext.csv */

import { parse } from "csv-parse";
import { readFileSync, writeFileSync } from "node:fs";
import { normalise } from "../app/lib/utils/locator";

const data = readFileSync("./scripts/all_parks_ext.csv", "utf8");
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
        "./app/lib/data/pota.json",
        JSON.stringify(
            Object.fromEntries(
                records
                    .filter((r) => r.active === "1")
                    .map((r) => [
                        r.reference,
                        {
                            name: r.name,
                            locator: normalise(r.grid),
                        },
                    ]),
            ),
        ),
    );
});
parser.write(data);
parser.end();
