import { stateRegexps } from "../data/callsigns";
import { countries } from "../data/countries";
import { CallsignData, ctyException, ctyPrefix } from "../data/cty";

// The location prefix index is optional: plenty of prefixes carry no digit at all (F/, PA/, ON/),
// and requiring one meant F/VK4ALE parsed as the single prefix "F/VK" instead of a French operation
// by VK4ALE.
const callsignRegexp = /^(([0-9]{0,1}[^0-9]+)([0-9]{0,2})\/)?([0-9]{0,1}[^0-9]+)([0-9]{1,2})([^\/-]+)[\/-]{0,1}(.*)$/g;

export type CallsignDataWithState = (CallsignData & { state?: string }) | undefined;

export const withState = (callsign: string, csdata?: CallsignData): CallsignDataWithState => {
    if (!csdata) return undefined;
    const regexps = stateRegexps[csdata.dxcc];
    if (!regexps) return csdata;
    return {
        ...csdata,
        state: Object.entries(regexps).reduce<string | undefined>(
            (acc, [state, regexp]) => acc || (regexp.test(callsign) ? state : undefined),
            undefined,
        ),
    };
};

/**
 * Resolves a callsign to the DXCC entity it was worked from.
 *
 * cty.dat names ~23k individual callsigns that its own prefixes would get wrong — a DXpedition on a
 * borrowed prefix, an operation from a rock that shares a prefix with the mainland — so exceptions
 * are tried before prefixes. The whole callsign goes first, because the exception list holds
 * portable forms as written (`9M6/LA6VM`).
 *
 * A location prefix then wins over anything the home callsign says, exceptions included: `EA8/DL1ABC`
 * is in the Canaries whatever the table has to say about DL1ABC. Everything else falls back to the
 * base call, and prefix matching runs on the collapsed form, so the lookup is `EA8ABC`.
 */
const resolve = (callsign: string): CallsignData | undefined => {
    const raw = callsign.toUpperCase();
    const byPrefix = () => ctyPrefix(collapseCallsign(raw)) || ctyPrefix(raw);

    const exact = ctyException(raw);
    if (exact) return exact;
    if (parseCallsign(raw)?.locPrefix) return byPrefix();

    const base = baseCallsign(raw);
    return (base ? ctyException(base) : undefined) || byPrefix();
};

// Every QSO row that renders re-resolves the callsigns it shows, and the log is the same few
// thousand strings over and over, so the answer is kept.
const resolveCache = new Map<string, CallsignDataWithState>();

export const getCallsignData = (callsign: string): CallsignDataWithState => {
    if (!callsign) return undefined;
    if (!resolveCache.has(callsign)) resolveCache.set(callsign, withState(callsign, resolve(callsign)));
    return resolveCache.get(callsign);
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

// The flag and the ISO country name, for the entities ISO has a code for. The DXCC entity name on
// the data itself is what names the rest — and names sub-entities properly, which the country never
// could: every island ISO folds into its parent used to read as the parent.
export const findCountry = (csdata: CallsignDataWithState) => (csdata?.iso3 ? countries[csdata?.iso3] : undefined);
