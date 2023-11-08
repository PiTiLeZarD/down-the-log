import { CallsignData, callsigns } from '../data/callsigns';

const callsignRegexp = /^(([0-9]{0,1}[^0-9]+)([0-9]{1,2})\/)?([0-9]{0,1}[^0-9]+)([0-9]{1,2})([^\/]+)\/{0,1}(.*)$/g;

type CsDataType = (CallsignData & { state?: string }) | undefined;
const csdata = (prefix: string, index: string): CsDataType => {
    const check = `${prefix}${index}`;
    const data: CsDataType = callsigns.find((cd) => cd.regexp.test(check));
    if (data?.states) {
        data.state = Object.entries(data.states).reduce<string | undefined>(
            (acc, [state, regexp]) => acc || (regexp.test(check) ? state : undefined),
            undefined
        );
    }
    return data;
};

export const parseCallsign = (callsign: string) => {
    const [, , locPrefix, locIndex, prefix, index, delineation, suffix] = Array.from(
        callsign.matchAll(callsignRegexp)
    )[0];

    return {
        locPrefix,
        locIndex,
        prefix,
        index,
        delineation,
        suffix,
        data: csdata(prefix, index),
        ...(locPrefix ? { locData: csdata(locPrefix, locIndex) } : {}),
    };
};