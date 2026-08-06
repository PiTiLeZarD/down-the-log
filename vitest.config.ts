import { defineConfig } from "vitest/config";

// Tests live outside `app/` on purpose: expo-router turns every file under `app/` into a route.
export default defineConfig({
    test: {
        include: ["tests/**/*.test.ts"],
        environment: "node",
    },
});
