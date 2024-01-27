/**
 * Download kmz from here
 * https://www.iota-world.org/islands-on-the-air/downloads.html
 *
 * unzip it to get doc.kml
 * */
import { XMLParser } from "fast-xml-parser";
import { readFileSync, writeFileSync } from "node:fs";
import { latlong2Maidenhead } from "../src/utils/locator";

const data = readFileSync("./scripts/doc.kml", "utf8");
const parser = new XMLParser();
const doc = parser.parse(data);

writeFileSync(
    "./src/data/iota.json",
    JSON.stringify(
        Object.fromEntries(
            doc.kml.Document.Folder.Folder.map((o: any) =>
                o.Placemark.map((o: any) => [
                    o.name,
                    {
                        name: o.description.split("<br />")[0].trim(),
                        locator: latlong2Maidenhead({ latitude: +o.LookAt.latitude, longitude: +o.LookAt.longitude }),
                    },
                ]),
            ).flat(),
        ),
    ),
);
