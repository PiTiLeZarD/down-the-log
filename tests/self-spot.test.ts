import { beforeEach, describe, expect, test, vi } from "vitest";
import { POTA_SPOT_POST_API, SpotRequest, postSpot } from "../src/lib/utils/spots/self-spot";
import type { Settings } from "../src/lib/utils/store";

vi.mock("axios", () => ({ default: { post: vi.fn() } }));
const axios = (await import("axios")).default as unknown as { post: ReturnType<typeof vi.fn> };

const settings = { pnpUserId: "op", pnpApiKey: "key" } as Settings;
const request = (programme: SpotRequest["programme"], reference = "AU-0001"): SpotRequest => ({
    callsign: "VK2XYZ",
    spotter: "VK2XYZ",
    programme,
    reference,
    frequency: 14.244,
    mode: "SSB",
    comments: "",
});
const urls = () => axios.post.mock.calls.map(([url]) => url as string);

describe("postSpot", () => {
    beforeEach(() => axios.post.mockReset());

    test("a POTA reference POTA refuses never reaches ParksnPeaks", async () => {
        axios.post.mockResolvedValueOnce({ status: 400, data: "Invalid park" });
        const results = await postSpot(["pota", "pnp"], request("pota"), settings);
        expect(urls()).toEqual([POTA_SPOT_POST_API]);
        expect(results.map((r) => r.ok)).toEqual([false, false]);
    });

    test("a POTA reference POTA accepts goes on to ParksnPeaks", async () => {
        axios.post.mockResolvedValue({ status: 200, data: { success: true } });
        const results = await postSpot(["pota", "pnp"], request("pota"), settings);
        expect(urls()).toHaveLength(2);
        expect(results.every((r) => r.ok)).toBe(true);
    });

    test("a QRP spot goes to ParksnPeaks with its position as the reference, and POTA says no without being asked", async () => {
        axios.post.mockResolvedValue({ status: 200, data: { success: true } });
        const results = await postSpot(["pota", "pnp"], request("qrp", "QF56"), settings);
        expect(axios.post).toHaveBeenCalledOnce();
        expect(Object.fromEntries(new URLSearchParams(axios.post.mock.calls[0][1]))).toMatchObject({
            reference: "QF56",
            frequency: "14244",
            userID: "op",
            APIKey: "key",
        });
        expect(results.find((r) => r.target === "pnp")?.ok).toBe(true);
        expect(results.find((r) => r.target === "pota")?.ok).toBe(false);
    });

    test("a ParksnPeaks 200 with success false is a failure", async () => {
        axios.post.mockResolvedValue({ status: 200, data: { success: false, message: "Authentication failed!" } });
        const [result] = await postSpot(["pnp"], request("wwff", "VKFF-0001"), settings);
        expect(result).toMatchObject({ ok: false, error: "Authentication failed!" });
    });
});
