// Cuts a release: stamps the version everywhere, commits, tags and pushes.
// Pushing the tag is what triggers .github/workflows/release.yml, which builds
// the desktop bundles, drafts the GitHub release and redeploys the demo.
//
// Usage: pnpm tag 1.0.1 [--dry-run]
import { execFileSync } from "node:child_process";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { parseVersion, syncVersion, VERSIONED_FILES } from "./sync-version.mjs";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const RELEASE_BRANCH = "master";

const git = (...args) => execFileSync("git", args, { cwd: root, encoding: "utf8" }).trim();

const fail = (message) => {
    console.error(message);
    process.exit(1);
};

const args = process.argv.slice(2);
const dryRun = args.includes("--dry-run");
let version;
try {
    version = parseVersion(args.find((arg) => !arg.startsWith("--")));
} catch {
    fail("Usage: pnpm tag <version>  (e.g. pnpm tag 1.0.1)");
}

const tag = `v${version}`;

if (git("status", "--porcelain")) fail("Working tree is dirty. Commit or stash first.");

const branch = git("rev-parse", "--abbrev-ref", "HEAD");
if (branch !== RELEASE_BRANCH) fail(`On branch ${branch}, expected ${RELEASE_BRANCH}.`);

git("fetch", "origin", "--tags");
if (git("tag", "--list", tag)) fail(`Tag ${tag} already exists.`);

if (git("rev-list", "--count", `HEAD..origin/${RELEASE_BRANCH}`) !== "0")
    fail(`Local ${RELEASE_BRANCH} is behind origin. Pull first.`);

syncVersion(tag);
console.log(`${VERSIONED_FILES.join(", ")} -> ${version}`);

if (dryRun) {
    console.log(`\nDry run: version files written, nothing committed. Revert with:\n  git checkout -- ${VERSIONED_FILES.join(" ")}`);
    process.exit(0);
}

git("add", ...VERSIONED_FILES);
git("commit", "-m", `chore: release ${tag}`);
git("tag", "-a", tag, "-m", tag);
git("push", "origin", RELEASE_BRANCH);
git("push", "origin", tag);

console.log(`\nPushed ${tag}. Release workflow is building:`);
console.log("  https://github.com/PiTiLeZarD/down-the-log/actions");
console.log("The GitHub release is created as a draft — publish it once the bundles look right.");
