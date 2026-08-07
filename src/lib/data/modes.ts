export const modes = [
    "AM",
    "ARDOP",
    "ATV",
    "CHIP",
    "CLO",
    "CONTESTI",
    "CW",
    "DIGITALVOICE",
    "DOMINO",
    "DYNAMIC",
    "FAX",
    "FM",
    "FSK441",
    "FT8",
    "HELL",
    "ISCAT",
    "JT4",
    "JT6M",
    "JT9",
    "JT44",
    "JT65",
    "MFSK",
    "MSK144",
    "MT63",
    "OLIVIA",
    "OPERA",
    "PAC",
    "PAX",
    "PKT",
    "PSK",
    "PSK2K",
    "Q15",
    "QRA64",
    "ROS",
    "RTTY",
    "RTTYM",
    "SSB",
    "SSTV",
    "T10",
    "THOR",
    "THRB",
    "TOR",
    "V4",
    "VOI",
    "WINMOR",
    "WSPR",
] as const;

export type Mode = (typeof modes)[number];

// The list above is the ADIF MODE enumeration, but plenty of loggers write a submode (or their own
// shorthand) in the MODE field: WSJT-X writes FT4, JS8Call writes JS8, cabrillo writes PH/RY/DG.
// Without this mapping those imports end up with no mode at all.
const modeAliases: Record<string, Mode> = {
    USB: "SSB",
    LSB: "SSB",
    FT4: "MFSK",
    JS8: "MFSK",
    C4FM: "DIGITALVOICE",
    DSTAR: "DIGITALVOICE",
    DMR: "DIGITALVOICE",
    FUSION: "DIGITALVOICE",
    AMTOR: "TOR",
    GTOR: "TOR",
    NAVTEX: "TOR",
    SITORB: "TOR",
    // cabrillo mode codes
    PH: "SSB",
    RY: "RTTY",
    DG: "MFSK",
};

// submodes that only ever prefix their parent mode (MFSK16, PSK31, JT65B, OLIVIA 8/250, PACTOR...)
const modePrefixes: [string, Mode][] = [
    ["MFSK", "MFSK"],
    ["PSK", "PSK"],
    ["QPSK", "PSK"],
    ["JT65", "JT65"],
    ["JT9", "JT9"],
    ["JT4", "JT4"],
    ["OLIVIA", "OLIVIA"],
    ["DOMINO", "DOMINO"],
    ["PAC", "PAC"],
    ["ROS", "ROS"],
    ["THOR", "THOR"],
    ["THRB", "THRB"],
    ["CHIP", "CHIP"],
    ["HELL", "HELL"],
    ["MT63", "MT63"],
    ["CONTESTI", "CONTESTI"],
];

export const resolveMode = (value?: string): Mode | undefined => {
    if (!value) return undefined;
    const clean = value.toUpperCase().trim();
    if (modes.includes(clean as Mode)) return clean as Mode;
    if (clean in modeAliases) return modeAliases[clean];
    return modePrefixes.find(([prefix]) => clean.startsWith(prefix))?.[1];
};

export const isDigital = (mode?: Mode) =>
    ["JT4", "JT6M", "JT9", "JT44", "JT65", "FT8", "WSPR", "MFSK", "MSK144", "FSK441"].includes(mode || "");
