import axios from "axios";
import { DateTime } from "luxon";
import React, { useEffect } from "react";
import { Platform, ScrollView } from "react-native";
import { StyleSheet } from "react-native-unistyles";
import { Band, freq2band } from "../data/bands";
import { useWidthMatches } from "../ui/breakpoints";
import { Button } from "../ui/button";
import { ColourVariant } from "../ui/theme";
import { Typography } from "../ui/typography";
import { Modal } from "../utils/modal";
import { useStore } from "../utils/store";
import { useSettings } from "../utils/use-settings";
import { Stack } from "./stack";

// What ParksnPeaks actually returns from /api/ALL. Everything is a string, including the
// frequency, and `actSpoter` really is spelled that way on their side.
type RawSpot = {
    actID: string;
    actTime: string;
    actCallsign: string;
    actMode: string;
    actFreq: string;
    actClass: string;
    altClass: string;
    actSiteID: string;
    actLocation: string;
    altLocation: string;
    actComments: string;
    actSpoter: string;
    WWFFid: string;
};

type Spot = {
    id: string;
    date: DateTime;
    callsign: string;
    mode: string;
    frequency?: number;
    band?: Band;
    activityClass: string;
    site: string;
    location: string;
    comments: string;
    spotter: string;
    wwff: string;
};

const API = "https://parksnpeaks.org/api/ALL";
const REFRESH_MS = 60 * 1000;
const MAX_SPOTS = 40;
// A spot older than this says nothing about who's on air now, so it never reaches the bar.
const MAX_AGE_MINUTES = 60;
const TIMEOUT_MS = 12000;

// ParksnPeaks serves no `access-control-allow-origin`, so anything running in a browser engine —
// the web build and the Tauri shell alike — can't reach it directly and has to go through a relay.
// Native has no such rule and talks to the API itself.
//
// The free relays are mostly useless against this particular host: the ones that proxy from a data
// centre get refused or time out. jina.ai is the one that answers reliably, so it leads, with the
// other two behind it in case that changes. Only public spot data crosses them, never credentials —
// an operator who'd rather not involve a third party at all can point `spotsProxy` at their own
// relay (see scripts/cors-worker.js), which is then tried first.
const relays = [
    (url: string) => `https://r.jina.ai/${url}`,
    (url: string) => `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`,
    (url: string) => `https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(url)}`,
];

const applyProxy = (template: string, url: string) =>
    template.includes("{url}")
        ? template.replace("{url}", encodeURIComponent(url))
        : `${template}${encodeURIComponent(url)}`;

const sourcesFor = (proxy?: string): string[] => {
    // The cache-buster isn't optional: a relay's failure response was coming back out of the
    // browser's disk cache, so one stale 408 answered every retry for as long as it lived.
    const url = `${API}?_=${Date.now()}`;
    if (Platform.OS !== "web") return [url];
    const chain = relays.map((relay) => relay(url));
    return proxy ? [applyProxy(proxy, url), ...chain] : chain;
};

// Relays disagree about how much they wrap the payload — some hand back the raw body, jina.ai
// prefixes it with markdown headers. The spot array is the only JSON any of them carry, so it's cut
// out by its brackets rather than by trusting the envelope.
const parseArray = (body: unknown): RawSpot[] | undefined => {
    if (Array.isArray(body)) return body as RawSpot[];
    if (typeof body !== "string") return undefined;
    const start = body.indexOf("[");
    const end = body.lastIndexOf("]");
    if (start < 0 || end < start) return undefined;
    try {
        const parsed = JSON.parse(body.slice(start, end + 1));
        return Array.isArray(parsed) ? (parsed as RawSpot[]) : undefined;
    } catch {
        return undefined;
    }
};

const fetchSpots = async (proxy?: string): Promise<RawSpot[]> => {
    for (const url of sourcesFor(proxy)) {
        try {
            const { data } = await axios.get(url, { timeout: TIMEOUT_MS });
            const spots = parseArray(data);
            if (spots) return spots;
        } catch {
            // A dead relay is the normal case rather than the exception: fall through to the next.
        }
    }
    throw new Error("no ParksnPeaks source answered");
};

// Spot times are UTC, spelled without a zone.
const parseSpot = (raw: RawSpot): Spot => {
    const frequency = raw.actFreq ? +raw.actFreq : undefined;
    return {
        id: raw.actID,
        date: DateTime.fromFormat(raw.actTime, "yyyy-MM-dd HH:mm:ss", { zone: "utc" }),
        callsign: raw.actCallsign,
        mode: raw.actMode,
        frequency: frequency && !isNaN(frequency) ? frequency : undefined,
        band: freq2band(frequency) || undefined,
        activityClass: raw.actClass || raw.altClass,
        site: raw.actSiteID || raw.WWFFid,
        location: raw.actLocation || raw.altLocation,
        comments: raw.actComments,
        spotter: raw.actSpoter,
        wwff: raw.WWFFid,
    };
};

const classColours: Record<string, ColourVariant> = {
    SOTA: "primary",
    WWFF: "success",
    POTA: "secondary",
};

const styles = StyleSheet.create((theme) => ({
    container: {
        backgroundColor: theme.background,
    },
    // The pills take whatever the label and the close button leave, and scroll inside it.
    scroller: {
        flexGrow: 1,
        flexShrink: 1,
    },
}));

const Detail = ({ label, value }: { label: string; value?: string }) =>
    value ? (
        <Stack direction="row" gap="xxl">
            <Typography variant="em">{label}:</Typography>
            <Typography>{value}</Typography>
        </Stack>
    ) : null;

export const ParksNPeaks = () => {
    const updateSetting = useStore((state) => state.updateSetting);
    const settings = useSettings();
    const [spots, setSpots] = React.useState<Spot[]>();
    const [failed, setFailed] = React.useState<boolean>(false);
    const [selected, setSelected] = React.useState<Spot | undefined>(undefined);
    const smallScreen = useWidthMatches(undefined, "md");
    const proxy = settings.spotsProxy;

    useEffect(() => {
        let live = true;
        // Walking the whole relay chain can outlast the interval, so a refresh that's still in
        // flight when the next tick lands keeps the tick rather than racing it.
        let inFlight = false;
        // A failed refresh keeps whatever was on screen — a minute-old spot beats an empty bar.
        const refresh = () => {
            if (inFlight) return;
            inFlight = true;
            fetchSpots(proxy)
                .then((raw) => {
                    if (!live) return;
                    const cutoff = DateTime.utc().minus({ minutes: MAX_AGE_MINUTES });
                    setSpots(
                        raw
                            .map(parseSpot)
                            // An unparseable time can't be shown to be recent, so it goes with the stale ones.
                            .filter((spot) => spot.date.isValid && spot.date > cutoff)
                            .sort((a, b) => b.date.toMillis() - a.date.toMillis())
                            .slice(0, MAX_SPOTS),
                    );
                    setFailed(false);
                })
                .catch(() => live && setFailed(true))
                .finally(() => (inFlight = false));
        };
        refresh();
        const ts = setInterval(refresh, REFRESH_MS);
        return () => {
            live = false;
            clearInterval(ts);
        };
    }, [proxy]);

    const status =
        spots === undefined ? (failed ? "Spots unavailable" : "Fetching spots...") : "No spots in the last hour";

    return (
        <Stack style={styles.container}>
            <Stack direction="row" gap="xxl">
                <Typography variant="em">{smallScreen ? "Spots:" : "ParksnPeaks:"}</Typography>
                {spots?.length ? (
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.scroller}>
                        <Stack direction="row">
                            {spots.map((spot) => (
                                <Button
                                    key={spot.id}
                                    variant="chip"
                                    colour={classColours[spot.activityClass] || "grey"}
                                    text={`${spot.callsign} ${spot.band || (spot.frequency ? `${spot.frequency}MHz` : "?")}`}
                                    onPress={() => setSelected(spot)}
                                />
                            ))}
                        </Stack>
                    </ScrollView>
                ) : (
                    <Typography variant="subtitle" style={{ flexGrow: 1 }}>
                        {status}
                    </Typography>
                )}
                <Button startIcon="close" onPress={() => updateSetting("showSpots", false)} style={{ flexGrow: 0 }} />
            </Stack>
            <Modal open={!!selected} onClose={() => setSelected(undefined)}>
                {selected && (
                    <Stack gap="xxl">
                        <Typography variant="h2">{selected.callsign}</Typography>
                        <Stack>
                            <Detail label="Spotted" value={selected.date.toRelative() || undefined} />
                            <Detail label="Time" value={`${selected.date.toFormat("yyyy-MM-dd HH:mm")}z`} />
                            <Detail
                                label="Frequency"
                                value={selected.frequency ? `${selected.frequency}MHz` : undefined}
                            />
                            <Detail label="Band" value={selected.band} />
                            <Detail label="Mode" value={selected.mode} />
                            <Detail label="Activity" value={selected.activityClass} />
                            <Detail label="Reference" value={selected.site} />
                            <Detail label="Location" value={selected.location} />
                            {/* The WWFF id is only worth a line of its own when it isn't the reference already. */}
                            <Detail
                                label="WWFF"
                                value={selected.wwff && selected.wwff !== selected.site ? selected.wwff : undefined}
                            />
                            <Detail label="Spotter" value={selected.spotter} />
                            <Detail label="Comments" value={selected.comments} />
                        </Stack>
                        <Button colour="success" text="OK" onPress={() => setSelected(undefined)} />
                    </Stack>
                )}
            </Modal>
        </Stack>
    );
};
