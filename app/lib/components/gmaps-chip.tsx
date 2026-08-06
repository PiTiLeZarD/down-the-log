import React from "react";
import { maidenhead2Latlong } from "../utils/locator";
import { Button } from "../ui/button";

export type GmapsChipProps = {
    text?: string;
    locator?: string;
    zoom?: number;
};

export const GmapsChip = ({ text = "gmaps", locator, zoom = 4 }: GmapsChipProps) => {
    const [buttonText, setButtonText] = React.useState<string>(text);

    const latlng = locator ? maidenhead2Latlong(locator) : undefined;
    const url =
        latlng &&
        `https://www.google.com/maps/place/${latlng.latitude}+${latlng.longitude}/@${latlng.latitude},${latlng.longitude},${zoom}z?entry=ttu`;
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
