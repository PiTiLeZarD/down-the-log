import { DateTime } from "luxon";
import { useEffect, useSyncExternalStore } from "react";
import { useSettings } from "../use-settings";
import { mergeSpots } from "./merge";
import { fetchPnpSpots } from "./parksnpeaks";
import { fetchPotaSpots } from "./pota";
import { fetchSotaSpots } from "./sota";
import { MergedSpot, Spot, SpotSource } from "./types";

const REFRESH_MS = 60 * 1000;

const fetchers: Record<SpotSource, (proxy?: string) => Promise<Spot[]>> = {
    pota: () => fetchPotaSpots(),
    pnp: (proxy) => fetchPnpSpots(proxy),
    sota: () => fetchSotaSpots(),
};

export type SourceState = { spots: Spot[]; failed: boolean; fetchedAt?: DateTime };

export type SpotsState = {
    spots: MergedSpot[];
    bySource: Partial<Record<SpotSource, SourceState>>;
    loading: boolean;
    // No source has answered yet, as opposed to having answered with nothing.
    fetchedAt?: DateTime;
};

// One poller for the whole app: the bar on the log screen and the spots page read the same feed, and
// two components mounting must not mean two requests a minute to every network.
let state: SpotsState = { spots: [], bySource: {}, loading: false };
let config: { sources: SpotSource[]; proxy?: string } = { sources: [], proxy: undefined };
let timer: ReturnType<typeof setInterval> | undefined;
let inFlight = false;

const listeners = new Set<() => void>();
const emit = () => listeners.forEach((listener) => listener());
const setState = (next: Partial<SpotsState>) => {
    state = { ...state, ...next };
    emit();
};

const remerge = (bySource: SpotsState["bySource"]) =>
    mergeSpots(config.sources.flatMap((source) => bySource[source]?.spots || []));

export const refreshSpots = async (): Promise<void> => {
    // Walking the relay chain can outlast the interval, so a refresh still in flight when the next
    // tick lands keeps the tick rather than racing it.
    if (inFlight) return;
    inFlight = true;
    setState({ loading: true });
    const sources = config.sources;
    const results = await Promise.all(
        sources.map(async (source): Promise<[SpotSource, SourceState]> => {
            try {
                return [source, { spots: await fetchers[source](config.proxy), failed: false, fetchedAt: DateTime.utc() }];
            } catch {
                // A failed refresh keeps whatever that source last returned — a minute-old spot beats
                // an empty list, and one dead network must not blank the others.
                const previous = state.bySource[source];
                return [source, { spots: previous?.spots || [], failed: true, fetchedAt: previous?.fetchedAt }];
            }
        }),
    );
    const bySource = Object.fromEntries(results) as SpotsState["bySource"];
    inFlight = false;
    setState({ bySource, spots: remerge(bySource), loading: false, fetchedAt: DateTime.utc() });
};

const start = () => {
    if (timer) return;
    timer = setInterval(() => void refreshSpots(), REFRESH_MS);
    void refreshSpots();
};

const stop = () => {
    if (!timer) return;
    clearInterval(timer);
    timer = undefined;
};

export const configureSpots = (sources: SpotSource[], proxy?: string) => {
    const same = sources.length === config.sources.length && sources.every((s, i) => config.sources[i] === s);
    if (same && proxy === config.proxy) return;
    config = { sources, proxy };
    // A source that was just switched off keeps no cache: leaving its spots in `bySource` would put
    // them back on screen the moment it was switched on again, dated and wrong.
    const bySource = Object.fromEntries(
        Object.entries(state.bySource).filter(([source]) => sources.includes(source as SpotSource)),
    ) as SpotsState["bySource"];
    setState({ bySource, spots: remerge(bySource) });
    if (listeners.size) void refreshSpots();
};

const subscribe = (listener: () => void) => {
    listeners.add(listener);
    if (listeners.size === 1) start();
    return () => {
        listeners.delete(listener);
        // Nothing on screen is reading spots, so nothing needs fetching. The last state stays, so
        // coming back to the page shows it immediately while the refresh runs.
        if (!listeners.size) stop();
    };
};

const getSnapshot = () => state;

export const useSpots = (): SpotsState => {
    const settings = useSettings();
    const sources = settings.spotSources;
    const proxy = settings.spotsProxy;
    useEffect(() => configureSpots(sources, proxy), [sources, proxy]);
    return useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
};
