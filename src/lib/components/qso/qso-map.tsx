import { QSO } from ".";
import { groupBy } from "../../utils/arrays";
import { corners2Path, fixLatLngForMercator, maidenhead2Corners, maidenhead2Latlong } from "../../utils/locator";
import { latlng2coord } from "../../utils/polygon";
import { Map } from "../osm-map/map";
import { Marker } from "../osm-map/marker";
import { Path } from "../osm-map/path";

export type QsoMapProps = {
    qso?: QSO;
    qsos?: QSO[];
    width?: "auto" | number;
    height?: number;
};

// Pastel enough to read as a wash over the tiles rather than as another route line.
const MY_GRID = "#7aa7ff";
const THEIR_GRID = "#ff9aa7";

// The 4-character square, so a 6-character locator still gets a box big enough to see next to a
// path that's usually thousands of kilometres long.
const gridSquare = (locator: string, colour: string) => {
    // A field-only locator has no digits to read, and maidenhead2Corners would parseInt them to NaN.
    const [c1, c2] = maidenhead2Corners(locator, locator.length >= 4 ? 4 : 2);
    return (
        <Path
            key={`grid-${locator}`}
            style={{ color: colour, fillcolor: colour, weight: 1 }}
            polygon={corners2Path(fixLatLngForMercator(c1), fixLatLngForMercator(c2)).map(latlng2coord)}
        />
    );
};

export const QsoMap = ({ qso, qsos, width = "auto", height = 200 }: QsoMapProps) => {
    if (!qso && !qsos) {
        throw new Error("Incorrect use of QSO Map");
    }

    const toDisplay = (qso ? [qso] : (qsos as QSO[])).filter((q) => q.locator && q.myLocator);

    if (!toDisplay.length) return <></>;

    const myLocators = Object.keys(groupBy(toDisplay, (q) => q.myLocator as string));
    const theirLocators = Object.keys(groupBy(toDisplay, (q) => q.locator as string));

    return (
        <Map width={width} height={height}>
            {myLocators.map((l) => gridSquare(l, MY_GRID))}
            {theirLocators.map((l) => gridSquare(l, THEIR_GRID))}

            {myLocators.map((l) => (
                <Marker key={l} location={maidenhead2Latlong(l)} style={{ color: "blue", label: "A" }} />
            ))}
            {theirLocators.map((l) => (
                <Marker
                    key={l}
                    location={maidenhead2Latlong(l)}
                    style={{ label: "B", ...(toDisplay.length === 1 ? {} : { size: "tiny" }) }}
                />
            ))}

            {toDisplay.map((q) => (
                <Path
                    key={q.id}
                    style={toDisplay.length === 1 ? { weight: 3 } : { weight: 1 }}
                    from={maidenhead2Latlong(q.myLocator as string)}
                    to={maidenhead2Latlong(q.locator as string)}
                />
            ))}
        </Map>
    );
};
