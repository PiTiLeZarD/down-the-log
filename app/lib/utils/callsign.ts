import { CallsignData, callsigns } from "../data/callsigns";
import { countries } from "../data/countries";

const callsignRegexp = /^(([0-9]{0,1}[^0-9]+)([0-9]{1,2})\/)?([0-9]{0,1}[^0-9]+)([0-9]{1,2})([^\/-]+)[\/-]{0,1}(.*)$/g;

export type CsDataType = (CallsignData & { state?: string }) | undefined;
export const getCallsignData = (callsign: string): CsDataType => {
    if (!callsign) return undefined;

    const data: CsDataType = callsigns.find((cd) => cd.regexp.test(callsign));
    if (data?.states) {
        data.state = Object.entries(data.states).reduce<string | undefined>(
            (acc, [state, regexp]) => acc || (regexp.test(callsign) ? state : undefined),
            undefined,
        );
    }
    return data;
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

export const baseCallsign = (callsign: string) => {
    const parsed = parseCallsign(callsign);
    if (!parsed) return undefined;
    return `${parsed.prefix}${parsed.index}${parsed.delineation}`;
};

export const findCountry = (csdata: CsDataType) => (csdata?.iso3 ? countries[csdata?.iso3] : undefined);
