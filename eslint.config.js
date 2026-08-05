const { defineConfig } = require("eslint/config");
const expoConfig = require("eslint-config-expo/flat");

module.exports = defineConfig([
    expoConfig,
    {
        // Build output, the rust side and the generated data blobs aren't ours to lint.
        ignores: ["down-the-log/**", "src-tauri/**", ".expo/**", "app/lib/data/*.json"],
    },
    {
        rules: {
            // Style rules that disagree with how this codebase is already written everywhere.
            // Turned off rather than left as noise, so a real warning is worth reading.
            eqeqeq: "off",
            "@typescript-eslint/array-type": "off",
            "@typescript-eslint/no-empty-object-type": "off", // the `export type XProps = {}` convention
            "react/no-unescaped-entities": "off", // apostrophes in copy are fine
            "react/display-name": "off",

            // The point of the linter here: these caught real bugs at review time.
            "react-hooks/rules-of-hooks": "error",
            "react-hooks/exhaustive-deps": "warn",

            // React Compiler era rules from react-hooks v7. They flag genuine issues in this
            // codebase (see the lint backlog in TODO.md) but there are too many to block CI on
            // today — warn until they're worked through, then promote to error.
            "react-hooks/set-state-in-effect": "warn",
            "react-hooks/refs": "warn",
            "react-hooks/incompatible-library": "warn",
        },
    },
]);
