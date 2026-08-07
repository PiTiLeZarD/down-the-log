import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

const stub = (name: string) => fileURLToPath(new URL(`./tests/stubs/${name}.ts`, import.meta.url));

// Tests live outside `src/app/` on purpose: expo-router turns every file under `src/app/` into a route.
export default defineConfig({
    test: {
        include: ["tests/**/*.test.ts"],
        environment: "node",
    },
    // Metro injects this; expo-modules-core reads it at import time and throws without it.
    define: { __DEV__: "true" },
    resolve: {
        // Nothing under test renders, but the modules being tested sit downstream of the store,
        // which reaches the component tree and from there into the native packages. Those ship Flow
        // (`import typeof` in react-native's entry point) and native bindings that rollup can't
        // parse, so they are swapped for stubs. Anchored regexps, not bare strings: a string `find`
        // matches on prefix and would swallow react-native-uuid and friends too.
        alias: [
            { find: /^react-native$/, replacement: stub("react-native") },
            { find: /^expo-secure-store$/, replacement: stub("expo-secure-store") },
            { find: /^@react-native-async-storage\/async-storage$/, replacement: stub("async-storage") },
        ],
    },
});
