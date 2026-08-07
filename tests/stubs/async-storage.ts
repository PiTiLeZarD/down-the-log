// @react-native-async-storage/async-storage resolves to its native module at import time and has
// nothing to bind to under node. Same deal as the SecureStore stub: a Map, so the zustand persist
// middleware behaves. Aliased in vitest.config.ts.
const store = new Map<string, string>();

const AsyncStorage = {
    getItem: async (key: string) => store.get(key) ?? null,
    setItem: async (key: string, value: string) => void store.set(key, value),
    removeItem: async (key: string) => void store.delete(key),
    clear: async () => store.clear(),
    getAllKeys: async () => [...store.keys()],
};

export default AsyncStorage;
