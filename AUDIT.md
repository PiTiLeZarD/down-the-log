# DownTheLog — Code Audit

**Commit:** `096b8a3` (branch `master`, working tree clean)
**Date:** 2026-09-06

---

## 1. Executive Summary

DownTheLog is a local-first amateur radio logbook: Expo Router + React Native Web,
shipped as a PWA, native app and Tauri desktop bundle. There is no backend, no
accounts and no multi-tenancy, so the classic server-side attack surface is
absent. The realistic risk profile is instead **data integrity of the operator's
log** and **robustness of the file import/export paths**, which are the only
places untrusted input enters the system.

Overall posture is good for a solo hobby project and better than typical: 374
tests pass, `tsc --noEmit` and `eslint .` are both clean, CI gates typecheck and
lint on every PR, and the code carries unusually high-quality rationale comments.
The defects found are concentrated in the less-travelled file formats (Cabrillo,
WSJT-X) and in a handful of quadratic helpers that will bite as logs grow — which
the repo's own `random-1m.adif` fixture shows is an explicit goal.

**Top risks:**

1. **A live geocode.maps.co API key sits in the public git history** (committed
   2024-01-17, later removed from HEAD but never rotated). It remains retrievable
   by anyone who clones the repo.
2. **Cabrillo import throws on any line that is not `KEY: value`** — including the
   trailing blank line every Cabrillo file has. The import is effectively broken,
   and the exception is swallowed by an unguarded `FileReader.onload`.
3. **WSJT-X export writes the literal string `Invalid DateTime`** into the
   `time_off` column for every QSO that has no `dateOff` — i.e. almost all of them.
4. **File import failures are silent.** Every parse path throws inside
   `FileReader.onload` with no `try`/`catch`, so a bad file produces no dialog, no
   error and no imported records.
5. **`groupBy` and `unique` are quadratic** and are run over the entire log by the
   Stats, Events and Tiles pages — the exact shape the author already fixed in
   `store.log` and the ADIF parser.

| Severity | Count |
| --- | --- |
| Critical | 0 |
| High | 1 |
| Medium | 9 |
| Low | 10 |
| Informational | 5 |

**Status as of 2026-09-07:** 20 findings fixed (✅), 5 deliberately not actioned
with the reason recorded on each (🚫), 1 still open — **AUD-001**, the leaked
geocode.maps.co key, which needs a rotation nobody but the key's owner can do.

---

## 2. Scope & Methodology

**Audited:** the whole application source (`src/`, ~9k lines TS/TSX), the Rust
Tauri shell (`src-tauri/`), build and data scripts (`scripts/`), the service
worker and manifest (`public/`), CI workflows (`.github/workflows/`), and the
Expo/Tauri/lint/TS configuration. `tests/` was read for coverage assessment.

**Passes run:** structural/architectural, security, correctness & reliability,
quality & maintainability, performance & operations.

**Tools run** (all pre-existing in the repo, nothing installed):

- `pnpm test` — 14 files, 374 tests, all passing (2.7s)
- `pnpm types` (`tsc --noEmit`) — clean
- `pnpm lint` (`eslint .`) — clean
- `git log -S` over full history for credential patterns

**Sampling:** the repo is small enough (236 tracked files) to read in full at the
level that matters. Every file reachable from an untrusted input path (the four
file-format codecs, the dropzone, the network fetchers) was read line by line.
UI-only presentation components were read for structure but not line-audited.

**Not covered:**

- Runtime behaviour. Nothing was executed beyond the test suite; no browser, no
  device, no Tauri bundle was launched. Findings that depend on runtime are marked
  with a confidence level.
- The generated reference data blobs (`src/lib/data/*.json`, ~25 MB) and the
  ~1800-line `callsigns.ts` prefix table were spot-checked for structure, not
  verified for correctness against their upstream sources.
- `src-tauri/target/` build artefacts and `node_modules/`.
- Dependency CVE scanning. `pnpm audit` requires network access and was not run;
  see Appendix A for what can be said statically.
- The three OSM/SVG map modules (`osm-map/`) were reviewed structurally only —
  the projection maths has its own passing test suite (`tests/projection.test.ts`).

---

## 3. Findings Table

| ID | Severity | Category | Location | Title |
| --- | --- | --- | --- | --- |
| AUD-001 ⚠️ | High | Secrets | git history (`cdd84a0`, `00e6dd7`, `fcfa5d8`) | geocode.maps.co API key committed to public history, never rotated |
| AUD-002 ✅ | Medium | Correctness | `src/lib/utils/file-format/cabrillo.ts:10-12` | Cabrillo import throws on any non-`KEY: value` line, including the trailing blank |
| AUD-003 ✅ | Medium | Correctness | `src/lib/utils/file-format/wsjtx.ts:53-54` | WSJT-X export writes `Invalid DateTime` for QSOs without a dateOff |
| AUD-004 ✅ | Medium | Correctness | `src/lib/utils/file-format/wsjtx.ts:66` | WSJT-X import turns blank lines into junk QSO records |
| AUD-005 ✅ | Medium | Error handling | `src/lib/components/adif/import.tsx:31-71`, `src/app/qsl.tsx:37-113` | Every file-import failure is silent — no catch, no feedback |
| AUD-006 ✅ | Medium | Data integrity | `src/app/qsl.tsx:32-36` | QSL export marks QSOs as sent before the download can be shown to have happened |
| AUD-007 ✅ | Medium | Performance | `src/lib/utils/arrays.ts:4-18`, `src/app/stats.tsx:21` | `groupBy` and `unique` are quadratic and run over the whole log |
| AUD-008 ✅ | Medium | Privacy / hygiene | `src/lib/utils/store.ts:141`, `use-auto-save.ts:23`, `qso/qso-list.tsx:120-122` | `[DTL-DEBUG]` console logging of QSO contents left in production code |
| AUD-009 ✅ | Medium | Reliability | `src/lib/utils/file-format/index.ts:9-24` | Export builds the whole file as one `data:` URI in memory |
| AUD-010 ✅ | Medium | Performance | `src/lib/utils/use-auto-save.ts:16-25`, `store.ts:270-285` | Undebounced autosave diffs the entire log on every keystroke |
| AUD-011 ✅ | Low | Injection / errors | `src/lib/utils/geocode.ts:18`, `geocode-button.tsx:16-22` | Geocode query is not URL-encoded and the promise has no rejection handler |
| AUD-012 ✅ | Low | Error handling | `src/lib/utils/use-location.ts:34-48` | Location denial throws into an unhandled promise rejection |
| AUD-013 ✅ | Low | Correctness | `src/app/qso.tsx:25-28` | `navigate()` called during render |
| AUD-014 ✅ | Low | Correctness | `src/lib/components/form/form-fields.tsx:84` | `useQsos()[0].id` assumes a non-empty log |
| AUD-015 🚫 | Low | Interop | `src/lib/utils/file-format/adif.ts:14-17` | ADIF field lengths counted in UTF-16 units, not bytes |
| AUD-016 ✅ | Low | Correctness | `src/lib/utils/file-format/adif.ts:18-33` | ADIF parser assumes each fragment starts at a tag; leading text silently drops the record |
| AUD-017 ✅ | Low | Performance | `src/lib/components/qso/qso-list.tsx:24-31` | Quadratic array rebuild when grouping a day's QSOs |
| AUD-018 ✅ | Low | Data integrity | `src/app/adif.tsx:29-45`, `store.ts:150` | "Erase all QSOs" leaves sessions and filters behind |
| AUD-019 ✅ | Low | Robustness | `src/lib/components/filters.tsx:86-91` | An unknown persisted filter name crashes the log screen |
| AUD-020 ✅ | Low | Performance | `src/lib/utils/use-storage-usage.ts:66-76` | Storage gauge re-walks all storage on every QSO change |
| AUD-021 ✅ | Low | CI / testing | `.github/workflows/ci.yml` | CI never runs the test suite |
| AUD-022 ✅ | Info | Privacy | `src/app/settings.tsx:154-157` | Privacy copy understates what leaves the device |
| AUD-023 🚫 | Info | Secrets | `src/lib/utils/store.ts:196-227` | HamQTH password stored in cleartext on web |
| AUD-024 🚫 | Info | Security headers | `scripts/pwa.mjs`, `src-tauri/tauri.conf.json` | Only the Tauri build ships a CSP; the PWA ships none |
| AUD-025 🚫 | Info | Correctness | `src/lib/utils/file-format/common.ts:285-290` | Exported `programversion` is hardcoded to `0.0.1` |
| AUD-026 🚫 | Info | Interop | `src/lib/utils/file-format/common.ts:83-97` | `sanitize` folds the curly quote `”` into `"` |

---

## 4. Detailed Findings

### AUD-001 — geocode.maps.co API key committed to public history, never rotated

- **Status:** ⚠️ Open — the key is not in the working tree, but it is still in
  history and rotation happens at geocode.maps.co, not in this repo. No code change
  can close this one.
- **Severity:** High
- **Category:** Secrets management
- **Confidence:** High. The key is directly readable from history; only its
  current validity at the provider is unverified.
- **Locations:** introduced in `cdd84a0` (2024-01-17, `src/utils/geocode.ts`),
  also baked into committed web bundles in `00e6dd7` and `fcfa5d8`. Removed from
  HEAD by `7097764`.

**Evidence:**

```
$ git log --all --oneline -S"65a75c71db028165322267qlje2e6e7"
fcfa5d8 Updates
7097764 geocode has limits, I could leave my key but as soon as we're more than 5 using this, it'll be rate limited...
00e6dd7 Updates
cdd84a0 Ability to geocode wth to gridsquare (I just needed this now :D)
```

The key `65a75c71db028165322267qlje2e6e7` appears both in the source of
`src/utils/geocode.ts` at `cdd84a0` and, minified, inside two committed Expo web
bundles.

**Impact:** Anyone who clones this public repository has the maintainer's personal
geocoding credential. Realistic worst case is quota exhaustion and rate-limit
denial of the maintainer's own account — which is why this is rated High rather
than Critical: the key grants no access to user data, only to a free-tier
geocoding endpoint. The removal commit deleted the key from the working tree but
history retains it, and the deploy history on the `ghpages` branch may too.

**Recommendation:** Revoke and reissue the key at geocode.maps.co. Deleting it
from HEAD is not remediation. Rewriting history (`git filter-repo`) is optional and
disruptive for a published repo; rotation is the part that matters. The current
design — the key is an operator-supplied setting — is correct and needs no change.

**Estimated effort:** S

---

### AUD-002 — Cabrillo import throws on any non-`KEY: value` line

- **Status:** ✅ Fixed in `dd8930a`.
- **Severity:** Medium
- **Category:** Correctness / input handling
- **Confidence:** High. Reproduced directly.
- **Locations:** `src/lib/utils/file-format/cabrillo.ts:10-12` (`parseLine`),
  called unguarded from `cabrillo.ts:78-88` (`parseFile`) for every line of the file.

**Evidence:**

```ts
const parseLine = (s: string): { key: string; line: string; values: string[] } => {
    const [, key, line] = s.split(/^([^:]+): (.*)/);
    return { key, line, values: line.split(/\s{1,}/) };
};
```

When the regexp does not match, `split` returns `[s]`, so `line` is `undefined`:

```
$ node -e '...parseLine("")'
blank line THROWS: Cannot read properties of undefined (reading 'split')
$ node -e '...parseLine("HELLO WORLD")'
no colon THROWS: Cannot read properties of undefined (reading 'split')
```

**Impact:** Every Cabrillo file ending in a newline — which is every Cabrillo file
— has a trailing empty line, so `parseFile` throws before returning any records.
Combined with AUD-005 the exception vanishes into the `FileReader.onload`
callback: the user drops a `.cab` file and absolutely nothing happens. The
Cabrillo import path is, as written, non-functional.

**Recommendation:** Return a sentinel from `parseLine` when the regexp does not
match (`{ key: undefined, line: "", values: [] }`) and skip those lines in
`parseFile`. Add a Cabrillo round-trip test whose fixture ends with a newline —
`tests/file-format.test.ts` currently has no such case.

**Estimated effort:** S

---

### AUD-003 — WSJT-X export writes `Invalid DateTime` for QSOs without a dateOff

- **Status:** ✅ Fixed in `9fbca9b`.
- **Severity:** Medium
- **Category:** Correctness / data fidelity
- **Confidence:** High. Reproduced directly.
- **Location:** `src/lib/utils/file-format/wsjtx.ts:53-54`

**Evidence:**

```ts
DateTime.fromFormat((record.qso_date_off || record.qso_date) as string, "yyyyMMdd").toFormat("yyyy-MM-dd"),
DateTime.fromFormat((record.time_off || record.qso_date) as string, "HHmmss").toFormat("HH:mm:ss"),
```

The second line falls back to `qso_date` — a `yyyyMMdd` date — parsed with the
`HHmmss` time format:

```
$ node -e 'console.log(DateTime.fromFormat("20240427","HHmmss").toFormat("HH:mm:ss"))'
Invalid DateTime
```

`qso2record` only emits `time_off` when the QSO has a `dateOff`, which most do
not, so this is the common path, not the edge case.

**Impact:** Every WSJT-X export from an ordinary log has the literal text
`Invalid DateTime` in its fourth column. Downstream consumers of `wsjtx.log`
either reject the file or import garbage timestamps.

**Recommendation:** The fallback should be `record.time_on`, mirroring the
`qso_date_off || qso_date` intent on the line above. Add a test asserting the
exported line for a QSO with no `dateOff`.

**Estimated effort:** S

---

### AUD-004 — WSJT-X import turns blank lines into junk QSO records

- **Status:** ✅ Fixed in `91580e6`.
- **Severity:** Medium
- **Category:** Correctness / input handling
- **Confidence:** High
- **Location:** `src/lib/utils/file-format/wsjtx.ts:66`

**Evidence:**

```ts
parseFile: (fileContent) => fileContent.split("\n").map((l) => WsjtxAPI.toRecord(l)),
```

No filter for empty lines, unlike `AdifAPI.parseFile`, which does
`.filter((record) => record.some((l) => Boolean(l)))`. `toRecord("")` destructures
`[""]`, giving `undefined` for every field but the first, and
`DateTime.fromFormat("", "yyyy-MM-dd")` yields `Invalid DateTime`.

**Impact:** A trailing newline — universal in text files — produces one extra QSO
per import with an invalid date and an empty callsign. `record2qso` does not drop
it, and neither does `import.tsx` (the QSL path does filter on `!!q.callsign`;
the main import path at `import.tsx:38-56` does not). The result is phantom
records in the log with an unsortable date.

**Recommendation:** Filter empty and whitespace-only lines in `parseFile`, and add
a `.filter((q) => !!q.callsign)` guard to the main import path to match the one
already in `qsl.tsx:60`.

**Estimated effort:** S

---

### AUD-005 — Every file-import failure is silent

- **Status:** ✅ Fixed in `5312f59`.
- **Severity:** Medium
- **Category:** Error handling
- **Confidence:** High
- **Locations:** `src/lib/components/adif/import.tsx:31-71`,
  `src/app/qsl.tsx:37-113`

**Evidence:**

```ts
const fr = new FileReader();
fr.onload = () => {
    if (fr.result) {
        ...
        const toImport: QSO[] = getFileApiFromFilename(file.name)
            .parseFile(content)
```

There is no `try`/`catch` anywhere in either handler, and no `fr.onerror`.
`getFileApiFromFilename` throws by design for an unrecognised extension
(`file-format/index.ts:36`), and every `parseFile` can throw on malformed input
(see AUD-002).

**Impact:** Dropping an unsupported or malformed file does nothing at all — no
dialog, no message, no partial import. Since the success path always shows a
"Done!" dialog, the absence of any dialog is the only signal the user gets, and it
is indistinguishable from the drop not registering. This is what makes AUD-002
invisible rather than merely broken.

**Recommendation:** Wrap the body of each `onload` in `try`/`catch` and surface
failures through the existing `showDialog({ icon: "error" })` path, naming the
file. Add `fr.onerror` for read failures. Also note `files.map(...)` at
`import.tsx:32` and `qsl.tsx:38` should be `forEach` — the mapped array is
discarded.

**Estimated effort:** S

---

### AUD-006 — QSL export marks QSOs as sent before the download can be shown to have happened

- **Status:** ✅ Fixed in `4686488`.
- **Severity:** Medium
- **Category:** Data integrity
- **Confidence:** High for the ordering; Medium for the failure trigger, which
  depends on AUD-009's browser behaviour.
- **Location:** `src/app/qsl.tsx:32-36`

**Evidence:**

```ts
const qslQsos = qsos
    .filter((q) => (type === "lotw" ? !q.lotw_sent : !q.eqsl_sent))
    .map((q): QSO => ({ ...q, ...(type === "lotw" ? { lotw_sent: true } : { eqsl_sent: true }) }));
log(qslQsos);
downloadQsos(`${today}_${type}.adif`, qslQsos);
```

`log()` commits the `lotw_sent` / `eqsl_sent` flags to the store unconditionally;
`downloadQsos` runs afterwards and its result is never checked.

**Impact:** If the download fails — the browser blocks it, the `data:` URI exceeds
a limit (AUD-009), the user cancels the save dialog — the QSOs are permanently
flagged as sent and will never appear in a future QSL export. There is no undo and
no per-QSO way to clear the flag from the UI. Silent, irreversible loss of the
"still to upload" set. The in-app `Alert` warns that "QSOs will be altered and
marked as sent", so the alteration is intended; the ordering is not.

**Recommendation:** Generate the file first and only call `log()` once the download
has been handed to the browser. Better, make the marking a separate explicit
action after the operator confirms the upload landed — the TOTA flow already does
exactly this with `markUploaded` (`utils/tota.ts:82-84`), which is the right
pattern to copy.

**Estimated effort:** S

---

### AUD-007 — `groupBy` and `unique` are quadratic and run over the whole log

- **Status:** ✅ Fixed in `293df2b`.
- **Severity:** Medium
- **Category:** Performance
- **Confidence:** High for the complexity; Medium for the user-visible threshold,
  which was not measured on device.
- **Locations:** `src/lib/utils/arrays.ts:4-18`; callers over the full log at
  `src/app/stats.tsx:21` and `:46`, `src/lib/utils/event-rules.ts:19` and `:38`,
  `src/lib/utils/tota.ts:47`, `src/lib/components/filters.tsx:232`,
  `src/app/adif.tsx:21-26`, `src/lib/utils/file-format/cabrillo.ts:100-125`

**Evidence:**

```ts
export const groupBy = <T extends object, K extends string>(...) =>
    a.reduce<Record<K, T[]>>(
        (groups, elt, i, aa) => ({
            ...groups,
            ...((vs) => Object.fromEntries(vs.map((v) => [v, [...(groups[v] || []), elt]])))(...),
        }), {} as Record<K, T[]>);

export const unique: <T>(a: Array<T>) => Array<T> = (a) => a.filter((v, i, aa) => aa.indexOf(v) === i);
```

`groupBy` spreads the entire accumulator object *and* copies the target group's
array on every element. `unique` is an `indexOf` scan per element. `stats.tsx:21`
nests two `groupBy` calls over the whole log:

```ts
Object.entries(groupBy(qsos, filterMap[first])).map(([k, qs]) => [k, groupBy(qs, filterMap[second])]),
```

**Impact:** This is precisely the shape already identified and fixed twice in this
codebase — `store.log`'s `some()` scan and the ADIF parser's `[...records, record]`
accumulator, both with comments saying it "makes a big ADIF look hung". The Stats,
Events and Tiles pages will freeze on the six-figure logs the repo's own
`random-1m.adif` fixture targets. Cabrillo export runs four separate `unique`
passes over every QSO.

**Recommendation:** Rewrite `groupBy` to mutate a `Map`/record accumulator in place
(the same fix already applied in `qsosByCallsign`, `qso/index.ts:329-344`) and
`unique` as a `Set` round trip. Both are pure leaf utilities with no callers that
depend on the copying, so this is a contained change that fans out to every caller.

**Estimated effort:** S

---

### AUD-008 — `[DTL-DEBUG]` console logging of QSO contents left in production code

- **Status:** ✅ Fixed in `29023b3`.
- **Severity:** Medium
- **Category:** Privacy / hygiene
- **Confidence:** High
- **Locations:** `src/lib/utils/store.ts:141`,
  `src/lib/utils/use-auto-save.ts:23`, `src/lib/components/qso/qso-list.tsx:120`
  and `:122`

**Evidence:**

```ts
// store.ts:141
if (!Array.isArray(qso)) console.log("[DTL-DEBUG] store.log", qso.id, "mode=", qso.mode);
// qso-list.tsx:120 — in the render body, not an effect
console.log("[DTL-DEBUG] QsoList render, first qso mode=", qsos[0]?.id, qsos[0]?.mode);
```

**Impact:** These fire on every QSO logged, every autosave keystroke and every log
render in the shipped web build. Beyond the console noise and the per-keystroke
cost, `qso-list.tsx:120` is a side effect in a render body, which React may call
more than once per commit. The repo's own `.gitignore` notes that logs "are
personal data: they carry other operators' callsigns"; writing QSO identifiers to
a console the operator may screenshot or share cuts against that stance, though
only ids and modes are logged, not callsigns.

**Recommendation:** Delete all four. If they are still needed for the mode-drift
bug they were clearly added to chase, gate them behind `__DEV__` and move the
`qso-list.tsx` ones out of the render body.

**Estimated effort:** S

---

### AUD-009 — Export builds the whole file as one `data:` URI in memory

- **Status:** ✅ Fixed in `dc0b820`.
- **Severity:** Medium
- **Category:** Reliability / performance
- **Confidence:** Medium. The memory cost is arithmetic; the exact browser cap at
  which the anchor click fails silently was not measured.
- **Location:** `src/lib/utils/file-format/index.ts:9-24`

**Evidence:**

```ts
Object.assign(document.createElement("a"), {
    href: `data:text/plain,${encodeURIComponent(
        { adif: AdifAPI, ... }[type].generateFile(qsos, header(), massage),
    )}`,
    download: title,
}).click();
```

**Impact:** `generateFile` produces the complete file as a single string, then
`encodeURIComponent` produces a second string up to ~3x larger (every `<`, `>`,
newline and space becomes a percent escape — ADIF is dense in all four). A 50 MB
export, which `random-50k.adif` in this repo shows is a realistic size, means well
over 150 MB of live strings plus the URI held on the DOM node. Large exports will
either fail silently or take the tab down, and there is no error path: the click
is fire-and-forget, which is what makes AUD-006's data loss possible.

**Recommendation:** Switch to `new Blob([content], { type: "text/plain" })` with
`URL.createObjectURL`, revoking the URL after the click. This removes the encoding
copy entirely and lifts the size ceiling to the Blob quota.

**Estimated effort:** S

---

### AUD-010 — Undebounced autosave diffs the entire log on every keystroke

- **Status:** ✅ Fixed in `19b9315`.
- **Severity:** Medium
- **Category:** Performance
- **Confidence:** Medium. The per-keystroke write path is clear from the code;
  the point at which it becomes perceptible was not measured.
- **Locations:** `src/lib/utils/use-auto-save.ts:16-25`,
  `src/lib/utils/store.ts:264-285` (`qsoOps`, `writeState`)

**Evidence:**

`useAutoSave` fires `save(values)` on every `useWatch` emission — that is, every
keystroke in the QSO form — which calls `log(withBand(edited))`. Each `log` runs a
zustand `set`, which runs the persist middleware, which runs:

```ts
const qsoOps = (qsos: QSO[]): IdbOp[] => {
    const next = new Map(qsos.map((qso) => [qso.id, qso]));
    const ops: IdbOp[] = qsos.filter((qso) => persistedQsos.get(qso.id) !== qso)...
```

**Impact:** The *write* is correctly incremental — that design is good and is what
`4028209` set out to achieve — but the *diff* is not: a new `Map` over every QSO in
the log plus a full `filter` pass, per keystroke, plus `toStorable` deep-copying
sessions, filters and settings for the meta record. On a 100k-QSO log that is
200k operations per character typed, on the UI thread.

**Recommendation:** Debounce `useAutoSave` (200-400 ms is invisible to the
operator and collapses a word into one write). Optionally keep the store's
`qsos` array and the `persistedQsos` map in step incrementally rather than
rebuilding, but the debounce alone removes most of the cost.

**Estimated effort:** S

---

### AUD-011 — Geocode query is not URL-encoded and the promise has no rejection handler

- **Status:** ✅ Fixed in `0c2d66c`.
- **Severity:** Low
- **Category:** Injection / error handling
- **Confidence:** High
- **Locations:** `src/lib/utils/geocode.ts:18`,
  `src/lib/components/geocode-button.tsx:16-22`

**Evidence:**

```ts
const response = await axios.get(`https://geocode.maps.co/search?q=${address}&api_key=${key}`);
```

```ts
geocode(qth, settings.geocodeMapsCoKey as string).then((data) => { ... })
```

**Impact:** A QTH containing `&` or `#` truncates the query or injects a parameter
into the request — most likely outcome is a silently wrong or empty geocode result
rather than anything exploitable, since the endpoint is fixed and the response is
only read for `lat`/`lon`. Separately, a network failure or a bad key produces an
unhandled promise rejection and no feedback: the button appears to do nothing.
Note `hamqth.tsx:79-81` already does this correctly with `encodeURIComponent`.

**Recommendation:** `encodeURIComponent(address)`, and add a `.catch` that reports
through `showDialog`.

**Estimated effort:** S

---

### AUD-012 — Location denial throws into an unhandled promise rejection

- **Status:** ✅ Fixed in `d824159`. The reason comes out on a small transient store
  and `LocationHeader` shows it with a pointer to the gridsquare setting.
- **Severity:** Low
- **Category:** Error handling
- **Confidence:** High
- **Location:** `src/lib/utils/use-location.ts:34-48`

**Evidence:**

```ts
(async () => {
    if (Platform.OS === "android" && !isDevice) { throw new Error("Oops, this will not work on Snack..."); }
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== "granted") { throw new Error("Permission to access location was denied"); }
```

The IIFE's promise is never awaited or caught.

**Impact:** An operator who declines the location prompt gets an unhandled
rejection in the console and no explanation anywhere in the UI; `currentLocation`
simply stays empty, which silently degrades `myStationFromSettings`, the distance
calculation and the TOTA tile derivation. This hook runs in the root layout
(`_layout.tsx:66`), so it affects every screen.

**Recommendation:** Catch inside the IIFE and expose a status alongside the
location so `LocationHeader` can prompt the operator to set a static gridsquare
instead.

**Estimated effort:** S

---

### AUD-013 — `navigate()` called during render

- **Status:** ✅ Fixed in `afafcd5`.
- **Severity:** Low
- **Category:** Correctness
- **Confidence:** High
- **Location:** `src/app/qso.tsx:25-28`

**Evidence:**

```ts
if (!qso) {
    navigate("/");
    return <></>;
}
```

**Impact:** Router state is mutated from a render body. React logs a "Cannot update
a component while rendering a different component" warning and, under Strict Mode
or concurrent rendering, the navigation may fire twice. Reachable by deep-linking
`/qso?qsoId=…` with a stale id, or by having the QSO deleted from under the page.

**Recommendation:** Move it into a `useEffect` keyed on `qso`.

**Estimated effort:** S

---

### AUD-014 — `useQsos()[0].id` assumes a non-empty log

- **Status:** ✅ Fixed in `1c0452e`.
- **Severity:** Low
- **Category:** Correctness
- **Confidence:** Medium. The crash requires the QSO screen to render with an
  empty log, which was reasoned about but not reproduced at runtime.
- **Location:** `src/lib/components/form/form-fields.tsx:84`

**Evidence:**

```ts
const isLastQso = useQsos()[0].id === qso.id;
```

**Impact:** `TypeError: Cannot read properties of undefined (reading 'id')` if the
component renders against an empty log. The narrow window is `onDelete`
(`form-fields.tsx:117-118`), which calls `deleteLog(qso)` and then `goBack()` —
deleting the only QSO in the log re-renders this component with `qsos` empty
before the navigation commits.

**Recommendation:** `useQsos()[0]?.id === qso.id`.

**Estimated effort:** S

---

### AUD-015 — ADIF field lengths counted in UTF-16 units, not bytes

- **Status:** 🚫 Not actioned — the correction needs checking against ADIF 3.1.4's
  normative text first, and a wrong one breaks interop with every logger that reads
  the length the way this app writes it today. Left open.
- **Severity:** Low
- **Category:** Interop
- **Confidence:** Medium. The mismatch is certain; whether a given receiving
  logger reads the length as bytes or characters was not verified against ADIF
  3.1.4's normative text or against specific implementations.
- **Location:** `src/lib/utils/file-format/adif.ts:14-17`

**Evidence:**

```ts
const adifField = (label: string, value?: string | number): string =>
    typeof value !== "undefined" && value !== null
        ? `<${label.toUpperCase()}:${sanitize(String(value)).length}>${sanitize(String(value))}`
        : "";
```

**Impact:** JavaScript's `.length` is UTF-16 code units. A name like `Jörg` is 4
units but 5 UTF-8 bytes; an emoji is 2 units and 4 bytes. Any logger that reads the
declared length as a byte count will mis-frame the field and cascade into the rest
of the record. The app's own parser reads by JS characters too, so self round-trips
are consistent and the existing tests pass — the breakage only shows up against
third-party software, which is exactly what the export exists for.

**Recommendation:** Compute the length as
`new TextEncoder().encode(sanitized).length`, and read the length as bytes on
import. Confirm against the ADIF 3.1.4 spec before changing, since a wrong
correction is worse than the current state. Add a non-ASCII round-trip case to
`tests/file-format.test.ts` either way.

**Estimated effort:** M

---

### AUD-016 — ADIF parser assumes each fragment starts at a tag

- **Status:** ✅ Fixed in `3f492c1`, with a regression test. The recommendation's
  second half — a per-record failure count in the "Done!" dialog — is still open.
- **Severity:** Low
- **Category:** Correctness
- **Confidence:** High
- **Location:** `src/lib/utils/file-format/adif.ts:18-33`

**Evidence:**

```ts
const match = remaining.match(regexp);
...
remaining = remaining.slice(`<${tagName}:${tagLength}${tagType ? `:${tagType}` : ""}>`.length);
```

`match` finds the tag anywhere in the string, but the `slice` that follows removes
that many characters *from position 0*, not from the match index.

**Impact:** Any text preceding the first tag in a record — a stray comment, a
partially-consumed value, an unusual export — shifts every subsequent field by the
length of that text. The next iteration then fails to match, logs
`console.error("Error while parsing line")` and drops the whole record. Silent
partial data loss on import, with the only trace in the console.

**Recommendation:** Slice from `match.index` rather than `0`, and surface a
per-record failure count in the "Done!" dialog rather than only in the console.

**Estimated effort:** S

---

### AUD-017 — Quadratic array rebuild when grouping a day's QSOs

- **Status:** ✅ Fixed in `6f0a41b`.
- **Severity:** Low
- **Category:** Performance
- **Confidence:** High
- **Location:** `src/lib/components/qso/qso-list.tsx:24-31`

**Evidence:**

```ts
sections[title] = [...(sections[title] || []), positioned];
```

**Impact:** Same pattern as AUD-007, scoped to one day's QSOs rather than the whole
log, so it only bites on contest days: 1000 QSOs in a day is ~500k array element
copies each time the memo recomputes. Bounded by the busiest single day, which is
why this is Low rather than Medium.

**Recommendation:** `(sections[title] ??= []).push(positioned)`.

**Estimated effort:** S

---

### AUD-018 — "Erase all QSOs" leaves sessions and filters behind

- **Status:** ✅ Fixed in `666f90f`.
- **Severity:** Low
- **Category:** Data integrity / UX
- **Confidence:** High
- **Locations:** `src/app/adif.tsx:29-45`, `src/lib/utils/store.ts:150`

**Evidence:**

```ts
resetStore: () => set(() => ({ qsos: [] })),
```

followed by a dialog reading "All records have been erased!".

**Impact:** Sessions survive with no QSOs pointing at them, `activeSessionId` may
still name a running session, and any active filters remain applied to a now-empty
log. The Sessions page will list outings that contain nothing. Cosmetic rather than
dangerous — nothing is lost that the user did not ask to lose — but the state is
inconsistent and the dialog overstates what happened.

**Recommendation:** Clear `sessions`, `activeSessionId` and `filters` alongside
`qsos`, or reword the dialog to say QSOs specifically.

**Estimated effort:** S

---

### AUD-019 — An unknown persisted filter name crashes the log screen

- **Status:** ✅ Fixed in `8af7d89`, by guarding `filterQsos` rather than dropping
  the name in the persist `merge`: `filterMap` lives in the component tree that
  `store.ts` deliberately imports types-only from. The stale filter stays in the
  list as a removable chip, so the state is recoverable.
- **Severity:** Low
- **Category:** Robustness / migration
- **Confidence:** Medium. Requires a filter name to be removed from `filterMap`
  in a future release while a user has it persisted; no such removal has happened
  yet.
- **Location:** `src/lib/components/filters.tsx:86-91`

**Evidence:**

```ts
export const filterQsos = (qsos: QSO[], qsosFilters: QsoFilter[]) =>
    qsos.filter((q, i, a) =>
        qsosFilters.reduce((acc, { name, values }) => acc && filterMap[name](q, i, a).some(...), true),
```

**Impact:** `filterMap[name]` is `undefined` for a name no longer in the map, and
the call throws on the main log screen with no recovery path — the filter is
persisted, so reloading reproduces it. The store already has a legacy-dropping
mechanism for settings (`store.ts:83-90`, `legacySettings`) but filters get no
equivalent treatment, and the filter names are exactly the kind of thing that gets
renamed (`totaMap`, `contestMode` already were).

**Recommendation:** Drop unknown filter names in the persist `merge` alongside
`fixSettings`, or guard with `filterMap[name]?.(...) ?? []` in `filterQsos`.

**Estimated effort:** S

---

### AUD-020 — Storage gauge re-walks all storage on every QSO change

- **Status:** ✅ Fixed in `6a16239`.
- **Severity:** Low
- **Category:** Performance
- **Confidence:** Medium. Depends on whether expo-router's `Stack` keeps the
  Settings screen mounted after navigating away, which was not verified at runtime.
- **Location:** `src/lib/utils/use-storage-usage.ts:66-76`

**Evidence:**

```ts
React.useEffect(() => { refresh(); }, [refresh, qsos, settings]);
```

with `measureNative` doing `AsyncStorage.getAllKeys()` then
`AsyncStorage.multiGet(keys)` — reading every stored value into memory to size it.

**Impact:** On native, every QSO logged while the Settings screen is mounted reads
the entire log out of SQLite to measure it. The file's own comment says measuring
is done "on demand and after the log changes rather than on a timer", but "after
the log changes" is the expensive half. The web path is cheap (`navigator.storage
.estimate()`), so this is native-only.

**Recommendation:** Drop `qsos` and `settings` from the dependency array and rely
on the existing manual "Refresh" button (`storage-usage.tsx:44`), which already
exists for exactly this.

**Estimated effort:** S

---

### AUD-021 — CI never runs the test suite

- **Status:** ✅ Fixed in `d9a4a64`.
- **Severity:** Low
- **Category:** CI / testing
- **Confidence:** High
- **Location:** `.github/workflows/ci.yml`

**Evidence:** The `checks` job runs `pnpm types` and `pnpm lint` and stops there.
`pnpm test` — 14 files, 374 passing tests, 2.7 seconds — is never invoked, on any
workflow.

**Impact:** The strongest safety net in the repo is not wired into the gate. Every
correctness finding above (AUD-002 through AUD-004, AUD-015, AUD-016) is in the
file-format layer, which is precisely what `tests/file-format.test.ts` covers — a
regression there would ship unnoticed today.

**Recommendation:** Add `- name: Test` / `run: pnpm test` after the lint step. Two
lines, 2.7 seconds, and it is the single highest-value change in this report.

**Estimated effort:** S

---

### AUD-022 — Privacy copy understates what leaves the device

- **Status:** ✅ Fixed in `fbf68ee`.
- **Severity:** Informational
- **Category:** Privacy
- **Location:** `src/app/settings.tsx:154-157`

**Evidence:**

> All data is stored locally in your browser and is never sent anywhere (except
> for hamqth or geocode maps when using their api)

**Impact:** Accurate about the *log*, incomplete about outbound traffic. With spots
enabled, requests transit `r.jina.ai`, `api.allorigins.win` or `api.codetabs.com`
(`parksnpeaks.tsx:65-69`) — only public spot data, as the code comment correctly
notes, but three third parties nonetheless see the requests. OSM tile fetches
(`osm-map/map.tsx:18`) disclose which areas the operator is viewing, and the NOAA
solar feed is fetched unconditionally when the panel is open. None of this is a
defect; the wording just implies a tighter boundary than exists.

**Recommendation:** Extend the sentence to name the spot relays, the tile server
and the NOAA feed. The Spots switch already carries an honest explanation
(`settings.tsx:88-93`) — mirror that tone here.

**Estimated effort:** S

---

### AUD-023 — HamQTH password stored in cleartext on web

- **Status:** 🚫 Not actioned — no fix to apply: the native path already uses the
  Keychain/Keystore and the web has no equivalent. The outbound services are now
  named in the Settings copy (AUD-022). The per-keystroke `fetchSessionId` still
  wants confirming at runtime.
- **Severity:** Informational
- **Category:** Secrets
- **Location:** `src/lib/utils/store.ts:196-227`

**Evidence:** The code and its comment are explicit:

```
// HamQTH password never touches AsyncStorage on native: it's spliced out before the blob is
// written and stashed in the platform Keychain/Keystore instead... Web has no equivalent
// secure store, so it falls back to the plain AsyncStorage blob there.
```

**Impact:** On web and Tauri, the HamQTH password sits in plaintext in
localStorage/IndexedDB, readable by any script on the origin and by anyone with
filesystem access to the browser profile. This is a correct reading of the
platform's constraints — there is no browser API that would do better without a
user-supplied passphrase — and the native path is handled properly. Recorded so the
tradeoff is visible, not because there is a fix to apply.

Note also that `updateSetting("hamqth", …)` fires per keystroke
(`settings.tsx:186-196`), and `useHamqth`'s session effect depends on `password`
(`hamqth.tsx:174`). If the QSO screen remains mounted behind the Settings screen —
which the expo-router `Stack` may do — each character typed into the password field
triggers a `fetchSessionId` call carrying a partial password to hamqth.com. Worth
confirming at runtime; if it holds, debounce the credential fields.

**Recommendation:** Keep the current design; state the web limitation in the
Settings copy so operators can decide. Verify and, if needed, debounce the
credential inputs.

**Estimated effort:** S

---

### AUD-024 — Only the Tauri build ships a CSP; the PWA ships none

- **Status:** 🚫 Not actioned — defence in depth with no identified injection sink,
  and a `<meta>` CSP that is wrong in any detail breaks the deployed PWA silently.
  Wants a build tested against the policy before it ships. Left open.
- **Severity:** Informational
- **Category:** Security headers
- **Locations:** `src-tauri/tauri.conf.json` (`app.security.csp`),
  `scripts/pwa.mjs:38-52`

**Evidence:** The Tauri config carries a well-constructed policy with an explicit
`connect-src` allowlist, `object-src 'none'` and `base-uri 'self'`. `pwa.mjs`
injects manifest links, theme colours and the service worker registration into the
exported `index.html` but no `<meta http-equiv="Content-Security-Policy">`, and
GitHub Pages sends no CSP header.

**Impact:** Defence in depth only — there is no server, no authentication and no
identified injection sink, so there is nothing concrete for a CSP to stop here
today. Worth noting that the Tauri policy allows `https://*.workers.dev`, which is
any Cloudflare Worker subdomain rather than a specific one; that is a consequence
of `spotsProxy` being operator-configurable and is a reasonable tradeoff, but it
does widen `connect-src` considerably.

**Recommendation:** Mirror the Tauri policy as a `<meta>` CSP in `pwa.mjs` so both
builds have the same posture, and consider narrowing `*.workers.dev` if the
self-hosted relay setup can carry a fixed hostname.

**Estimated effort:** S

---

### AUD-025 — Exported `programversion` is hardcoded to `0.0.1`

- **Status:** 🚫 Not applicable — `scripts/sync-version.mjs` already lists
  `src/lib/utils/file-format/common.ts` in `VERSIONED_FILES` and patches
  `programversion` from the release tag. `0.0.1` is the untagged working-tree value
  and matches `package.json`; released builds carry the real version. (The
  `1.0.0` in `tauri.conf.json` is a hand-bump that ran ahead of the tag.)
- **Severity:** Informational
- **Category:** Correctness
- **Location:** `src/lib/utils/file-format/common.ts:285-290`

**Evidence:**

```ts
fields: { created_timestamp: ..., programid: "down-the-log", programversion: "0.0.1" },
```

Meanwhile `scripts/sync-version.mjs` exists specifically to stamp the release tag
into bundle metadata at build time, and `tauri.conf.json` carries `1.0.0`.

**Impact:** Every exported ADIF and Cabrillo file claims version 0.0.1 regardless
of the build. Makes it impossible to tell which release produced a file when
diagnosing an import problem — which, given AUD-002 through AUD-004, is a
diagnosis that will need making.

**Recommendation:** Read the version from `expo-constants` or have
`sync-version.mjs` stamp it here too.

**Estimated effort:** S

---

### AUD-026 — `sanitize` folds the curly quote `”` into `"`

- **Status:** 🚫 Not actioned — the fold is deliberate and locked in by a test
  (`tests/file-format.test.ts`, `sanitize("a”b")`). Recorded as intentional
  normalisation rather than changed.
- **Severity:** Informational
- **Category:** Interop / data fidelity
- **Location:** `src/lib/utils/file-format/common.ts:83-97`

**Evidence:**

```ts
case '"':
case "”":
    return "&quot;";
```

`unsanitize` maps `&quot;` back to `"` only, so `”` cannot survive a round trip.

**Impact:** A note or name containing a typographic closing quote comes back with a
straight quote after export/import. Trivial, and the asymmetry may well be
deliberate normalisation — recorded because the neighbouring `unsanitize` comment
shows the author cares about exactly this class of round-trip loss.

**Recommendation:** Leave `”` alone in `sanitize` — it needs no XML escaping — or
document the normalisation as intentional.

**Estimated effort:** S

---

## 5. Architecture & Design Observations

**The layering is clean and the dependency direction is right.** `src/lib/utils`
holds pure logic with no React, `src/lib/ui` holds presentation primitives,
`src/lib/components` composes them, and `src/app` is thin route files. The
file-format codecs sit behind a single `FileFormatAPI` interface with a filename
dispatcher, so adding a format touches one directory. The store is deliberately
kept import-light — `store.ts:9-11` uses `import type` specifically to avoid
dragging the component tree in behind it, with a comment explaining why. This is
the kind of discipline that usually only shows up after a project has been hurt by
its absence.

**The state model is coherent.** One zustand store, a persist middleware with a
platform-selected backend, and a `merge` that normalises settings exactly once
rather than on every render. The move from localStorage to IndexedDB (`4028209`)
was done with a migration that keeps the old copy until the new one is confirmed
written (`store.ts:288-297`) — genuinely careful work.

**The systemic weakness is the boundary between pure logic and its callers.** Four
of the Medium findings share one root cause: a pure function throws or returns
something unusable, and the caller neither guards nor reports. `parseLine` throws,
`parseFile` doesn't catch, `onload` doesn't catch, the user sees nothing. The pure
side is well tested; the seam is not tested at all, because the tests exercise
`parseFile` with well-formed fixtures and never the component that calls it. A
single "what does the UI do when the parser throws" test would have caught AUD-002
and AUD-005 together.

**The second systemic issue is that `utils/arrays.ts` never got the treatment the
rest of the codebase did.** The author has twice identified and fixed quadratic
accumulator-spread patterns, with explanatory comments both times. The same pattern
sits unfixed in the shared helper that the Stats, Events and Tiles pages all route
through. Shared utilities are where one fix fans out furthest; this one is worth
prioritising above its individual severity.

**Reference data is compiled in, and that is the right call.** ~25 MB of POTA/SOTA/
WWFF/DXCC JSON ships in the bundle with refresh scripts in `scripts/`. It makes the
offline story work and keeps the app backend-free. The cost is bundle size and
staleness between releases, both acceptable for this domain.

---

## 6. Positive Observations

- **Test suite is real, not decorative.** 374 tests across 14 files covering the
  genuinely tricky logic: Maidenhead projection (`tests/projection.test.ts`),
  callsign parsing, event rules, session spines, TOTA grid maths, QSO prefill
  chains. `tests/qso-prefill.test.ts` alone is 519 lines exercising the
  carry-over/session/extrapolate interaction that is the app's most subtle
  behaviour. All pass in 2.7 seconds.
- **Typecheck and lint are both clean under a strict configuration.** `strict: true`
  in `tsconfig.json`, and `eslint.config.js` promotes `react-hooks/exhaustive-deps`,
  `rules-of-hooks`, `set-state-in-effect` and `no-unused-expressions` to *errors*
  with a comment explaining that each caught a real bug. Style rules that fight the
  codebase are turned off deliberately rather than left as ignorable warnings.
- **The comments explain *why*, consistently.** `store.ts:79-90` on why
  `contestMode` and `totaMap` need no migration; `qso/index.ts:322-327` on why the
  callsign index is keyed on array identity; `parksnpeaks.tsx:56-64` on why the
  relay chain is ordered as it is. This is the most valuable documentation a solo
  project can have and it is present throughout.
- **The optional CORS relay is written defensively.** `scripts/cors-worker.js`
  allowlists two hostnames and returns 403 otherwise, with a comment stating the
  intent — "this can't be turned into an open proxy". Shipping a worker that
  *couldn't* be abused as an open relay, in a file most projects would leave as a
  three-line passthrough, is good judgement.
- **Native credential storage is done properly.** `store.ts:196-227` splices the
  HamQTH password out of the persisted blob and into Keychain/Keystore via
  `expo-secure-store`, merging it back on read, with the web limitation documented
  rather than papered over.
- **Privacy is treated as a first-class concern in `.gitignore`**: `*.adif`,
  `*.adi` and `*.adx` are excluded with the comment "Logs are personal data: they
  carry other operators' callsigns, names and QTHs." Confirmed: no log file has
  ever been committed (`git log --diff-filter=A` over all branches returns nothing).
- **In-place mutation hazards are actively watched for.** `useQsos` copies before
  sorting with a comment saying why; `qsl.tsx:25-27` copies before reversing;
  `qso/qso-list.tsx:22-23` puts the display-only `position` field on a copy so it
  never reaches the store. Three separate places where the easy mistake was avoided
  on purpose.
- **The incremental IndexedDB write path is well designed.** `qsoOps`
  (`store.ts:264-275`) uses reference identity to write only the QSOs that actually
  changed, and `idbBatch` puts every op in one transaction so a save lands whole or
  not at all. The write half of AUD-010 is right; only the diff half needs work.
- **CI exists and gates PRs**, with a comment explaining the deliberate choice to
  fail on errors but not warnings. Release builds all three desktop platforms and
  stamps the tag version into bundle metadata.

---

## 7. Prioritized Remediation Roadmap

### Quick wins — high value, small effort

1. ✅ **AUD-021** — add `pnpm test` to CI. Two lines; protects everything else here.
2. ⚠️ **AUD-001** — rotate the geocode.maps.co key. Do this today; deleting it from
   HEAD was not remediation.
3. ✅ **AUD-002** — guard `parseLine` against non-`KEY: value` lines. Unbreaks
   Cabrillo import entirely.
4. ✅ **AUD-003** — fix the WSJT-X `time_off` fallback to `time_on`.
5. ✅ **AUD-005** — wrap both `FileReader.onload` bodies in `try`/`catch` and report
   through `showDialog`. Makes every future import bug visible instead of silent.
6. ✅ **AUD-008** — delete the four `[DTL-DEBUG]` logs.
7. ✅ **AUD-007** — rewrite `groupBy` and `unique` over `Map`/`Set`. One file,
   fans out to eight callers.

### Short term

8. ✅ **AUD-004** — filter blank lines in WSJT-X `parseFile`; add the
   `!!q.callsign` guard to the main import path.
9. ✅ **AUD-006** — reorder the QSL export so marking follows a successful download,
   or split marking into its own confirmed action as TOTA already does.
10. ✅ **AUD-009** — switch `downloadQsos` to Blob + `createObjectURL`.
11. ✅ **AUD-010** — debounce `useAutoSave`.
12. ✅ **AUD-011, AUD-012** — encode the geocode query; catch the location rejection
    and surface it.
13. ✅ **AUD-013, AUD-014** — move the `navigate` into an effect; add the `?.`.
14. ✅ **AUD-016** — slice from `match.index`. The per-record parse-failure count in
    the import dialog is still outstanding.
15. ✅ **AUD-019, AUD-018, AUD-020** — unknown filter names are guarded in
    `filterQsos` rather than dropped on hydrate: `filterMap` lives in the component
    tree that `store.ts` deliberately imports types-only from, so the persist
    `merge` cannot reach it. Sessions and filters now clear with the QSOs; the
    storage gauge measures on mount and on its Refresh button only.

### Longer term / structural

16. **Test the seam, not just the parsers.** Add component-level tests for the
    import handlers covering a malformed file, an unsupported extension and an
    empty file. This is the gap that let AUD-002 and AUD-005 coexist undetected.
17. **AUD-015** — settle the ADIF length-in-bytes question against the 3.1.4 spec
    and fix both directions together, with a non-ASCII round-trip test.
18. **Large-log performance as an explicit target.** The `random-*.adif` fixtures
    show the intent; AUD-007, AUD-009, AUD-010 and AUD-017 are the four things
    standing between the current build and a usable six-figure log. Consider a
    benchmark test that imports `random-10k.adif` and asserts a time budget.
19. **AUD-022, AUD-023, AUD-024** — align the Settings privacy copy with reality,
    document the web password limitation, and mirror the Tauri CSP into the PWA.

---

## Appendix A — Dependency posture

Dependencies are current and deliberately pinned: Expo 57, React 19.2.3, React
Native 0.86.2, TypeScript 6.0.3, Vitest 4.1.10, Tauri CLI 2.11.4. `pnpm-lock.yaml`
is committed and CI installs with `--frozen-lockfile`, so builds are reproducible
and a drifting transitive dependency cannot enter silently.

No CVE scan was performed — `pnpm audit` needs network access, which was outside
this audit's constraints. What can be said statically: the runtime dependency
surface is small for an app of this size, the risky categories (XML parsing, HTTP)
are covered by `fast-xml-parser` and `axios`, both actively maintained and on
recent majors, and there is no server-side attack surface for a dependency
vulnerability to be reachable *from*. Recommend adding `pnpm audit --audit-level
high` to the CI job alongside the test step.

`fast-xml-parser` is used for both ADX import (`file-format/adx.ts:9-14`) and
HamQTH responses (`hamqth.tsx:63`), in both cases configured with
`ignoreAttributes: true` and `parseTagValue: false` — the safer settings, and
deliberately chosen per the accompanying comments.

## Appendix B — Test coverage notes

Well covered: locator/projection maths, callsign parsing, event rules, session
construction and spines, TOTA grid and activation logic, QSO prefill chains,
reference search, frequency/band mapping, QSO issue detection.

Not covered: every component (`tests/` contains no `.tsx` tests and vitest runs
with `environment: "node"`), the store's persistence and migration paths, the
IndexedDB layer, the import/export UI handlers, the network fetchers
(`hamqth`, `geocode`, `parksnpeaks`, `solar-data`), and the service worker.

The file-format tests exercise `parseFile` and `generateFile` with well-formed
fixtures; they do not cover malformed input, empty files, trailing newlines or
non-ASCII content — which is where four of this audit's correctness findings live.

## Appendix C — Files not line-audited

`src/lib/components/osm-map/{map,marker,path,common}.tsx` (structural review only;
projection maths is separately tested), `src/lib/data/*.{ts,json}` (generated
reference tables, spot-checked), `src/lib/ui/*` presentation primitives beyond
`input.tsx` and `dialog.tsx`, `scripts/{pota,sota,wwff,dxcc,world,iota}.ts` (build-
time data generators, not shipped), `src-tauri/target/**`, `node_modules/**`.
