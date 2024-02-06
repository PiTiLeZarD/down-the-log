import React from "react";
import { useFormContext } from "react-hook-form";
import { geocode } from "../utils/geocode";
import { latlong2Maidenhead } from "../utils/locator";
import { Button } from "../utils/theme/components/button";
import { useSettings } from "../utils/use-settings";

export type GeocodeButtonProps = {};

export type GeocodeButtonComponent = React.FC<GeocodeButtonProps>;

export const GeocodeButton: GeocodeButtonComponent = (): JSX.Element => {
    const { getValues, setValue } = useFormContext();
    const { qth } = getValues();
    const settings = useSettings();
    if (!settings.geocodeMapsCoKey) return <></>;
    return (
        <Button
            endIcon="arrow-forward"
            onPress={() =>
                geocode(qth, settings.geocodeMapsCoKey as string).then((data) => {
                    if (data.length) {
                        setValue("locator", latlong2Maidenhead({ latitude: +data[0].lat, longitude: +data[0].lon }));
                    }
                })
            }
        />
    );
};
