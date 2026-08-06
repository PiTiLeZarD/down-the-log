import { useStore } from "./store";

// A plain slice of the store: `fixSettings` runs once in the persist `merge`, so the reference is
// stable between renders and consumers can memo on it.
export const useSettings = () => useStore((state) => state.settings);
