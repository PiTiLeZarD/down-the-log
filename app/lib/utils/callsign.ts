import { CallsignData, callsigns } from "../data/callsigns";
import { countries } from "../data/countries";

// The location prefix index is optional: plenty of prefixes carry no digit at all (F/, PA/, ON/),
// and requiring one meant F/VK4ALE parsed as the single prefix "F/VK" instead of a French operation
// by VK4ALE.
const callsignRegexp = /^(([0-9]{0,1}[^0-9]+)([0-9]{0,2})\/)?([0-9]{0,1}[^0-9]+)([0-9]{1,2})([^\/-]+)[\/-]{0,1}(.*)$/g;

export type CallsignDataWithState = (CallsignData & { state?: string }) | undefined;
export const withState = (callsign: string, csdata?: CallsignData): CallsignDataWithState =>
    csdata
        ? {
              ...csdata,
              state: csdata.states
                  ? Object.entries(csdata.states).reduce<string | undefined>(
                        (acc, [state, regexp]) => acc || (regexp.test(callsign) ? state : undefined),
                        undefined,
                    )
                  : undefined,
          }
        : undefined;

export const getCallsignData = (callsign: string): CallsignDataWithState => {
    if (!callsign) return undefined;
    const data = callsigns.find((cd) => cd.regexp.test(baseCallsign(callsign) || callsign));
    return withState(callsign, data);
};

export const parseCallsign = (callsign: string) => {
    if (!callsign) return undefined;

    const match = Array.from(callsign.matchAll(callsignRegexp));
    if (match.length === 0) return undefined;

    const [, , locPrefix, locIndex, prefix, index, delineation, suffix] = match[0];
    return {
        locPrefix,
        locIndex,
        prefix,
        index,
        delineation,
        suffix,
    };
};

export const collapseCallsign = (callsign: string): string => {
    const parsed = parseCallsign(callsign);
    if (parsed?.locPrefix) return `${parsed?.locPrefix}${parsed?.locIndex || parsed?.index}${parsed?.delineation}`;
    return baseCallsign(callsign) || callsign;
};

// Dedup and list rendering call this over and over on the same handful of strings, and each miss
// runs the callsign regexp. Callsigns are a bounded set, so a plain cache is enough.
const baseCallsignCache = new Map<string, string | undefined>();

export const baseCallsign = (callsign: string) => {
    const cached = baseCallsignCache.get(callsign);
    if (cached !== undefined || baseCallsignCache.has(callsign)) return cached;

    const parsed = parseCallsign(callsign);
    const base = parsed ? `${parsed.prefix}${parsed.index}${parsed.delineation}` : undefined;
    baseCallsignCache.set(callsign, base);
    return base;
};

export const findCountry = (csdata: CallsignDataWithState) => (csdata?.iso3 ? countries[csdata?.iso3] : undefined);
