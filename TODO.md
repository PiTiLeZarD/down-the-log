# TODO

This is the rough todolist I want to work on, I'll try to chunk all this in 5mn increments

## WIP

This is what I'll be working on next.

-   [ ] web
    -   [x] fonts not loaded
    -   [x] icons not working
    -   [x] huge padding at the bottom of the page on mobile
    -   [ ] rotating the screens bugs the whole thing
-   [ ] ios errors galore
-   [ ] adif import export
    -   [x] download qsos as adif
    -   [ ] ability to ask "download from last export"
    -   [x] upload adif file, merge with current qsos, find duplicates etc...
    -   [x] improve adif page interface
    -   [ ] find a solution for mobile (download works, upload probably doesn't)
    -   [ ] use gdrive as backup/restore
-   [ ] Improve the QSO form page so it's nice usable and has all details fillable
    -   [x] S/N input to help fill tx/rx report up real quick
    -   [x] add all the rest of the fields (check adif spec and rumlog)
    -   [ ] add https://docs.expo.dev/versions/latest/sdk/date-time-picker/ in the form to edit date/time

## Backlog

Got too many ideas, here is where I chuck them

-   [ ] implement ADX file format
-   [ ] Stats
    -   [ ] qsos /continent /country /year,month
    -   [ ] heatmap of qso per day (github style)
    -   [ ] qsos/band,mode
-   [ ] Events (WWFF/POTA/SOTA/etc...)
    -   [ ] db with all parks, locations and polylines
    -   [ ] button a-la band/SN to set events id, add in QSOForm and possibly have an option to add it straight in the callsign input
    -   [ ] adif to export/import it properly
    -   [ ] adif has WWFF/SOTA/POTA also SIG will have to be parsed on import to put in the right spot (if VKFF still uses SIG for WWFF, have a setting during export, or maybe a remapping of fields?)
-   [ ] manage multiple rigs/antenna and use ADIF to store/retrieve it
-   [ ] DXCC for australia doesn't include me, let's find out why (need some map tooling)
-   [ ] yarn release should use ghpages to create the demo, build the tauri app and release it, build ios/android apps
    -   [x] demo website on github
    -   [ ] look into automatic/programatic github release
    -   [ ] script the apk/dmg releases
        -   [ ] Create playstore dev account and release there
-   [ ] contest mode (instead of Callsign > Form, have all relevant details on the bottom and log directly, ability to edit later)
-   [ ] band map, ability to link callsign/frequency on the band, use this to start qso's (also ability to write name/qth and other details so it's prefilled)
-   [ ] qso filters and grouping
    -   [x] typing a callsign should filter the list based on what's being typed
    -   [ ] today/this month/this year/all
    -   [x] list should display the date (QSOsecretary style)
-   [ ] qso's map view (wide screen could have both displayed, phone could have a selector?)
    -   [ ] https://github.com/react-native-maps/react-native-maps
    -   [ ] work on the layout using the responsive grid
    -   [ ] find a way to use leaflet or other ways to have maps on react-native
    -   [ ] display qsos based on maidenhead
    -   [ ] cluster qsos
-   [ ] hamclock modules (sunspot or sun data, propagaion, greyline, short/long path etc...)
-   [ ] integrations
    -   [ ] qrz integration
    -   [ ] hamQTH
    -   [ ] lotw (this one sounds tough, gotta sign adif exports, let's see)
-   [ ] cluster?
-   [ ] Settings
    -   [x] should be able to select our own callsign, maybe prompt at the start of the app
    -   [ ] choose favorite bands
    -   [ ] choose favorite modes
    -   [ ] fix location vs use gps
    -   [ ] light/dark theme
    -   [ ] input callsign vs contest
    -   [ ] choose grouping (date vs sesh vs contest vs...)

## Done

-   [x] Perf issues, typing a callsign is way too slow
-   [x] Perf issues, migrate to unistyles
-   [x] fix the burger menu (https://github.com/gluestack/gluestack-ui/issues/491#issuecomment-1797030604)
-   [x] Add time column in qso list
-   [x] Fix the date being lost somehow
-   [x] Add distance data in the qso list
-   [x] Your location should be based on GPS or set manually and displayed in the top part (with UTC/local clocks)
    -   [x] useLocation to display the lat/long
    -   [x] convert to maidenhead
    -   [x] cq/itu zones
    -   [x] add clocks
    -   [x] Store previous position in zustand
    -   [x] WIP: burger icon or 2 dots menu in the header (chuck about in there)
-   [x] finish up the qso form, doesn't have to be final, just functional, check that edit works well too
-   [x] ability to delete a qso
-   [x] automatic prefix recognition, show location/distance
-   [x] Fix the qso list pushing the input all the way down
-   [x] Adif aren't necessarily one line one record. Change the parser so it finds <EOR> before parsing it instead of parling lines
-   [x] improve performance of callsign input, for now it's doing a lot of un-necessary work
