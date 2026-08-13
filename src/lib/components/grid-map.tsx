import { unique } from "../utils/arrays";
import { corners2Path, fixLatLngForMercator, maidenhead2Corners } from "../utils/locator";
import { latlng2coord } from "../utils/polygon";
import { useFilteredQsos } from "./filters";
import { Map } from "./osm-map/map";
import { Path } from "./osm-map/path";

export const GridMap = () => {
    const qsos = useFilteredQsos();

    return (
        <Map height={400} width={640} interactive>
            {unique(qsos.filter((q) => !!q.locator).map((q) => q.locator?.substring(0, 2))).map((loc) => {
                const [c1, c2] = maidenhead2Corners(loc as string, 2);
                return (
                    <Path
                        key={loc}
                        style={{ color: "white", fillcolor: "yellow", geodesic: true, weight: 1 }}
                        polygon={corners2Path(fixLatLngForMercator(c1), fixLatLngForMercator(c2)).map((ll) =>
                            latlng2coord(ll),
                        )}
                    />
                );
            })}
        </Map>
    );
};
