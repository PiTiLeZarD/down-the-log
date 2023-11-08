const callsignRegexp = /^(([0-9]{0,1}[^0-9]+)([0-9]{1,2})\/)?([0-9]{0,1}[^0-9]+)([0-9]{1,2})([^\/]+)\/{0,1}(.*)$/g;

const callsigns = [
    [/F/, 'FRA'],
    [/VK/, 'AUS'],
    [/9W/, 'MYS'],
    [/I[A-HKLNP]{0,1}/, 'ITA'],
    [/D[A-DF-HJKP]/, 'DEU'],
];

export const parseCallsign = (callsign: string) => {
    const [, , locPrefix, locIndex, prefix, index, delineation, suffix] = Array.from(
        callsign.matchAll(callsignRegexp)
    )[0];

    const country = callsigns.reduce<string | undefined>(
        (acc, [regexp, iso3]) => acc || (prefix.match(regexp as RegExp) ? (iso3 as string) : undefined),
        undefined
    );

    const locCountry = locPrefix
        ? callsigns.reduce<string | undefined>(
              (acc, [regexp, iso3]) => acc || (locPrefix.match(regexp as RegExp) ? (iso3 as string) : undefined),
              undefined
          )
        : undefined;

    return { locPrefix, locIndex, prefix, index, delineation, suffix, country, locCountry };
};
