import { QSO } from ".";
import { groupBy } from "../../utils/arrays";
import { maidenhead2Latlong } from "../../utils/locator";
import { Map } from "../osm-map/map";
import { Marker } from "../osm-map/marker";
import { Path } from "../osm-map/path";

export type QsoMapProps = {
    qso?: QSO;
    qsos?: QSO[];
    width?: "auto" | number;
    height?: number;
};

export const QsoMap = ({ qso, qsos, width = "auto", height = 200 }: QsoMapProps) => {
    if (!qso && !qsos) {
        throw new Error("Incorrect use of QSO Map");
    }

    const toDisplay = (qso ? [qso] : (qsos as QSO[])).filter((q) => q.locator && q.myLocator);

    if (!toDisplay.length) return <></>;

    return (
        <Map width={width} height={height}>
            {Object.keys(groupBy(toDisplay, (q) => q.myLocator as string)).map((l) => (
                <Marker key={l} location={maidenhead2Latlong(l as string)} style={{ color: "blue", label: "A" }} />
            ))}
            {Object.keys(groupBy(toDisplay, (q) => q.locator as string)).map((l) => (
                <Marker
                    key={l}
                    location={maidenhead2Latlong(l as string)}
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
