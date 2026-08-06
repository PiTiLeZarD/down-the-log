# TODO

This is the rough todolist I want to work on.

## Maps

- [ ] Remove all the google static maps and replace it with openstreetmaps
- [ ] Map out a group of QSO's and then link it to a day, a filter, an event
- [ ] Events maps to also draw the outline of the event

## Stats

- [ ] Stats should have presets for things we want to know often
- [ ] hamclock modules (sunspot or sun data, propagaion, greyline, short/long path etc...)
    - [x] data ranges: https://3fs.net.au/making-sense-of-solar-indices/
    - [x] SFI and SSN: https://services.swpc.noaa.gov/json/solar-cycle/predicted-solar-cycle.json
    - [x] Kp and A: https://services.swpc.noaa.gov/products/noaa-planetary-k-index.json
- [x] Stats
    - [x] qsos /continent /country /year,month
    - [ ] heatmap of qso per day (github style)
    - [x] qsos/band,mode
    - [ ] graphs?

## Features / UI

- [ ] Replace that ugly ass popup library I have.
- [ ] Work on spots (spotting oneself for parks, list spots from others, maybe code an API for all this, seems like most services don't plan for CORS)
- [ ] Think about events 2fer, n-fer
- [ ] red lines for issues with location/callsign
- [ ] previous qso list to be a little more useful
    - [ ] The date seems to wrap and shouldn't
- [ ] should make a visual indication that hamqth isn't available, it happens often (also that the data is from hamqth)
- [ ] band map, ability to link callsign/frequency on the band, use this to start qso's (also ability to write name/qth and other details so it's prefilled)
- [ ] Have a "Net" module, showing what's going on where and when
    - [ ] also plan on grouping qsos in the same net, or having a way to make it visually clear that they all belong to the same thing
- [ ] cluster?

## Data

- [ ] use gdrive as backup/restore
    - [ ] RN: https://react-native-documents.github.io/
    - [ ] Web: https://www.npmjs.com/package/gdrive-fs
- [ ] QSL's interface to match manually when they're not matched. Also try to suss out why it doesn't match sometimes.
- [ ] QSO Issues
    - [ ] one function to spit out [field, description][] issues
    - [ ] country/continent/dxcc/grid warnings from this
    - [ ] frequency not in band warning
    - [ ] ability to ignore issues
    - [ ] missing pota/wwff when match is found
    - [ ] mising references
    - [ ] have filter (hasIssues)
    - [ ] remove the current warnings (country/continent/dxx) and on events
- [ ] parksandpeaks integration (https://parksnpeaks.org/api/) CORS issue, I've contacted them, let's see
- [ ] Look into the clublog dxcc db (https://dl2rum.de/RUMlogNG/docs/en/pages/Online_CLDX.html)
- [ ] Band plan (typical adif band spread or australian band plan with ability to switch, also display band usage from https://www.wia.org.au/members/bandplans/data/documents/Australian%20Band%20Plans%20200901.pdf or whichever by country)

## Mobile apps journey

- [ ] find a solution for import/export on mobile (download works, upload probably doesn't)
    - [ ] `downloadQsos` builds a `document.createElement("a")`, so export is dead on native (`app/lib/utils/file-format/index.ts:16`). `expo-file-system` + `expo-sharing` covers it
    - [ ] while in there: the `data:text/plain,` href caps out around a few MB in some browsers, `Blob` + `URL.createObjectURL` is safer for big logs
- [ ] ios/android debug and shakedown
- [ ] open accounts on playstore and apple dev
- [ ] pnpm release should use ghpages to create the demo, build the tauri app and release it, build ios/android apps
    - [x] demo website on github
    - [x] look into automatic/programatic github release
    - [x] script the dmg releases
    - [ ] script the apk releases

## Bugs found in the code review (2026-08-05)

- [ ] ADIF `COUNTRY` is written and read as our iso3, but the spec says it holds the DXCC entity name. Breaks interop both ways, and is why the filter had to fall back to the raw value. Needs an iso3 <-> DXCC-name map — now a `to`/`from` codec on the single `field("country", "country")` row in `file-format/common.ts`
- [ ] QSL import mutates the matched QSO in place against a render-time snapshot of the log (`app/qsl.tsx:66-71`). Two files imported back to back both work off pre-import state. Probably the reason matching sometimes misses. Return new objects and re-read the store
- [ ] `utils/merge.ts` throws away the recursive return value, so nested merges silently do nothing. Nothing imports it, so just delete the file
- [ ] HamQTH user/password aren't URL-encoded (`utils/hamqth.tsx:38-40`), so a password containing `&` `+` `#` or a space fails login with no useful error. Same for the address in `utils/geocode.ts:18`. Use `URLSearchParams`
- [ ] `unsanitize` deletes entities it doesn't know: the regex matches any `&xx;`..`&xxxx;` and the switch default returns `""` (`file-format/common.ts:92-106`). An `&nbsp;` in a comment vanishes on import. Default should return the match untouched
- [ ] eQSL/LoTW flags are always exported, `"N"` when we simply don't know (`file-format/common.ts:135-138`). That asserts "not sent" to whatever logbook receives the file. Emit nothing when the flag is unset

## Performance

- [ ] opening a QSO for the first time in a session stalls for about a second. `form-fields.tsx` pulls in `Events` -> `event-rules.ts`, which imports `pota.json` (6.7MB), `sota.json` (8.9MB), `wwff.json` (4.2MB) and `iota.json`. expo-router loads route modules on first navigation, so that whole ~20MB of JSON-as-object-literal is parsed and evaluated on the first click, and is warm afterwards — which is exactly the symptom. Options: `require` the datasets lazily inside the lookups that need them, ship them as `JSON.parse("...")` strings (much faster to parse than object literals), or move the lookups behind an index built at build time

## Security

- [ ] the Google Maps **signing secret** lives in the client: HMAC'd in the browser (`components/google-static-map/map.tsx:19-25`) and persisted to localStorage (`app/settings.tsx:210`). Google's signing secret is server-side only — anyone with the device or a shared browser profile can sign unlimited Static Maps requests on my bill. Either drop signing (key + referrer restriction + quota cap is the normal client-side posture) or proxy the signing
- [ ] HamQTH password is stored in plaintext (`utils/store.ts:21`) and sent as a GET query param, so it lands in browser history. `expo-secure-store` on native at least
- [ ] Tauri runs with `"csp": null` (`src-tauri/tauri.conf.json`). Set a real one, the asset origins are all known
- [ ] the settings blurb says data is "never sent anywhere (except for hamqth or..." (`app/settings.tsx:155`) — should also name geocode.maps.co and Google
