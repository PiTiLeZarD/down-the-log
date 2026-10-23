import { DateTime } from "luxon";
import { useEffect, useSyncExternalStore } from "react";
import { freq2band } from "../../data/bands";
import { isTauri } from "../notify";
import { useDebouncedValue } from "../use-debounced-value";
import { useSettings } from "../use-settings";
import { spotMode } from "./dx";
import { DxCluster, Spot } from "./types";

// The desktop build's telnet DX clusters, the webview's half of src-tauri/src/cluster.rs: Rust holds
// the sockets and hands every line over; this side keeps the connections in step with the settings
// and turns lines into spots. The browser and the phones read HamQTH's copy of the feed instead.

type ClusterEvent = { kind: "status"; connected: boolean; message: string } | { kind: "line"; text: string };
export type ClusterStatus = {
    connected: boolean;
    message: string;
    // Since this connection opened: "connected" only means the socket is up, and these say whether
    // the login took and spots are flowing.
    spots: number;
    lastSpot?: DateTime;
    // The last thing the cluster said, which is where a refused login shows up.
    lastLine?: string;
};

// "DX de W3LPL-#:   14025.0  K1ABC   CW 25 dB 22 WPM CQ   0123Z FN20" — the locator is optional, and
// matching the time from the end keeps a "sked 0500Z" in the comment out of it.
const SPOT_LINE = /^DX de ([^:\s]+):\s+(\d+(?:\.\d+)?)\s+(\S+)\s*(.*?)\s*(\d{4})Z(?:\s+\S+)?\s*$/i;

export const parseClusterLine = (text: string, now: DateTime = DateTime.utc()): Spot | undefined => {
    const match = SPOT_LINE.exec(text);
    if (!match) return undefined;
    const [, spotter, khz, callsign, comments, hhmm] = match;
    const frequency = +khz / 1000;
    let date = now.set({ hour: +hhmm.slice(0, 2), minute: +hhmm.slice(2), second: 0, millisecond: 0 });
    // Only the time of day is sent: one later than now was spotted before midnight UTC.
    if (date > now.plus({ minutes: 5 })) date = date.minus({ days: 1 });
    return {
        // Clusters are linked, so each one connected passes on the same spot; the id makes them one.
        id: `dxc-${spotter}-${callsign}-${khz}-${hhmm}`.toUpperCase(),
        source: "dx",
        date,
        callsign: callsign.toUpperCase(),
        frequency,
        band: freq2band(frequency) || undefined,
        mode: spotMode(comments, frequency),
        spotter,
        comments: comments || undefined,
        // Skimmers sign as CALL-#.
        automatic: spotter.endsWith("-#"),
    };
};

// Two hours covers the longest age the spot filter offers.
const KEEP_MINUTES = 120;

let spots: Spot[] = [];
let statuses: Record<string, ClusterStatus> = {};
// What each open connection was made with, so a settings change reconnects only the cluster it touched.
const open = new Map<string, string>();
let flushTimer: ReturnType<typeof setTimeout> | undefined;
let onSpots: (() => void) | undefined;
const listeners = new Set<() => void>();
const emit = () => listeners.forEach((listener) => listener());

/** The spots poller's hook for news: called at most once a second while a cluster is talking. */
export const setClusterListener = (listener: () => void) => {
    onSpots = listener;
};

export const clusterSpots = (): Spot[] => spots;
export const clustersOpen = (): boolean => open.size > 0;

// The ids in `spots` and `incoming`, so a duplicate is one lookup rather than a scan of two hours.
const ids = new Set<string>();
let incoming: Spot[] = [];

// Batched: a busy cluster sends several spots a second, and each push re-merges the whole feed.
// Pruning happens here too, once a flush rather than once a line.
const flush = () => {
    flushTimer = undefined;
    const cutoff = DateTime.utc().minus({ minutes: KEEP_MINUTES });
    const kept = spots.filter((s) => s.date >= cutoff);
    spots.forEach((s) => s.date < cutoff && ids.delete(s.id));
    spots = [...incoming.reverse(), ...kept];
    incoming = [];
    onSpots?.();
};

const addSpot = (spot: Spot) => {
    if (ids.has(spot.id)) return;
    ids.add(spot.id);
    incoming.push(spot);
    flushTimer ??= setTimeout(flush, 1000);
};

const core = () => import("@tauri-apps/api/core");

/** Opens, reopens and closes connections until they match the enabled clusters. */
export const syncClusters = async (clusters: DxCluster[], myCallsign: string): Promise<void> => {
    if (!isTauri()) return;
    const { Channel, invoke } = await core();
    const wanted = clusters.flatMap((cluster) => {
        const login = (cluster.login || myCallsign).trim().toUpperCase();
        if (!cluster.enabled || !cluster.host.trim() || !cluster.port || !login) return [];
        const commands = (cluster.commands || "")
            .split("\n")
            .map((line) => line.trim())
            .filter(Boolean);
        const key = JSON.stringify([cluster.host.trim(), cluster.port, login, cluster.password, commands]);
        return [{ cluster, login, commands, key }];
    });
    // The bookkeeping is done before any await, so two syncs in quick succession can't both connect.
    const closing = [...open.keys()].filter((id) => !wanted.some(({ cluster }) => cluster.id === id));
    const opening = wanted.filter(({ cluster, key }) => open.get(cluster.id) !== key);
    closing.forEach((id) => {
        open.delete(id);
        delete statuses[id];
    });
    opening.forEach(({ cluster, key }) => open.set(cluster.id, key));
    statuses = { ...statuses };
    emit();

    await Promise.all(closing.map((id) => invoke("cluster_disconnect", { id })));
    await Promise.all(
        opening.map(({ cluster, login, commands, key }) => {
            const channel = new Channel<ClusterEvent>();
            channel.onmessage = (event) => {
                // The last words of a connection a settings change has already replaced.
                if (open.get(cluster.id) !== key) return;
                const previous = statuses[cluster.id] || { connected: false, message: "", spots: 0 };
                if (event.kind === "status") {
                    statuses = {
                        ...statuses,
                        [cluster.id]: { connected: event.connected, message: event.message, spots: 0 },
                    };
                } else {
                    const spot = parseClusterLine(event.text);
                    if (spot) addSpot(spot);
                    statuses = {
                        ...statuses,
                        [cluster.id]: spot
                            ? { ...previous, spots: previous.spots + 1, lastSpot: DateTime.utc() }
                            : { ...previous, lastLine: event.text },
                    };
                }
                emit();
            };
            // Rust replaces an open connection with the same id, so a changed cluster needs no disconnect.
            return invoke("cluster_connect", {
                id: cluster.id,
                host: cluster.host.trim(),
                port: cluster.port,
                login,
                password: cluster.password || null,
                commands,
                onEvent: channel,
            });
        }),
    );
};

/** Sends a line to the first connected cluster: they're linked, so one is enough to reach them all. */
export const sendToCluster = async (line: string): Promise<void> => {
    const id = Object.keys(statuses).find((key) => statuses[key].connected);
    if (!id) throw new Error("no DX cluster is connected — see Settings > APIs.");
    await (await core()).invoke("cluster_send", { id, line });
};

const subscribe = (listener: () => void) => {
    listeners.add(listener);
    return () => listeners.delete(listener);
};

export const useClusterStatus = (): Record<string, ClusterStatus> => useSyncExternalStore(subscribe, () => statuses);

/** Mounted once in the root layout: clusters stay connected from every screen, like spot alerts. */
export const useClusterConfig = () => {
    const settings = useSettings();
    // Settled first: typing a host name would otherwise try to connect to every prefix of it.
    const clusters = useDebouncedValue(settings.dxClusters, 1000);
    const myCallsign = settings.myCallsign;
    useEffect(() => void syncClusters(clusters, myCallsign), [clusters, myCallsign]);
};
