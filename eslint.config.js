const { defineConfig } = require("eslint/config");
const expoConfig = require("eslint-config-expo/flat");

module.exports = defineConfig([
    expoConfig,
    {
        // Build output, the rust side and the generated data blobs aren't ours to lint.
        ignores: ["down-the-log/**", "src-tauri/**", ".expo/**", "src/lib/data/*.json"],
    },
    {
        rules: {
            // Style rules that disagree with how this codebase is already written everywhere.
            // Turned off rather than left as noise, so a real warning is worth reading.
            eqeqeq: "off",
            "@typescript-eslint/array-type": "off",
            "react/no-unescaped-entities": "off", // apostrophes in copy are fine
            "react/display-name": "off",

            // The point of the linter here: these caught real bugs at review time. The backlog they
            // used to warn about is cleared, so anything new is a regression and fails the build.
            "react-hooks/rules-of-hooks": "error",
            "react-hooks/exhaustive-deps": "error",

            // React Compiler era rules from react-hooks v7.
            "react-hooks/set-state-in-effect": "error",
            "react-hooks/refs": "error",
            "react-hooks/incompatible-library": "error",

            // Statements that look like calls but aren't — a dropped `()` on console.groupEnd was one.
            "no-unused-expressions": "error",
            "import/no-named-as-default-member": "error",
        },
    },
    {
        // The plugin behind this one is only registered for TypeScript files upstream, so the
        // override has to be scoped the same way.
        files: ["**/*.ts", "**/*.tsx"],
        rules: {
            "@typescript-eslint/no-unused-vars": "error",
        },
    },
]);
