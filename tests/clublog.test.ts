import { DateTime } from "luxon";
import { beforeEach, describe, expect, test, vi } from "vitest";
import type { QSO } from "../src/lib/components/qso";
import {
    ClublogError,
    groupByLog,
    multipartBody,
    parseUploadResponse,
    uploadToClublog,
} from "../src/lib/utils/clublog";

vi.mock("axios", () => ({ default: { post: vi.fn() } }));
const axios = (await import("axios")).default as unknown as { post: ReturnType<typeof vi.fn> };

const settings = { email: "op@example.com", password: "hunter2" };
const answers = (status: number, data = "") => axios.post.mockResolvedValueOnce({ status, data });

const qso = (i: number, myCallsign?: string): QSO =>
    ({
        id: `q${i}`,
        callsign: "VK4ABC",
        myCallsign,
        date: DateTime.utc(2024, 1, 1, 0, i % 60),
        band: "20m",
        mode: "SSB",
    }) as unknown as QSO;

beforeEach(() => axios.post.mockReset());

describe("multipartBody", () => {
    test("writes each field and the file between boundaries, closed by the final one", () => {
        const body = multipartBody({ email: "a@b" }, { field: "file", name: "log.adi", content: "<EOH>" }, "XYZ");
        expect(body).toContain('--XYZ\r\nContent-Disposition: form-data; name="email"\r\n\r\na@b\r\n');
        expect(body).toContain('name="file"; filename="log.adi"');
        expect(body).toContain("\r\n\r\n<EOH>\r\n");
        expect(body.endsWith("--XYZ--\r\n")).toBe(true);
    });
});

describe("parseUploadResponse", () => {
    test("200 is taken", () => expect(() => parseUploadResponse(200, "OK")).not.toThrow());

    test("403 is a refused login", () => {
        try {
            parseUploadResponse(403, "Login rejected: invalid password");
            expect.unreachable();
        } catch (e) {
            expect(e).toBeInstanceOf(ClublogError);
            expect((e as ClublogError).status).toBe("auth");
        }
    });

    test("403 about the key says so, since the operator can't fix it", () =>
        expect(() => parseUploadResponse(403, "Invalid API key")).toThrow(/API key/));

    test("anything else is shown as Club Log put it, tags stripped", () =>
        expect(() => parseUploadResponse(400, "<b>Callsign not on this account</b>")).toThrow(
            /^Callsign not on this account$/,
        ));
});

describe("groupByLog", () => {
    test("files each QSO under the callsign it was made with, uppercased", () => {
        const groups = groupByLog([qso(1, "vk4ale"), qso(2, "VK4ALE/P"), qso(3, "VK4ALE")]);
        expect([...groups.keys()]).toEqual(["VK4ALE", "VK4ALE/P"]);
        expect(groups.get("VK4ALE")?.map((q) => q.id)).toEqual(["q1", "q3"]);
    });

    test("the account's chosen callsign takes everything", () =>
        expect([...groupByLog([qso(1, "VK4ALE"), qso(2, "VK4ALE/P")], "vk4ale").keys()]).toEqual(["VK4ALE"]));

    test("a QSO with no callsign at all is left out", () => expect(groupByLog([qso(1)]).size).toBe(0));
});

describe("uploadToClublog", () => {
    test("sends one request per log with the login, callsign and key, and hands each back as sent", async () => {
        answers(200, "OK");
        answers(200, "OK");
        const onLog = vi.fn();
        const result = await uploadToClublog([qso(1, "VK4ALE"), qso(2, "VK4ALE/P")], settings, onLog, "KEY");

        expect(axios.post).toHaveBeenCalledTimes(2);
        const [, body, config] = axios.post.mock.calls[0];
        expect(body).toContain("op@example.com");
        expect(body).toContain('name="callsign"\r\n\r\nVK4ALE\r\n');
        expect(body).toContain('name="api"\r\n\r\nKEY\r\n');
        expect(body).not.toContain('name="clear"');
        expect(config.headers["content-type"]).toMatch(/^multipart\/form-data; boundary=/);
        expect(onLog).toHaveBeenCalledTimes(2);
        expect(result.sent.map((q) => q.id)).toEqual(["q1", "q2"]);
        expect(result.problems).toEqual([]);
    });

    test("a refused log keeps its QSOs back and the others carry on", async () => {
        answers(400, "Callsign not on this account");
        answers(200, "OK");
        const result = await uploadToClublog([qso(1, "N0CALL"), qso(2, "VK4ALE")], settings, undefined, "KEY");
        expect(result.sent.map((q) => q.id)).toEqual(["q2"]);
        expect(result.problems).toEqual(["N0CALL: Callsign not on this account"]);
    });

    test("a refused login stops at once, so it isn't tried again for the next log", async () => {
        answers(403, "Login rejected");
        await expect(
            uploadToClublog([qso(1, "VK4ALE"), qso(2, "VK4ALE/P")], settings, undefined, "KEY"),
        ).rejects.toMatchObject({ status: "auth" });
        expect(axios.post).toHaveBeenCalledTimes(1);
    });

    test("no answer at all is offline, and stops too", async () => {
        axios.post.mockRejectedValueOnce(new Error("Network Error"));
        await expect(uploadToClublog([qso(1, "VK4ALE")], settings, undefined, "KEY")).rejects.toMatchObject({
            status: "offline",
        });
    });

    test("QSOs with no callsign are counted, not sent", async () => {
        answers(200, "OK");
        const result = await uploadToClublog([qso(1, "VK4ALE"), qso(2)], settings, undefined, "KEY");
        expect(result.unplaced).toBe(1);
        expect(result.sent.map((q) => q.id)).toEqual(["q1"]);
    });
});
