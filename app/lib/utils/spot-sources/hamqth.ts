import axios from "axios";
import { DateTime } from "luxon";
import { freq2band } from "../../data/bands";
import { Continent, callsigns } from "../../data/callsigns";
import { Spot, SpotFetchDataFn } from "../spots";

const keys = [
    "callsign",
    "frequency",
    "spotter",
    "comment",
    "date",
    "lotw_user",
    "eqsl_user",
    "continent",
    "band",
    "country",
    "dxcc",
] as const;

type Key = (typeof keys)[number];
type HamQTHSpot = Record<Key, string>;

const getSpot = (data: HamQTHSpot): Spot => ({
    callsign: data.callsign,
    frequency: +data.frequency / 1000,
    band: freq2band(+data.frequency / 1000) || undefined,
    note: data.comment,
    myCallsign: data.spotter,
    date: data.date ? DateTime.fromFormat(data.date, "HHmm yyyy-MM-dd") : undefined,
    eqsl_received: data.eqsl_user === "E",
    lotw_received: data.eqsl_user === "L",
    continent: data.continent as Continent,
    country: callsigns.find((o) => o.dxcc === data.dxcc)?.iso3,
    dxcc: +data.dxcc,
});

export const fetchData: SpotFetchDataFn = (settings) =>
    axios.get(`https://www.hamqth.com/dxc_csv.php?limit=200`).then(({ data }) =>
        data
            .split("\n")
            .map((l: string) => l.trim())
            .filter((l: string) => l !== "")
            .map((line: string) =>
                getSpot(Object.fromEntries(line.split("^").map((v, i) => [keys[i], v])) as HamQTHSpot),
            ),
    );
