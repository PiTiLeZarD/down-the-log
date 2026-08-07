// Real expo-secure-store pulls expo-modules-core, which reads Metro globals (`__DEV__`, the `expo`
// JSI object) at import time and throws outside a native runtime. Backed by a Map so a test that
// does exercise the persist layer sees consistent reads and writes. Aliased in vitest.config.ts.
const store = new Map<string, string>();

export const getItemAsync = async (key: string) => store.get(key) ?? null;
export const setItemAsync = async (key: string, value: string) => void store.set(key, value);
export const deleteItemAsync = async (key: string) => void store.delete(key);
export const isAvailableAsync = async () => true;
