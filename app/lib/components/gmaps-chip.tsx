import React from "react";
import { maidenhead2Latlong } from "../utils/locator";
import { Button } from "../utils/theme/components/button";

export type GmapsChipProps = {
    text?: string;
    locator?: string;
    zoom?: number;
};

export type GmapsChipComponent = React.FC<GmapsChipProps>;

export const GmapsChip: GmapsChipComponent = ({ text = "gmaps", locator, zoom = 4 }): JSX.Element => {
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
