import { CallsignData, callsigns } from "../data/callsigns";
import { countries } from "../data/countries";

const callsignRegexp = /^(([0-9]{0,1}[^0-9]+)([0-9]{1,2})\/)?([0-9]{0,1}[^0-9]+)([0-9]{1,2})([^\/-]+)[\/-]{0,1}(.*)$/g;

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

export const baseCallsign = (callsign: string) => {
    const parsed = parseCallsign(callsign);
    if (!parsed) return undefined;
    return `${parsed.prefix}${parsed.index}${parsed.delineation}`;
};

export const findCountry = (csdata: CallsignDataWithState) => (csdata?.iso3 ? countries[csdata?.iso3] : undefined);
