import React from "react";
import { maidenhead2Latlong } from "../utils/locator";
import { Button } from "../ui/button";

export type MapChipProps = {
    text?: string;
    locator?: string;
    zoom?: number;
};

export const MapChip = ({ text = "map", locator, zoom = 4 }: MapChipProps) => {
    const [buttonText, setButtonText] = React.useState<string>(text);

    const latlng = locator ? maidenhead2Latlong(locator) : undefined;
    const url =
        latlng &&
        `https://www.openstreetmap.org/?mlat=${latlng.latitude}&mlon=${latlng.longitude}#map=${zoom}/${latlng.latitude}/${latlng.longitude}`;
    const onPress = () => {
        setButtonText("Missing Location!");
        setTimeout(() => setButtonText(text), 1500);
    };
    return (
        <Button
            variant="chip"
            text={buttonText}
            colour={latlng ? "primary" : "grey"}
            {...(locator ? { url } : { onPress })}
        />
    );
};
