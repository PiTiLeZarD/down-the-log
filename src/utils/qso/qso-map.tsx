import React from "react";
import { QSO } from ".";
import { useStore } from "../../store";
import { Map } from "../google-static-map/map";
import { Marker } from "../google-static-map/marker";
import { Path } from "../google-static-map/path";
import { maidenhead2Latlong } from "../locator";

export type QsoMapProps = {
    qso: QSO;
};

export type QsoMapComponent = React.FC<QsoMapProps>;

export const QsoMap: QsoMapComponent = ({ qso }): JSX.Element => {
    const { google } = useStore((state) => state.settings);

    if (!google || !(google.key && google.secret)) return <></>;

    const from = maidenhead2Latlong(qso.myLocator as string);
    const to = maidenhead2Latlong(qso.locator as string);

    /**
     * Map to figure out center/zoom based on markers if not provided
     * Path to accept a polyline (and to encode it properly)
     */
    return (
        <Map height={200} google={google}>
            <Marker location={from} style={{ color: "blue", label: "A" }} />
            <Marker location={to} style={{ label: "B" }} />
            <Path from={from} to={to} style={{ geodesic: true }} />
        </Map>
    );
};
