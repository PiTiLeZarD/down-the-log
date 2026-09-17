import { describe, expect, test } from "vitest";
import { band2freq, freq2band, modeBandMap } from "../src/lib/data/bands";
import { adifMode, isDigital, liftSubmode, resolveMode } from "../src/lib/data/modes";

describe("modes", () => {
    test("resolves the submodes we pick, whatever the case", () => {
        expect(resolveMode("js8")).toBe("JS8");
        expect(resolveMode("FT4")).toBe("FT4");
        expect(resolveMode("FST4W")).toBe("FST4");
        expect(resolveMode("FreeDV")).toBe("FREEDV");
    });

    test("maps a picked submode to its ADIF parent", () => {
        expect(adifMode("JS8")).toEqual({ mode: "MFSK", submode: "JS8" });
        expect(adifMode("FREEDV")).toEqual({ mode: "DIGITALVOICE", submode: "FREEDV" });
        expect(adifMode("SSB")).toEqual({ mode: "SSB" });
    });

    test("lifts a stashed submode only under its own parent", () => {
        expect(liftSubmode({ mode: "MFSK", honeypot: { submode: "FT4", x: "1" } })).toEqual({
            mode: "FT4",
            honeypot: { x: "1" },
        });
        const psk = { mode: "PSK" as const, honeypot: { submode: "FT4" } };
        expect(liftSubmode(psk)).toBe(psk);
        const mfsk16 = { mode: "MFSK" as const, honeypot: { submode: "MFSK16" } };
        expect(liftSubmode(mfsk16)).toBe(mfsk16);
    });

    test("counts the weak signal submodes as digital", () => {
        expect(["FT4", "JS8", "FST4", "Q65"].every((m) => isDigital(m as any))).toBe(true);
    });
});

describe("modeBandMap", () => {
    test("every frequency sits in the band it is filed under", () => {
        Object.values(modeBandMap).forEach((bands) =>
            Object.entries(bands!).forEach(([band, freq]) => expect(freq2band(freq)).toBe(band)),
        );
    });

    test("band2freq lands on the mode's watering hole", () => {
        expect(band2freq("20m", "JS8")).toBe(14.078);
        expect(band2freq("40m", "FT4")).toBe(7.0475);
        expect(band2freq("20m", "SSB")).toBe(14.175);
    });
});
