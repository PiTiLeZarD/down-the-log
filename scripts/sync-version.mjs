// Writes a release version into every file that carries one, so bundle
// filenames match the git tag instead of a stale hardcoded version.
// Usage: node scripts/sync-version.mjs v1.0.1
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

export const parseVersion = (tag) => {
    const version = (tag ?? "").replace(/^v/, "");
    if (!/^\d+\.\d+\.\d+$/.test(version)) throw new Error(`Expected a semver tag, got: ${tag}`);
    return version;
};

const patch = (relativePath, apply) => {
    const path = join(root, relativePath);
    const source = readFileSync(path, "utf8");
    // Keep whatever indentation the file already uses so the diff stays to one line.
    const indent = source.match(/\n([ \t]+)"/)?.[1] ?? 4;
    const json = JSON.parse(source);
    apply(json);
    writeFileSync(path, `${JSON.stringify(json, null, indent)}\n`);
};

// Non-JSON files: swap the version in place so the rest of the file is untouched.
const patchSource = (relativePath, pattern, replacement) => {
    const path = join(root, relativePath);
    const source = readFileSync(path, "utf8");
    if (!pattern.test(source)) throw new Error(`No version to patch in ${relativePath}`);
    writeFileSync(path, source.replace(pattern, replacement));
};

export const VERSIONED_FILES = [
    "package.json",
    "app.json",
    "src-tauri/tauri.conf.json",
    "src-tauri/Cargo.toml",
    "app/lib/utils/file-format/common.ts",
];

export const syncVersion = (tag) => {
    const version = parseVersion(tag);

    patch("package.json", (json) => (json.version = version));
    patch("app.json", (json) => (json.expo.version = version));
    patch("src-tauri/tauri.conf.json", (json) => (json.version = version));

    patchSource("src-tauri/Cargo.toml", /^version = ".*"$/m, `version = "${version}"`);
    // ADIF header advertises the exporting program's version to whoever reads the file.
    patchSource("app/lib/utils/file-format/common.ts", /^(\s*programversion: )".*",$/m, `$1"${version}",`);

    return version;
};

if (process.argv[1] === fileURLToPath(import.meta.url)) {
    try {
        const version = syncVersion(process.argv[2]);
        for (const file of VERSIONED_FILES) console.log(`${file} -> ${version}`);
    } catch (error) {
        console.error(error.message);
        process.exit(1);
    }
}
