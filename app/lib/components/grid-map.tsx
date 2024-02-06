import React from "react";
import { unique } from "../utils/arrays";
import { corners2Path, fixLatLngForStaticMaps, maidenhead2Corners } from "../utils/locator";
import { latlng2coord } from "../utils/polygon";
import { useStore } from "../utils/store";
import { useSettings } from "../utils/use-settings";
import { filterQsos } from "./filters";
import { Map } from "./google-static-map/map";
import { Path } from "./google-static-map/path";
import { useQsos } from "./qso";

export type GridMapProps = {};

export type GridMapComponent = React.FC<GridMapProps>;

export const GridMap: GridMapComponent = (): JSX.Element => {
    const filters = useStore((state) => state.filters);
    const qsos = filterQsos(useQsos(), filters);
    const { google } = useSettings();

    if (!google || !(google.key && google.secret)) return <></>;

    return (
        <Map height={400} width={640} google={google}>
            {unique(qsos.filter((q) => !!q.locator).map((q) => q.locator?.substring(0, 2))).map((loc) => {
                const [c1, c2] = maidenhead2Corners(loc as string, 2);
                return (
                    <Path
                        key={loc}
                        style={{ color: "white", fillcolor: "yellow", geodesic: true, weight: 1 }}
                        polygon={corners2Path(fixLatLngForStaticMaps(c1), fixLatLngForStaticMaps(c2)).map((ll) =>
                            latlng2coord(ll),
                        )}
                    />
                );
            })}
        </Map>
    );
};
