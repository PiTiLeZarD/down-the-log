# TODO

This is the rough todolist I want to work on, I'll try to chunk all this in 5mn increments

-   [ ] Your location should be based on GPS or set manually and displayed in the top part (with UTC/local clocks)
-   [ ] yarn release should use ghpages to create the demo, build the tauri app and release it, build ios/android apps
    -   [ ] demo website on github
    -   [ ] look into automatic/programatic github release
    -   [ ] script the apk/dmg releases
-   [ ] finish up the qso form, doesn't have to be final, just functional, check that edit works well too
-   [ ] contest mode (instead of Callsign > Form, have all relevant details on the bottom and log directly, ability to edit later)
-   [ ] ability to delete a qso
-   [ ] automatic prefix recognition, show location/distance
-   [ ] band map, ability to link callsign/frequency on the band, use this to start qso's (also ability to write name/qth and other details so it's prefilled)
-   [ ] qso filters and grouping
    -   [ ] typing a callsign should filter the list based on what's being typed
    -   [ ] today/this month/this year/all
    -   [ ] list should display the date (QSOsecretary style)
    -   [ ] group by session (session are all qsos in a chunk of time (same freq, close to each other))
-   [ ] qso's map view (wide screen could have both displayed, phone could have a selector?)
    -   [ ] work on the layout using the responsive grid
    -   [ ] find a way to use leaflet or other ways to have maps on react-native
    -   [ ] display qsos based on maidenhead
    -   [ ] cluster qsos
-   [ ] work on import/export adif format
-   [ ] hamclock modules (sunspot or sun data, propagaion, greyline, short/long path etc...)
-   [ ] integrations
    -   [ ] qrz integration
    -   [ ] hamQTH
    -   [ ] lotw (this one sounds tough, let's see)
-   [ ] cluster?
