import axios from "axios";
import { DateTime } from "luxon";
import { freq2band } from "../../data/bands";
import { resolveMode } from "../../data/modes";
import { TIMEOUT_MS, bustCache } from "./fetch";
import { Spot } from "./types";

// HamQTH's mirror of the DX cluster, read over HTTP because the cluster itself is a telnet stream no
// browser or Expo app can open. It answers with `access-control-allow-origin: *`, and caps a request
// at 200 spots — a bit over an hour of the worldwide feed.
export const DX_SPOTS_API = "https://www.hamqth.com/dxc_csv.php?limit=200";

// One spot per line, `^`-separated: call, kHz, spotter, comment, "HHmm yyyy-MM-dd" UTC, LoTW and
// eQSL flags, continent, band, country, DXCC.
export const parseDxSpot = (line: string): Spot | undefined => {
    const [callsign, khz, spotter, comments, time] = line.split("^");
    if (!callsign || !time) return undefined;
    const frequency = +khz ? +khz / 1000 : undefined;
    return {
        // The feed has no id, and this is what makes one spot different from the next.
        id: `dx-${callsign}-${khz}-${spotter}-${time}`,
        source: "dx",
        date: DateTime.fromFormat(time, "HHmm yyyy-MM-dd", { zone: "utc" }),
        callsign,
        frequency,
        band: freq2band(frequency) || undefined,
        // No mode column: spotters put it in the comment when they bother, as "FT8" or "CW TU".
        mode: comments
            ?.split(/[^A-Za-z0-9]+/)
            .map(resolveMode)
            .find(Boolean),
        spotter: spotter || undefined,
        comments: comments || undefined,
    };
};

export const fetchDxSpots = async (): Promise<Spot[]> => {
    const { data } = await axios.get<string>(bustCache(DX_SPOTS_API), { timeout: TIMEOUT_MS, responseType: "text" });
    if (typeof data !== "string") throw new Error(`${DX_SPOTS_API} didn't answer with text`);
    return data
        .split("\n")
        .map(parseDxSpot)
        .filter((spot): spot is Spot => !!spot);
};
