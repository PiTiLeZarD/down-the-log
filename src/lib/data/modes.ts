// The ADIF MODE enumeration.
export const adifModes = [
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

export type AdifMode = (typeof adifModes)[number];

// ADIF files these under a parent MODE (MODE=MFSK SUBMODE=JS8), but that's not how anyone thinks of
// them on air: nobody picks "MFSK" to work JS8. So the popular ones are modes of their own here, and
// only the file formats see the parent/submode split (`adifMode`, `liftSubmode`).
export const submodeParents = {
    FT4: "MFSK",
    FST4: "MFSK",
    JS8: "MFSK",
    Q65: "MFSK",
    FREEDV: "DIGITALVOICE",
} as const satisfies Record<string, AdifMode>;

export type Submode = keyof typeof submodeParents;

export const modes = [...adifModes, ...(Object.keys(submodeParents) as Submode[])].sort();

export type Mode = AdifMode | Submode;

const isSubmode = (mode?: string): mode is Submode => !!mode && mode in submodeParents;

// What goes in the ADIF MODE field for a mode, and in SUBMODE when it's one of ours.
export const adifMode = (mode?: Mode): { mode?: AdifMode; submode?: Submode } =>
    isSubmode(mode) ? { mode: submodeParents[mode], submode: mode } : { mode };

// The list above is the ADIF MODE enumeration, but plenty of loggers write a submode (or their own
// shorthand) in the MODE field: WSJT-X writes FT4, JS8Call writes JS8, cabrillo writes PH/RY/DG.
// Without this mapping those imports end up with no mode at all.
const modeAliases: Record<string, Mode> = {
    USB: "SSB",
    LSB: "SSB",
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
    ["FST4", "FST4"],
    ["Q65", "Q65"],
    ["JS8", "JS8"],
    ["FREEDV", "FREEDV"],
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

// A QSO read from a file: MODE=MFSK with SUBMODE=JS8 (or a submode stashed in the honeypot by an
// older import) is a JS8 QSO. Anything else is left alone, including submodes we don't pick.
export const liftSubmode = <T extends { mode?: Mode; honeypot?: Record<string, string> }>(qso: T): T => {
    const submode = resolveMode(qso.honeypot?.submode);
    if (!isSubmode(submode) || submodeParents[submode] !== qso.mode) return qso;
    const { submode: _, ...honeypot } = qso.honeypot!;
    return { ...qso, mode: submode, honeypot };
};

export const isDigital = (mode?: Mode) =>
    [
        "JT4",
        "JT6M",
        "JT9",
        "JT44",
        "JT65",
        "FT8",
        "FT4",
        "FST4",
        "JS8",
        "Q65",
        "WSPR",
        "MFSK",
        "MSK144",
        "FSK441",
    ].includes(mode || "");

// The report a QSO starts on: 59 everywhere except the weak-signal digital modes, which are reported
// in dB. One definition so the form, the Signal picker and the log path can't disagree.
export const defaultRst = (mode?: Mode): string => (isDigital(mode) ? "-1" : "59");
