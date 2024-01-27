import React from "react";
import { maidenhead2Latlong } from "../../utils/locator";
import { Button } from "../../utils/theme/components/button";

export type GmapsChipProps = {
    locator?: string;
    zoom?: number;
};

export type GmapsChipComponent = React.FC<GmapsChipProps>;

export const GmapsChip: GmapsChipComponent = ({ locator, zoom = 4 }): JSX.Element => {
    const latlng = locator ? maidenhead2Latlong(locator) : undefined;
    const url = latlng
        ? `https://www.google.com/maps/place/${latlng.latitude}+${latlng.longitude}/@${latlng.latitude},${latlng.longitude},${zoom}z?entry=ttu`
        : undefined;
    return <Button variant="chip" text="gmaps" colour={latlng ? "primary" : "grey"} url={url} />;
};
