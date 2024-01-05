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
