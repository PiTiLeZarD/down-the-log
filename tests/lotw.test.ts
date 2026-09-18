import { beforeEach, describe, expect, test, vi } from "vitest";
import { LotwError, fetchLotwConfirmations, lotwReportUrl, nextQslSince } from "../src/lib/utils/lotw";

vi.mock("axios", () => ({ default: { get: vi.fn() } }));
const axios = (await import("axios")).default as unknown as { get: ReturnType<typeof vi.fn> };

const credentials = { user: "vk4ale", password: "hunter2", since: "2024-04-27" };
// Whatever LoTW is asked, a real report ends with this marker.
const report = "<PROGRAMID:4>LoTW\n<eoh>\n<call:6>VK4ABC\n<eor>\n<APP_LoTW_EOF>\n";

const answers = (data: string) => axios.get.mockResolvedValueOnce({ data });

beforeEach(() => axios.get.mockReset());

describe("lotwReportUrl", () => {
    test("asks for confirmations only", () => {
        const url = lotwReportUrl(credentials);
        expect(url).toContain("qso_query=1");
        expect(url).toContain("qso_qsl=yes");
        expect(url).toContain("qso_qslsince=2024-04-27");
    });

    test("carries the credentials", () => {
        const url = lotwReportUrl(credentials);
        expect(url).toContain("login=vk4ale");
        expect(url).toContain("password=hunter2");
    });

    test("escapes them, so a password with punctuation survives the query string", () =>
        expect(lotwReportUrl({ ...credentials, password: "a&b=c d" })).toContain("password=a%26b%3Dc%20d"));

    test("narrows to one callsign when there is one", () =>
        expect(lotwReportUrl({ ...credentials, callsign: "VK4ALE/P" })).toContain("qso_owncall=VK4ALE%2FP"));

    test("asks for every callsign on the account when there isn't", () =>
        expect(lotwReportUrl(credentials)).not.toContain("qso_owncall"));
});

describe("fetchLotwConfirmations", () => {
    test("hands back the report body", async () => {
        answers(report);
        await expect(
            fetchLotwConfirmations(credentials),
        ).resolves.toBe(report);
    });

    // Platform.OS is "web" under test — the browser and Tauri case, where CORS applies.
    test("goes through the relay", async () => {
        answers(report);
        await fetchLotwConfirmations(credentials);
        expect(axios.get.mock.calls[0][0]).toMatch(/^https:\/\/cors\.jadami\.com\/\?url=https%3A%2F%2Flotw\.arrl\.org%2F/);
    });

    test("reads a refusal as an auth failure", async () => {
        answers("<html>Username/password incorrect</html>");
        await expect(
            fetchLotwConfirmations(credentials),
        ).rejects.toMatchObject({ status: "auth" });
    });

    // The marker is what tells a report from anything else. A body with no records parses to an
    // empty log, which would otherwise be imported as a perfectly successful zero confirmations.
    test("rejects a body that isn't a report at all", async () => {
        answers("<html>Scheduled maintenance</html>");
        await expect(
            fetchLotwConfirmations(credentials),
        ).rejects.toMatchObject({ status: "error" });
    });

    test("reports a dead connection as offline", async () => {
        axios.get.mockRejectedValueOnce(new Error("ETIMEDOUT"));
        await expect(
            fetchLotwConfirmations(credentials),
        ).rejects.toBeInstanceOf(LotwError);
    });

    test("keeps the credentials out of the thrown message", async () => {
        axios.get.mockRejectedValueOnce(new Error("ETIMEDOUT"));
        const error = await fetchLotwConfirmations(credentials).then(
            () => new Error("expected a rejection"),
            (e: Error) => e,
        );
        expect(error.message).not.toContain("hunter2");
    });
});

describe("nextQslSince", () => {
    // A day of slack: LoTW timestamps a match in its own time, and a same-day boundary drops one.
    test("stops a day short of now", () => {
        const since = nextQslSince();
        expect(since).toMatch(/^\d{4}-\d{2}-\d{2}$/);
        expect(new Date(since).getTime()).toBeLessThan(Date.now());
    });
});
