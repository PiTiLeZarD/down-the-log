import { create } from "zustand";

/**
 * A request to put the cursor back in the callsign box, raised from screens that have no handle on
 * it. A counter rather than a boolean: two requests in a row must both land, and there's nothing to
 * reset afterwards.
 */
export const useCallsignFocus = create<{ requested: number; request: () => void }>((set, get) => ({
    requested: 0,
    request: () => set({ requested: get().requested + 1 }),
}));
