import { DateTime, Settings } from "luxon";
import { describe, expect, test } from "vitest";
import { QSO } from "../app/lib/components/qso";
import { getFileApiFromFilename } from "../app/lib/utils/file-format";
import { AdifAPI } from "../app/lib/utils/file-format/adif";
import { AdxAPI } from "../app/lib/utils/file-format/adx";
import {
    QSORecord,
    castAs,
    header,
    int,
    qso2record,
    record2qso,
    sanitize,
    unsanitize,
} from "../app/lib/utils/file-format/common";

const qso: QSO = {
    id: "test-id",
    date: DateTime.fromISO("2024-01-01T10:15:00", { zone: "utc" }),
    dateOff: DateTime.fromISO("2024-01-01T10:25:00", { zone: "utc" }),
    callsign: "VK4ALE",
    myCallsign: "G4ABC",
    band: "20m",
    frequency: 14.2,
    mode: "SSB",
    power: 5,
    rst_sent: "59",
    rst_received: "57",
    locator: "QG62nl",
    myLocator: "IO91wm",
    country: "AUS",
    dxcc: 150,
    cqzone: 30,
    ituzone: 55,
    continent: "OC",
    state: "QLD",
    name: "Jono",
    distance: 16535.06,
    eqsl_sent: true,
    eqsl_received: false,
    note: "hi <there> & 'quote'",
    myPota: "VK-0001",
    pota: "VK-0002",
    honeypot: { weird_field: "keepme" },
};

const record = (fields: Partial<Record<string, string>>): QSORecord =>
    ({ honeypot: {}, ...fields }) as unknown as QSORecord;

describe("sanitize / unsanitize", () => {
    test("escapes the XML significant characters", () => {
        expect(sanitize("a<b>c&d'e\"f")).toBe("a&lt;b&gt;c&amp;d&apos;e&quot;f");
    });

    test("folds the typographic double quote onto the straight one", () => {
        expect(sanitize("a”b")).toBe("a&quot;b");
    });

    test("round trips back to the original", () => {
        const text = "a<b>c&d'e\"f";
        expect(unsanitize(sanitize(text))).toBe(text);
    });

    test("leaves text without special characters alone", () => {
        expect(sanitize("POTA VK-0001")).toBe("POTA VK-0001");
        expect(unsanitize("POTA VK-0001")).toBe("POTA VK-0001");
    });
});

test("unsanitize leaves entities it doesn't know alone", () => {
    expect(unsanitize("a&nbsp;b")).toBe("a&nbsp;b");
    expect(unsanitize("&copy; 2024 &amp; on")).toBe("&copy; 2024 & on");
});

describe("int / castAs", () => {
    test("int parses a numeric string and passes undefined through", () => {
        expect(int("42")).toBe(42);
        expect(int("14.2")).toBe(14.2);
        expect(int(undefined)).toBeUndefined();
    });

    test("castAs accepts a known value, upper cased and trimmed", () => {
        expect(castAs(["SSB", "CW"], " ssb ")).toBe("SSB");
    });

    test("castAs rejects anything not in the list", () => {
        expect(castAs(["SSB", "CW"], "NOPE")).toBeUndefined();
        expect(castAs(["SSB", "CW"], undefined)).toBeUndefined();
    });
});

describe("qso2record", () => {
    test("splits the timestamps into ADIF date and time fields", () => {
        const r = qso2record(qso);
        expect(r.qso_date).toBe("20240101");
        expect(r.time_on).toBe("101500");
        expect(r.qso_date_off).toBe("20240101");
        expect(r.time_off).toBe("102500");
    });

    test("writes myCallsign to both STATION_CALLSIGN and OPERATOR", () => {
        const r = qso2record(qso);
        expect(r.station_callsign).toBe("G4ABC");
        expect(r.operator).toBe("G4ABC");
    });

    test("writes the QSL flags we know, and nothing for the ones we don't", () => {
        const r = qso2record(qso);
        expect(r.eqsl_qsl_sent).toBe("Y");
        expect(r.eqsl_qsl_rcvd).toBe("N");
        expect(r.lotw_qsl_sent).toBeUndefined();
        expect(r.lotw_qsl_rcvd).toBeUndefined();
    });

    test("writes COUNTRY as the DXCC entity name", () => {
        expect(qso2record(qso).country).toBe("Australia");
    });

    test("passes a country it can't translate through as it stands", () => {
        expect(qso2record({ ...qso, country: "Freedonia" }).country).toBe("Freedonia");
    });

    test("stringifies numbers", () => {
        const r = qso2record(qso);
        expect(r.freq).toBe("14.2");
        expect(r.tx_pwr).toBe("5");
        expect(r.dxcc).toBe("150");
    });

    test("leaves absent fields undefined instead of writing an empty tag", () => {
        expect(qso2record({ ...qso, name: undefined }).name).toBeUndefined();
    });

    test("carries the honeypot across", () => {
        expect(qso2record(qso).honeypot).toEqual({ weird_field: "keepme" });
        expect(qso2record({ ...qso, honeypot: undefined }).honeypot).toEqual({});
    });
});

describe("record2qso", () => {
    test("reads the fields back with their QSO types", () => {
        const q = record2qso(qso2record(qso));
        expect(q.frequency).toBe(14.2);
        expect(q.power).toBe(5);
        expect(q.dxcc).toBe(150);
        expect(q.eqsl_sent).toBe(true);
        expect(q.eqsl_received).toBe(false);
    });

    test("reads COUNTRY back as written, not mangled", () => {
        expect(record2qso(qso2record(qso)).country).toBe("AUS");
    });

    test("reads another logger's COUNTRY name back as our iso3", () => {
        expect(record2qso(record({ country: "australia" })).country).toBe("AUS");
        // Files this app wrote before COUNTRY held the entity name still hold the code
        expect(record2qso(record({ country: "AUS" })).country).toBe("AUS");
        expect(record2qso(record({ country: "Freedonia" })).country).toBe("Freedonia");
    });

    test("leaves a QSL flag unset when the file doesn't carry the tag", () => {
        expect(record2qso(record({})).lotw_sent).toBeUndefined();
        expect(record2qso(record({ lotw_qsl_sent: "N" })).lotw_sent).toBe(false);
        expect(record2qso(record({ lotw_qsl_sent: "Y" })).lotw_sent).toBe(true);
    });

    test("falls back to OPERATOR when STATION_CALLSIGN is missing", () => {
        expect(record2qso(record({ operator: "G4ABC" })).myCallsign).toBe("G4ABC");
        expect(record2qso(record({ station_callsign: "G4ABC" })).myCallsign).toBe("G4ABC");
        expect(record2qso(record({ station_callsign: "G4ABC", operator: "G4XYZ" })).myCallsign).toBe("G4ABC");
    });

    test("reads the BAND field whatever case it is written in", () => {
        expect(record2qso(record({ band: "20M" })).band).toBe("20m");
        expect(record2qso(record({ band: "20m" })).band).toBe("20m");
        expect(record2qso(record({ band: " 70CM " })).band).toBe("70cm");
    });

    test("derives the band from the frequency when BAND is missing or unknown", () => {
        expect(record2qso(record({ freq: "14.2" })).band).toBe("20m");
        expect(record2qso(record({ band: "nonsense", freq: "7.1" })).band).toBe("40m");
    });

    test("prefers the BAND field over the frequency", () => {
        expect(record2qso(record({ band: "40M", freq: "14.2" })).band).toBe("40m");
    });

    test("normalises the grid squares", () => {
        const q = record2qso(record({ gridsquare: "qg62NL", my_gridsquare: "io91WM" }));
        expect(q.locator).toBe("QG62nl");
        expect(q.myLocator).toBe("IO91wm");
    });

    test("resolves a submode to its parent mode and keeps the original in the honeypot", () => {
        const q = record2qso(record({ mode: "FT4" }));
        expect(q.mode).toBe("MFSK");
        expect(q.honeypot?.submode).toBe("FT4");
    });

    test("does not overwrite a SUBMODE the file already carried", () => {
        const q = record2qso({ ...record({ mode: "USB" }), honeypot: { submode: "LSB" } } as QSORecord);
        expect(q.mode).toBe("SSB");
        expect(q.honeypot?.submode).toBe("LSB");
    });

    test("stashes nothing when MODE is already the parent mode", () => {
        expect(record2qso(record({ mode: "ssb" })).honeypot?.submode).toBeUndefined();
    });

    test("accepts a 4 digit TIME_ON as well as a 6 digit one", () => {
        expect(record2qso(record({ qso_date: "20240101", time_on: "1015" })).date.toFormat("HHmmss")).toBe("101500");
        expect(record2qso(record({ qso_date: "20240101", time_on: "101500" })).date.toFormat("HHmmss")).toBe("101500");
    });

    test("ignores an end time identical to the start time", () => {
        const same = record({ qso_date: "20240101", time_on: "1015", qso_date_off: "20240101", time_off: "1015" });
        expect(record2qso(same).dateOff).toBeUndefined();
        const later = record({ qso_date: "20240101", time_on: "1015", qso_date_off: "20240101", time_off: "1025" });
        expect(record2qso(later).dateOff?.toFormat("HHmmss")).toBe("102500");
    });

    test("gives every imported QSO its own id", () => {
        expect(record2qso(record({ call: "A" })).id).not.toBe(record2qso(record({ call: "A" })).id);
    });
});

// ADIF timestamps are UTC by definition, so they must not be read in whatever zone the app
// happens to run in — near midnight that would put the QSO on the wrong UTC day, which is what
// the POTA day grouping counts. Pinned from a non-UTC zone so the assertion means something.
test("record2qso reads ADIF timestamps as UTC", () => {
    const zone = Settings.defaultZone;
    Settings.defaultZone = "America/New_York";
    try {
        const q = record2qso(
            record({ qso_date: "20240101", time_on: "234500", qso_date_off: "20240102", time_off: "000500" }),
        );
        expect(q.date.toUTC().toFormat("yyyyMMdd HHmmss")).toBe("20240101 234500");
        expect(q.dateOff?.toUTC().toFormat("yyyyMMdd HHmmss")).toBe("20240102 000500");
    } finally {
        Settings.defaultZone = zone;
    }
});

describe("ADIF", () => {
    test("parses a record into its fields", () => {
        const [r] = AdifAPI.parseFile("<CALL:6>VK4ALE <QSO_DATE:8>20240101 <TIME_ON:6>101500 <BAND:3>20m<EOR>");
        expect(r).toMatchObject({ call: "VK4ALE", qso_date: "20240101", time_on: "101500", band: "20m" });
    });

    test("skips the header", () => {
        const records = AdifAPI.parseFile(["Some log", "<PROGRAMID:4>test", "<EOH>", "<CALL:6>VK4ALE<EOR>"].join("\n"));
        expect(records).toHaveLength(1);
        expect(records[0].call).toBe("VK4ALE");
    });

    test("puts unknown fields in the honeypot instead of dropping them", () => {
        const [r] = AdifAPI.parseFile("<CALL:6>VK4ALE <APP_SOMETHING:3>abc<EOR>");
        expect(r.honeypot).toEqual({ app_something: "abc" });
    });

    test("reads several records, however they are laid out", () => {
        expect(AdifAPI.parseFile("<CALL:6>VK4ALE<EOR><CALL:5>G4ABC<EOR>").map((r) => r.call)).toEqual([
            "VK4ALE",
            "G4ABC",
        ]);
        expect(AdifAPI.parseFile("<CALL:6>VK4ALE<EOR>\n<CALL:5>G4ABC<EOR>\n").map((r) => r.call)).toEqual([
            "VK4ALE",
            "G4ABC",
        ]);
    });

    test("reads a record spread over several lines", () => {
        const [r] = AdifAPI.parseFile(["<CALL:6>VK4ALE", "<BAND:3>20m", "<MODE:3>SSB<EOR>"].join("\n"));
        expect(r).toMatchObject({ call: "VK4ALE", band: "20m", mode: "SSB" });
    });

    test("survives CRLF line endings", () => {
        const records = AdifAPI.parseFile("<EOH>\r\n<CALL:6>VK4ALE\r\n<BAND:3>20m<EOR>\r\n");
        expect(records).toHaveLength(1);
        expect(records[0]).toMatchObject({ call: "VK4ALE", band: "20m" });
    });

    test("accepts lower case tags and EOR", () => {
        const [r] = AdifAPI.parseFile("<call:6>VK4ALE<eor>");
        expect(r.call).toBe("VK4ALE");
    });

    test("accepts the optional type indicator", () => {
        const [r] = AdifAPI.parseFile("<CALL:6:S>VK4ALE<EOR>");
        expect(r.call).toBe("VK4ALE");
    });

    test("takes the declared length, so a value can hold spaces", () => {
        const [r] = AdifAPI.parseFile("<COMMENT:11>hello there <CALL:6>VK4ALE<EOR>");
        expect(r.comment).toBe("hello there");
        expect(r.call).toBe("VK4ALE");
    });

    test("decodes escaped characters", () => {
        const [r] = AdifAPI.parseFile("<COMMENT:19>a &lt;b&gt; &amp; c<EOR>");
        expect(r.comment).toBe("a <b> & c");
    });

    test("writes a length counting the escaped value, so it reads back", () => {
        const line = AdifAPI.fromRecord(record({ comment: "a<b" }));
        expect(line).toContain("<COMMENT:6>a&lt;b");
        expect(AdifAPI.parseFile(line)[0].comment).toBe("a<b");
    });

    test("generates a header and one record per QSO", () => {
        const file = AdifAPI.generateFile([qso, { ...qso, callsign: "G4ABC" }], header());
        expect(file).toContain("<EOH>");
        expect(file.match(/<EOR>/g)).toHaveLength(2);
    });

    test("round trips a QSO through a generated file", () => {
        const [r] = AdifAPI.parseFile(AdifAPI.generateFile([qso], header()));
        const back = record2qso(r);
        expect(back).toMatchObject({
            callsign: "VK4ALE",
            myCallsign: "G4ABC",
            band: "20m",
            frequency: 14.2,
            mode: "SSB",
            power: 5,
            rst_sent: "59",
            rst_received: "57",
            locator: "QG62nl",
            myLocator: "IO91wm",
            country: "AUS",
            dxcc: 150,
            cqzone: 30,
            ituzone: 55,
            continent: "OC",
            state: "QLD",
            name: "Jono",
            eqsl_sent: true,
            eqsl_received: false,
            note: "hi <there> & 'quote'",
            myPota: "VK-0001",
            pota: "VK-0002",
            honeypot: { weird_field: "keepme" },
        });
        expect(back.date.toFormat("yyyyMMdd HHmmss")).toBe("20240101 101500");
        expect(back.dateOff?.toFormat("yyyyMMdd HHmmss")).toBe("20240101 102500");
    });

    test("applies the massage function on the way out", () => {
        const file = AdifAPI.generateFile([qso], header(), (r) => ({ ...r, call: "MASSAGED" }));
        expect(file).toContain("<CALL:8>MASSAGED");
    });
});

describe("ADX", () => {
    test("parses a record into its fields", () => {
        const [r] = AdxAPI.parseFile(
            `<ADX><RECORDS><RECORD><CALL>VK4ALE</CALL><BAND>20m</BAND></RECORD></RECORDS></ADX>`,
        );
        expect(r).toMatchObject({ call: "VK4ALE", band: "20m" });
    });

    test("finds records whatever wraps them", () => {
        expect(AdxAPI.parseFile(`<ADX><RECORD><CALL>VK4ALE</CALL></RECORD></ADX>`)).toHaveLength(1);
        expect(
            AdxAPI.parseFile(
                `<ADX><RECORDS><RECORD><CALL>A</CALL></RECORD><RECORD><CALL>B</CALL></RECORD></RECORDS></ADX>`,
            ),
        ).toHaveLength(2);
    });

    test("keeps values as strings, so a date stays a date", () => {
        const [r] = AdxAPI.parseFile(`<ADX><RECORD><QSO_DATE>20240101</QSO_DATE></RECORD></ADX>`);
        expect(r.qso_date).toBe("20240101");
    });

    test("puts unknown fields in the honeypot", () => {
        const [r] = AdxAPI.parseFile(`<ADX><RECORD><CALL>A</CALL><APP_X>y</APP_X></RECORD></ADX>`);
        expect(r.honeypot).toEqual({ app_x: "y" });
    });

    test("decodes escaped characters", () => {
        const [r] = AdxAPI.parseFile(`<ADX><RECORD><COMMENT>a &lt;b&gt; &amp; c</COMMENT></RECORD></ADX>`);
        expect(r.comment).toBe("a <b> & c");
    });

    test("does not read the header as a record", () => {
        const records = AdxAPI.parseFile(AdxAPI.generateFile([qso], header()));
        expect(records).toHaveLength(1);
    });

    test("round trips a QSO through a generated file", () => {
        const back = record2qso(AdxAPI.parseFile(AdxAPI.generateFile([qso], header()))[0]);
        expect(back).toMatchObject({
            callsign: "VK4ALE",
            myCallsign: "G4ABC",
            band: "20m",
            frequency: 14.2,
            mode: "SSB",
            note: "hi <there> & 'quote'",
            myPota: "VK-0001",
            honeypot: { weird_field: "keepme" },
        });
        expect(back.date.toFormat("yyyyMMdd HHmmss")).toBe("20240101 101500");
    });

    test("produces the same QSO as the ADIF writer", () => {
        const fromAdif = record2qso(AdifAPI.parseFile(AdifAPI.generateFile([qso], header()))[0]);
        const fromAdx = record2qso(AdxAPI.parseFile(AdxAPI.generateFile([qso], header()))[0]);
        expect({ ...fromAdx, id: "" }).toEqual({ ...fromAdif, id: "" });
    });
});

describe("getFileApiFromFilename", () => {
    test("picks the API from the extension", () => {
        expect(getFileApiFromFilename("log.adif")).toBe(AdifAPI);
        expect(getFileApiFromFilename("log.adi")).toBe(AdifAPI);
        expect(getFileApiFromFilename("log.adi.txt")).toBe(AdifAPI);
        expect(getFileApiFromFilename("log.adx")).toBe(AdxAPI);
    });

    test("throws on an extension it doesn't know", () => {
        expect(() => getFileApiFromFilename("log.csv")).toThrow(/No File API Found/);
    });
});

describe("header", () => {
    test("names the program and stamps a creation time", () => {
        const h = header();
        expect(h.fields?.programid).toBe("down-the-log");
        expect(h.fields?.created_timestamp).toMatch(/^\d{8} \d{6}$/);
    });
});
