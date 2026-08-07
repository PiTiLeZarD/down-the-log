// Injects the PWA head tags and the service worker registration into the exported index.html.
//
// This has to be a post-build step: expo-router's `+html.tsx` hook only runs for `output: "static"`,
// and app.json pins `output: "single"`, so the exported index.html comes straight from Expo's own
// template with no way to add tags to it.
//
// Run automatically by `pnpm build:web`. Idempotent — re-running replaces the injected block.
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const outDir = join(root, "down-the-log");
const indexHtml = join(outDir, "index.html");
const serviceWorker = join(outDir, "sw.js");

// Mirrors app.config.js: the gh-pages sub-path prefix is dropped for the Tauri bundle, and every
// PWA asset has to be addressed through the same base or it resolves against the wrong root.
const baseUrl = process.env.TAURI_BUILD ? "" : "/down-the-log";
const asset = (path) => `${baseUrl}/${path}`;

// Tauri serves the bundle over its own protocol, where a service worker buys nothing and only
// makes assets go stale behind the app's own updater. Registration is web-only.
const isTauri = !!process.env.TAURI_BUILD;

const START = "<!-- pwa:start -->";
const END = "<!-- pwa:end -->";

const registration = `
    <script>
        if ("serviceWorker" in navigator && (location.protocol === "https:" || location.hostname === "localhost")) {
            window.addEventListener("load", function () {
                navigator.serviceWorker.register("${asset("sw.js")}", { scope: "${baseUrl || "/"}/" }).catch(function () {});
            });
        }
    </script>`;

const block = `${START}
    <link rel="manifest" href="${asset("manifest.json")}" />
    <link rel="apple-touch-icon" href="${asset("icons/apple-touch-icon.png")}" />
    <meta name="apple-mobile-web-app-capable" content="yes" />
    <meta name="apple-mobile-web-app-status-bar-style" content="default" />
    <meta name="apple-mobile-web-app-title" content="DownTheLog" />
    <meta name="mobile-web-app-capable" content="yes" />
    <meta name="application-name" content="DownTheLog" />
    <!-- Matches the light/dark backgrounds in app/lib/ui/colours.json (gray 100 / gray 900). -->
    <meta name="theme-color" media="(prefers-color-scheme: light)" content="#f7fafc" />
    <meta name="theme-color" media="(prefers-color-scheme: dark)" content="#1a202c" />${isTauri ? "" : registration}
    ${END}`;

let html = readFileSync(indexHtml, "utf8");

const existing = new RegExp(`${START}[\\s\\S]*?${END}\\s*`);
html = html.replace(existing, "");

if (!html.includes("</head>")) {
    console.error(`No </head> in ${indexHtml} — did the Expo export template change?`);
    process.exit(1);
}

html = html.replace("</head>", `${block}\n</head>`);
writeFileSync(indexHtml, html);

// Stamp the release version into the cache name so each release starts from a clean cache — and so
// sw.js changes bytes on release, which is what makes the browser pick the new worker up at all.
const { version } = JSON.parse(readFileSync(join(root, "package.json"), "utf8"));
const sw = readFileSync(serviceWorker, "utf8");
writeFileSync(serviceWorker, sw.replace("__CACHE_VERSION__", `v${version}`));

console.log(`PWA tags injected into index.html (base "${baseUrl || "/"}"${isTauri ? ", service worker skipped for Tauri" : ""})`);
