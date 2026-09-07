import { useFormContext } from "react-hook-form";
import { geocode } from "../utils/geocode";
import { showDialog } from "../ui/dialog";
import { latlong2Maidenhead } from "../utils/locator";
import { Button } from "../ui/button";
import { useSettings } from "../utils/use-settings";

export const GeocodeButton = () => {
    const { getValues, setValue } = useFormContext();
    const { qth } = getValues();
    const settings = useSettings();
    if (!settings.geocodeMapsCoKey) return <></>;
    return (
        <Button
            endIcon="arrow-forward"
            onPress={() =>
                geocode(qth, settings.geocodeMapsCoKey as string)
                    .then((data) => {
                        if (data.length) {
                            setValue(
                                "locator",
                                latlong2Maidenhead({ latitude: +data[0].lat, longitude: +data[0].lon }),
                            );
                        }
                    })
                    // A network failure or a bad key used to reject into nothing: the button just
                    // appeared not to work. Say so instead.
                    .catch(() =>
                        showDialog({
                            title: "Geocoding failed",
                            text: "Couldn't reach geocode.maps.co. Check your connection and your API key.",
                            icon: "error",
                            confirmButtonText: "Ok",
                        }),
                    )
            }
        />
    );
};
