import { DateTime } from "luxon";
import { useEffect, useSyncExternalStore } from "react";
import { notify } from "../notify";
import { useStore } from "../store";
import { useSettings } from "../use-settings";
import { MAX_PER_POLL, newSpotAlerts, rememberSpots, spotAlertNotification, spotAlertSummary } from "./alerts";
import { mergeSpots } from "./merge";
import { fetchPnpSpots } from "./parksnpeaks";
import { fetchPotaSpots } from "./pota";
import { fetchSotaSpots } from "./sota";
import { MergedSpot, Spot, SpotAlert, SpotSource, defaultSpotAlert } from "./types";

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
let config: { sources: SpotSource[]; proxy?: string; alert: SpotAlert } = {
    sources: [],
    proxy: undefined,
    alert: defaultSpotAlert,
};
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

// Undefined until the first poll comes back: that poll is the state of the world rather than news,
// so it primes the set and says nothing. Without it, opening the app would fire an alert for every
// activation already running.
let seen: Set<string> | undefined;

const announce = (spots: MergedSpot[]) => {
    if (!seen) {
        seen = rememberSpots(new Set(), spots);
        return;
    }
    if (config.alert.enabled) {
        // Read rather than subscribed to: the poller isn't a component, and `newOnly` is the only
        // thing here that wants the log at all.
        const fresh = newSpotAlerts(spots, config.alert, useStore.getState().qsos, seen);
        if (fresh.length > MAX_PER_POLL) void notify(spotAlertSummary(fresh.length));
        else fresh.forEach((spot) => void notify(spotAlertNotification(spot)));
    }
    // Remembered even while alerts are off, so switching them on mid-session doesn't announce the
    // hour of spots that was already on screen.
    rememberSpots(seen, spots);
};

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
    const spots = remerge(bySource);
    inFlight = false;
    setState({ bySource, spots, loading: false, fetchedAt: DateTime.utc() });
    announce(spots);
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

// Alerts are the second reason to keep polling. An operator who asked to be told about a spot meant
// while the app is open, not while they happen to have the list in front of them — the whole point
// is to be somewhere else. Without this the poller only runs behind the spots bar and the Spots
// page, and alerts are silent from every other screen.
const wanted = () => listeners.size > 0 || config.alert.enabled;

const sync = () => {
    if (wanted()) start();
    else stop();
};

export const configureSpots = (sources: SpotSource[], proxy: string | undefined, alert: SpotAlert) => {
    const same = sources.length === config.sources.length && sources.every((s, i) => config.sources[i] === s);
    const sameProxy = proxy === config.proxy;
    // The alert rules only decide what a later poll announces, so a change to them alone needs no
    // refetch — it just has to be in `config` before the next tick reads it, and the poller has to
    // be running at all.
    config = { ...config, alert };
    if (same && sameProxy) return sync();
    config = { sources, proxy, alert };
    // A source that was just switched off keeps no cache: leaving its spots in `bySource` would put
    // them back on screen the moment it was switched on again, dated and wrong.
    const bySource = Object.fromEntries(
        Object.entries(state.bySource).filter(([source]) => sources.includes(source as SpotSource)),
    ) as SpotsState["bySource"];
    setState({ bySource, spots: remerge(bySource) });
    sync();
    if (wanted()) void refreshSpots();
};

const subscribe = (listener: () => void) => {
    listeners.add(listener);
    start();
    return () => {
        listeners.delete(listener);
        // Nothing on screen is reading spots. The last state stays, so coming back to the page shows
        // it immediately while the refresh runs — but the timer only stops if alerts don't want it.
        sync();
    };
};

const getSnapshot = () => state;

/**
 * Hands the poller its settings without subscribing to the feed. Mounted once in the root layout, so
 * that switching alerts on from the Settings screen starts the poll that will raise them — every
 * other caller of `useSpots` is a component that only exists while spots are on screen.
 */
export const useSpotConfig = () => {
    const settings = useSettings();
    const sources = settings.spotSources;
    const proxy = settings.spotsProxy;
    const alert = settings.spotAlerts;
    useEffect(() => configureSpots(sources, proxy, alert), [sources, proxy, alert]);
};

export const useSpots = (): SpotsState => {
    useSpotConfig();
    return useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
};
