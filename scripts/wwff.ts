/** https://wwff.co/wwff-data/wwff_directory.csv */

import { parse } from "csv-parse";
import { readFileSync, writeFileSync } from "node:fs";
import { normalise } from "../src/utils/locator";

const data = readFileSync("./scripts/wwff_directory.csv", "utf8");
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
        "./src/data/wwff.json",
        JSON.stringify(
            Object.fromEntries(
                records
                    .filter((r) => r.status === "active")
                    .map((r) => [
                        r.reference,
                        {
                            name: r.name,
                            locator: normalise(r.iaruLocator),
                            // website: r.website,
                            dxcc: r.dxccEnum,
                        },
                    ]),
            ),
        ),
    );
});
parser.write(data);
parser.end();
