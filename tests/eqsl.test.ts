import { DateTime } from "luxon";
import { beforeEach, describe, expect, test, vi } from "vitest";
import type { QSO } from "../src/lib/components/qso";
import {
    EqslError,
    UPLOAD_CHUNK,
    eqslInboxUrl,
    eqslUploadAdif,
    fetchEqslConfirmations,
    nextRcvdSince,
    parseUploadResult,
    uploadToEqsl,
} from "../src/lib/utils/eqsl";

vi.mock("axios", () => ({ default: { get: vi.fn(), post: vi.fn() } }));
const axios = (await import("axios")).default as unknown as {
    get: ReturnType<typeof vi.fn>;
    post: ReturnType<typeof vi.fn>;
};

const credentials = { user: "vk4ale", password: "hunter2" };
const inboxPage =
    '<html>Your ADIF log file has been built. <A HREF="../downloadedfiles/abc123.adi">.ADI file</A></html>';
const inboxFile = "eQSL.cc DownloadInBox\n<PROGRAMID:4>eQSL<EOH>\n<CALL:6>VK4ABC<APP_EQSL_AG:1>Y<EOR>\n";

const answers = (data: string) => axios.get.mockResolvedValueOnce({ data });
const uploadAnswers = (data: string) => axios.post.mockResolvedValueOnce({ data });

const qso = (i: number): QSO =>
    ({
        id: `q${i}`,
        callsign: "VK4ABC",
        date: DateTime.utc(2024, 1, 1, 0, i % 60),
        band: "20m",
        mode: "SSB",
    }) as unknown as QSO;

beforeEach(() => {
    axios.get.mockReset();
    axios.post.mockReset();
});

describe("eqslInboxUrl", () => {
    test("carries the credentials and the window", () => {
        const url = eqslInboxUrl({ ...credentials, since: "20240427" });
        expect(url).toContain("UserName=vk4ale");
        expect(url).toContain("Password=hunter2");
        expect(url).toContain("RcvdSince=20240427");
    });

    test("escapes them, so a password with punctuation survives the query string", () =>
        expect(eqslInboxUrl({ ...credentials, password: "a&b=c d", since: "20240427" })).toContain(
            "Password=a%26b%3Dc%20d",
        ));

    test("names the QTH only when there is one", () => {
        expect(eqslInboxUrl({ ...credentials, since: "20240427" })).not.toContain("QTHNickname");
        expect(eqslInboxUrl({ ...credentials, qthNickname: "Home", since: "20240427" })).toContain("QTHNickname=Home");
    });
});

describe("fetchEqslConfirmations", () => {
    const params = { ...credentials, since: "20240427" };

    test("follows the page's link to the file", async () => {
        answers(inboxPage);
        answers(inboxFile);
        await expect(fetchEqslConfirmations(params)).resolves.toBe(inboxFile);
        expect(decodeURIComponent(axios.get.mock.calls[1][0])).toContain(
            "https://www.eqsl.cc/downloadedfiles/abc123.adi",
        );
    });

    // Platform.OS is "web" under test — the browser and Tauri case, where CORS applies.
    test("goes through the relay", async () => {
        answers(inboxPage);
        answers(inboxFile);
        await fetchEqslConfirmations(params);
        expect(axios.get.mock.calls[0][0]).toMatch(
            /^https:\/\/cors\.jadami\.com\/\?url=https%3A%2F%2Fwww\.eqsl\.cc%2F/,
        );
    });

    test("reads an empty inbox as nothing new", async () => {
        answers("<html>You have no log entries</html>");
        await expect(fetchEqslConfirmations(params)).resolves.toBe("");
    });

    test("reads a refusal as an auth failure", async () => {
        answers("<html>Error: No such Username/Password found</html>");
        await expect(fetchEqslConfirmations(params)).rejects.toMatchObject({ status: "auth" });
    });

    test("rejects a linked file that isn't ADIF", async () => {
        answers(inboxPage);
        answers("<html>Not found</html>");
        await expect(fetchEqslConfirmations(params)).rejects.toMatchObject({ status: "error" });
    });

    test("keeps the credentials out of the thrown message", async () => {
        axios.get.mockRejectedValueOnce(new Error("ETIMEDOUT"));
        const error = await fetchEqslConfirmations(params).then(
            () => new Error("expected a rejection"),
            (e: Error) => e,
        );
        expect(error).toBeInstanceOf(EqslError);
        expect(error.message).not.toContain("hunter2");
    });
});

describe("eqslUploadAdif", () => {
    test("puts the login in the header", () => {
        const adif = eqslUploadAdif([qso(0)], { ...credentials, qthNickname: "Home" });
        const head = adif.slice(0, adif.toUpperCase().indexOf("<EOH>"));
        expect(head).toMatch(/<eqsl_user:6>vk4ale/i);
        expect(head).toMatch(/<eqsl_pswd:7>hunter2/i);
        expect(head).toMatch(/<app_eqsl_qth_nickname:4>Home/i);
    });
});

describe("parseUploadResult", () => {
    test("counts duplicates as accepted", () =>
        expect(
            parseUploadResult(
                "Result: 1 out of 2 records added<BR>Warning: Y=2024 M=1 D=1 VK4ABC 20M SSB Bad record: Duplicate<BR>",
            ),
        ).toMatchObject({ accepted: 2, added: 1, duplicates: 1, problems: [] }));

    test("keeps eQSL's words for anything else", () =>
        expect(parseUploadResult("Result: 0 out of 1 records added<BR>Error: Bad band<BR>").problems).toEqual([
            "Error: Bad band",
        ]));

    test("drops the unregistered-logger caution", () =>
        expect(
            parseUploadResult("Result: 5 out of 5 records added<BR>Caution: ProgramID or Logger not found<BR>")
                .problems,
        ).toEqual([]));

    test("reads a refusal as an auth failure", () =>
        expect(() => parseUploadResult("Error: No match on eQSL_User/eQSL_Pswd")).toThrow(
            expect.objectContaining({ status: "auth" }),
        ));
});

describe("uploadToEqsl", () => {
    test("sends the login in the body, not the URL", async () => {
        uploadAnswers("Result: 1 out of 1 records added");
        await uploadToEqsl([qso(0)], credentials);
        expect(axios.post.mock.calls[0][0]).not.toContain("hunter2");
        expect(decodeURIComponent(axios.post.mock.calls[0][1])).toContain("hunter2");
    });

    test("batches, and holds back only the batch eQSL didn't fully take", async () => {
        const qsos = Array.from({ length: UPLOAD_CHUNK + 1 }, (_, i) => qso(i));
        uploadAnswers(`Result: ${UPLOAD_CHUNK} out of ${UPLOAD_CHUNK} records added`);
        uploadAnswers("Result: 0 out of 1 records added<BR>Error: Bad band<BR>");
        const landed: QSO[][] = [];
        const result = await uploadToEqsl(qsos, credentials, (sent) => landed.push(sent));
        expect(axios.post).toHaveBeenCalledTimes(2);
        expect(result.sent).toHaveLength(UPLOAD_CHUNK);
        expect(result.held).toBe(1);
        expect(landed).toHaveLength(1);
    });

    test("keeps what landed before a failure", async () => {
        const qsos = Array.from({ length: UPLOAD_CHUNK + 1 }, (_, i) => qso(i));
        uploadAnswers(`Result: ${UPLOAD_CHUNK} out of ${UPLOAD_CHUNK} records added`);
        axios.post.mockRejectedValueOnce(new Error("ETIMEDOUT"));
        const landed: QSO[][] = [];
        await expect(uploadToEqsl(qsos, credentials, (sent) => landed.push(sent))).rejects.toMatchObject({
            status: "offline",
        });
        expect(landed[0]).toHaveLength(UPLOAD_CHUNK);
    });
});

describe("nextRcvdSince", () => {
    test("stops a day short of now", () => {
        const since = nextRcvdSince();
        expect(since).toMatch(/^\d{8}$/);
        expect(since < DateTime.utc().toFormat("yyyyMMdd")).toBe(true);
    });
});
