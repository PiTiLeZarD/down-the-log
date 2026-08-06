# TODO

This is the rough todolist I want to work on.

## Must have

- [ ] Stats to have presets
- [ ] use gdrive as backup/restore
    - [ ] RN: https://react-native-documents.github.io/
    - [ ] Web: https://www.npmjs.com/package/gdrive-fs
- [ ] QSL's interface to match manually when they're not matched. Also try to suss out why it doesn't match sometimes.
- [ ] red lines for issues with location/callsign
- [ ] customise straight from input box
- [ ] Bug: customising input is written over
- [ ] Work on spots (spotting oneself for parks, list spots from others, maybe code an API for all this, seems like most services don't plan for CORS)
- [ ] Think about events 2fer, n-fer
- [ ] QSO Issues
    - [ ] one function to spit out [field, description][] issues
    - [ ] country/continent/dxcc/grid warnings from this
    - [ ] frequency not in band warning
    - [ ] ability to ignore issues
    - [ ] missing pota/wwff when match is found
    - [ ] mising references
    - [ ] have filter (hasIssues)
    - [ ] remove the current warnings (country/continent/dxx) and on events
- [ ] previous qso list to be a little more useful

## Good to have

- [ ] should make a visual indication that hamqth isn't available, it happens often
- [ ] parksandpeaks integration (https://parksnpeaks.org/api/) CORS issue, I've contacted them, let's see
- [ ] band map, ability to link callsign/frequency on the band, use this to start qso's (also ability to write name/qth and other details so it's prefilled)
- [ ] hamclock modules (sunspot or sun data, propagaion, greyline, short/long path etc...)
    - [x] data ranges: https://3fs.net.au/making-sense-of-solar-indices/
    - [x] SFI and SSN: https://services.swpc.noaa.gov/json/solar-cycle/predicted-solar-cycle.json
    - [x] Kp and A: https://services.swpc.noaa.gov/products/noaa-planetary-k-index.json
- [ ] pnpm release should use ghpages to create the demo, build the tauri app and release it, build ios/android apps
    - [x] demo website on github
    - [x] look into automatic/programatic github release
    - [x] script the dmg releases
    - [ ] script the apk releases
- [ ] Have a "Net" module, showing what's going on where and when
    - [ ] also plan on grouping qsos in the same net, or having a way to make it visually clear that they all belong to the same thing
- [x] Stats
    - [x] qsos /continent /country /year,month
    - [ ] heatmap of qso per day (github style)
    - [x] qsos/band,mode
    - [ ] graphs?
- [ ] cluster?
- [ ] Look into the clublog dxcc db (https://dl2rum.de/RUMlogNG/docs/en/pages/Online_CLDX.html)
- [ ] Band plan (typical adif band spread or australian band plan with ability to switch, also display band usage from https://www.wia.org.au/members/bandplans/data/documents/Australian%20Band%20Plans%20200901.pdf or whichever by country)

## Mobile apps journey

- [ ] find a solution for import/export on mobile (download works, upload probably doesn't)
    - [ ] `downloadQsos` builds a `document.createElement("a")`, so export is dead on native (`app/lib/utils/file-format/index.ts:16`). `expo-file-system` + `expo-sharing` covers it
    - [ ] while in there: the `data:text/plain,` href caps out around a few MB in some browsers, `Blob` + `URL.createObjectURL` is safer for big logs
- [ ] ios/android debug and shakedown
- [ ] open accounts on playstore and apple dev

## Bugs found in the code review (2026-08-05)

- [ ] ADIF `COUNTRY` is written and read as our iso3, but the spec says it holds the DXCC entity name. Breaks interop both ways, and is why the filter had to fall back to the raw value. Needs an iso3 <-> DXCC-name map — now a `to`/`from` codec on the single `field("country", "country")` row in `file-format/common.ts`
- [ ] QSL import mutates the matched QSO in place against a render-time snapshot of the log (`app/qsl.tsx:66-71`). Two files imported back to back both work off pre-import state. Probably the reason matching sometimes misses. Return new objects and re-read the store
- [ ] `utils/merge.ts` throws away the recursive return value, so nested merges silently do nothing. Nothing imports it, so just delete the file
- [ ] HamQTH user/password aren't URL-encoded (`utils/hamqth.tsx:38-40`), so a password containing `&` `+` `#` or a space fails login with no useful error. Same for the address in `utils/geocode.ts:18`. Use `URLSearchParams`
- [ ] `unsanitize` deletes entities it doesn't know: the regex matches any `&xx;`..`&xxxx;` and the switch default returns `""` (`file-format/common.ts:92-106`). An `&nbsp;` in a comment vanishes on import. Default should return the match untouched
- [ ] eQSL/LoTW flags are always exported, `"N"` when we simply don't know (`file-format/common.ts:135-138`). That asserts "not sent" to whatever logbook receives the file. Emit nothing when the flag is unset

## Performance

- [ ] opening a QSO for the first time in a session stalls for about a second. `form-fields.tsx` pulls in `Events` -> `event-rules.ts`, which imports `pota.json` (6.7MB), `sota.json` (8.9MB), `wwff.json` (4.2MB) and `iota.json`. expo-router loads route modules on first navigation, so that whole ~20MB of JSON-as-object-literal is parsed and evaluated on the first click, and is warm afterwards — which is exactly the symptom. Options: `require` the datasets lazily inside the lookups that need them, ship them as `JSON.parse("...")` strings (much faster to parse than object literals), or move the lookups behind an index built at build time
- [ ] `useAutoSave` writes on mount: `useWatch` returns values straight away, so the effect fires immediately and `log(qso)` rebuilds the whole `qsos` array and re-persists the entire store every single time a QSO page is opened, edited or not. Only save once the form is actually dirty

- [x] `hasDuplicates` filter is O(n^2) with a regex inside: `findMatchingQsos` per QSO across every QSO (`components/filters.tsx:56`). At a few thousand QSOs that's tens of millions of `baseCallsign` regex runs and the filter screen locks up. Build a `Map<baseCallsign, QSO[]>` once
- [x] ADIF import has the same shape, every imported record scans the whole log (`components/adif/import.tsx:59`). Same index fixes it
- [x] memoise `baseCallsign` — it gets called repeatedly on identical strings from list rendering, filtering and dedup
- [ ] `useSettings` rebuilds the settings object every render (`utils/use-settings.ts:5`), so nothing downstream can memo on it. Run `fixSettings` once in the persist `merge` option instead
- [ ] `useThrottle` reschedules on every render and `setState`s a fresh value, so any component that calls it during render re-renders itself forever at the throttle interval. `QsoList` was doing this (fixed with a memo); `useHamQTH` still does (`utils/hamqth.tsx:134`), which means a HamQTH lookup every 500ms for as long as a callsign sits in the box. Either compare against the last args before scheduling, or debounce the input instead of the result
- [ ] consider one `useFilteredQsos()` selector doing sort + filter + memo, consumed by index/stats/filters/qsl, instead of `filterQsos(useQsos(), filters)` repeated in each

## Security

- [ ] the Google Maps **signing secret** lives in the client: HMAC'd in the browser (`components/google-static-map/map.tsx:19-25`) and persisted to localStorage (`app/settings.tsx:210`). Google's signing secret is server-side only — anyone with the device or a shared browser profile can sign unlimited Static Maps requests on my bill. Either drop signing (key + referrer restriction + quota cap is the normal client-side posture) or proxy the signing
- [ ] HamQTH password is stored in plaintext (`utils/store.ts:21`) and sent as a GET query param, so it lands in browser history. `expo-secure-store` on native at least
- [ ] Tauri runs with `"csp": null` (`src-tauri/tauri.conf.json`). Set a real one, the asset origins are all known
- [ ] the settings blurb says data is "never sent anywhere (except for hamqth or..." (`app/settings.tsx:155`) — should also name geocode.maps.co and Google

## Housekeeping

- [ ] no tests at all. The pure logic is the testable part and is exactly where the review bugs were: `callsign.ts`, `locator.ts`, ADIF/ADX round-trip, `event-rules.ts`, the `prefill*` helpers. vitest
- [x] unmaintained deps carrying real weight under React 19 / RN 0.86: `react-native-svg-charts` (last publish 2019), `react-native-big-list` (2022), `react-native-picker-select`. All three already needed `autoProcessPaths` workarounds in `babel.config.js`. Biggest risk to the next Expo upgrade — `@shopify/flash-list` replaces big-list, `victory-native` or plain `react-native-svg` replaces the charts
    - [x] `react-native-big-list` -> `FlatList` (sections flattened into one row list). Tried `@shopify/flash-list` first, but v2 positions cells absolutely off measured heights, so every mount showed the rows piled up for a frame before they snapped into place. `FlatList` lays out in flow, so the first paint is already correct
    - [x] `react-native-picker-select` -> `@react-native-picker/picker`, which was already a dependency. iOS keeps the modal-wheel behaviour, web/android use the picker directly
    - [x] `react-native-svg-charts` -> `components/bar-chart.tsx`, plain views, no svg needed
    - [x] `autoProcessPaths` is down to `@expo/html-elements` only
    - [ ] none of it is verified on a real ios/android build yet, only web

## Refactors

- [ ] the whole design system (Button, Input, Typography...) sits in `app/lib/utils/theme/components/`, three levels down under `utils`. Promote to `app/lib/ui/`

## Done

- [x] add zlota siota links from sig
- [x] little tree for p2p calls, little note for the ones with a comment (chatbox-ellipses-outline)
- [x] Parks matching across wwff and pota should be an option, for now it's "if it matches, you can't get away from it"
- [x] find duplicates
- [x] dropdowns are always white and even when the text is white
- [x] use https://services.swpc.noaa.gov/text/daily-solar-indices.txt for SFI (and try to plot more in the modal)
- [x] Some pages scroll under the black background
- [x] events odd/even are hard to read on dark mode
- [x] issue with the url, redirecting outside of the demo site for the index page
- [x] ragchew mode (starts a timer on a qso, still possible to edit end time on a non ragchew mode)
- [x] there's issues to what is prefilled while making a bunch of qsos.
- [x] if matched, the event should also set qth/grid or myqth/mygrid
- [x] shouldn't be able to click on the date header if the google maps api isn't filled (or maybe put something else instead?)
- [x] Chile callsign unrecognised (CE8EIO) Thai either (HS60RAST)
- [x] light/dark theme
- [x] integrations
    - [x] qrz integration
    - [x] hamQTH
    - [x] eqsl
    - [x] lotw ([this one sounds tough, gotta sign adif exports, let's see](https://lotw.arrl.org/lotw-help/developer-information/?lang=en))
- [x] Find a way to differeciate between south cook island and north cook island dxcc entities since they share the same callsigns (maybe separate the dxcc list from the callsigns)
- [x] Improve the QSO form page so it's nice usable and has all details fillable
    - [x] S/N input to help fill tx/rx report up real quick
    - [x] add all the rest of the fields (check adif spec and rumlog)
    - [x] edit date/time (will improve this in the future)
    - [x] allow filling up itu/cq/dxcc and all that
- [x] Events
    - [x] Local WWFF rules (VKFF requires 11 contacts)
    - [x] Handle anything SOTA
    - [x] Finish up with Pota/Sota/Iota rules and data
    - [x] Find a way to handle Sig properly (we'll come to this when needed)
    - [x] not too pretty atm
    - [x] wwff clusterbydate doesn't quite work
    - [x] add stats per activations
- [x] adding a new QSO should reset the date
- [x] Add my_state, my_country
- [x] contest mode (instead of Callsign > Form, have all relevant details on the bottom and log directly, ability to edit later)
    - [x] Pick things that go in there (freq, sn reports, name, qth, things like these and build the form dynamically)
- [x] Settings
    - [x] should be able to select our own callsign, maybe prompt at the start of the app
    - [x] choose favorite bands
    - [x] choose favorite modes
    - [x] fix location vs use gps
    - [x] choose grouping (date vs sesh vs contest vs...)
- [x] adif import export
    - [x] Lossless ADIF (don't strip fields we don't use)
    - [x] download qsos as adif
    - [x] ability to ask "download from last export"
    - [x] use filters for exporting (ability to untick this)
    - [x] upload adif file, merge with current qsos, find duplicates etc...
    - [x] improve adif page interface
- [x] manage multiple rigs/antenna and use ADIF to store/retrieve it
- [x] import qsl sets a random date, find that date from the log
- [x] Events (WWFF/POTA/SOTA/etc...)
    - [x] button a-la band/SN to set events id, add in QSOForm and possibly have an option to add it straight in the callsign input
    - [x] adif to export/import it properly
    - [x] adif has WWFF/SOTA/POTA also SIG will have to be parsed on import to put in the right spot (if VKFF still uses SIG for WWFF, have a setting during export, or maybe a remapping of fields?)
    - [x] WWFF file: https://wwff.co/wwff-data/wwff_directory.csv
    - [x] POTA file: https://pota.app/all_parks_ext.csv
- [x] DXCC for australia doesn't include me, let's find out why (need some map tooling)
- [x] qso's map view (wide screen could have both displayed, phone could have a selector?)
    - [x] https://github.com/react-native-maps/react-native-maps
    - [x] work on the layout using the responsive grid
    - [x] find a way to use leaflet or other ways to have maps on react-native
    - [x] display qsos based on maidenhead
- [x] persist filters (delete filters when removing the bar as well)
- [x] previous qsos displayed in the form somehow
- [x] Signal input should allow db for ft8
- [x] implement ADX file format
- [x] Manage errors from HamQTH
- [x] web
    - [x] fonts not loaded
    - [x] icons not working
    - [x] huge padding at the bottom of the page on mobile
    - [x] rotating the screens bugs the whole thing
- [x] Perf issues, typing a callsign is way too slow
- [x] Perf issues, migrate to unistyles
- [x] fix the burger menu (https://github.com/gluestack/gluestack-ui/issues/491#issuecomment-1797030604)
- [x] Add time column in qso list
- [x] Fix the date being lost somehow
- [x] Add distance data in the qso list
- [x] Your location should be based on GPS or set manually and displayed in the top part (with UTC/local clocks)
    - [x] useLocation to display the lat/long
    - [x] convert to maidenhead
    - [x] cq/itu zones
    - [x] add clocks
    - [x] Store previous position in zustand
    - [x] WIP: burger icon or 2 dots menu in the header (chuck about in there)
- [x] finish up the qso form, doesn't have to be final, just functional, check that edit works well too
- [x] ability to delete a qso
- [x] automatic prefix recognition, show location/distance
- [x] Fix the qso list pushing the input all the way down
- [x] Adif aren't necessarily one line one record. Change the parser so it finds <EOR> before parsing it instead of parling lines
- [x] improve performance of callsign input, for now it's doing a lot of un-necessary work
- [x] qso filters and grouping
    - [x] typing a callsign should filter the list based on what's being typed
    - [x] today/this month/this year/all
    - [x] list should display the date (QSOsecretary style)
- [x] mode is often null, find out why
- [x] lint backlog — `pnpm lint` is clean and every rule below is now `error` in `eslint.config.js`
    - [x] 25 `react-hooks/exhaustive-deps`. Most of them were "trigger on this one field, but read everything else fresh", which is `useEffectEvent` (React 19.2, supported by both the DOM and Fabric renderers here)
    - [x] 8 `react-hooks/set-state-in-effect` — the prop-mirroring ones (`input`, `state-field`, `band-freq-input`, `paginated-list`) resync during render instead, `grid/styles` is a `useMemo`, `use-location` derives the static gridsquare
    - [x] 8 `react-hooks/refs` — the ragchew timer in `form-fields.tsx` is derived state now, and `google-static-map/map.tsx` measures with `onLayout` instead of reading `clientWidth` off a ref during render
    - [x] 2 `no-unused-expressions`, 4 `@typescript-eslint/no-unused-vars`, 1 `import/no-named-as-default-member`
    - [x] 1 `react-hooks/incompatible-library` — `app/index.tsx` uses `useWatch` instead of `methods.watch()`, so React Compiler can process the file
- [x] `console.groupEnd;` is missing its call parens (`app/qsl.tsx:107`), so the group never closes
- [x] HamQTH session never refreshes: the effect has `[]` deps (`utils/hamqth.tsx:127`) but sessions expire after an hour (`:59`), so lookups go quiet until the app remounts. Depend on user/password and retry when `isSessionValid` flips
- [x] ADIF header `programversion` is hardcoded to `"0.0.1"` (`file-format/common.ts:235`) and `scripts/sync-version.mjs` doesn't patch it. Add it to `VERSIONED_FILES`
- [x] `filterQsos` re-runs on every keystroke in the callsign box (`app/index.tsx:88`), memo on `[qsos, filters]`
- [x] ADX import and HamQTH lookup both call `new DOMParser()`, which doesn't exist on native (`file-format/adx.ts:50`, `utils/hamqth.tsx:42`). `fast-xml-parser` is already a devDep, promote it and swap
