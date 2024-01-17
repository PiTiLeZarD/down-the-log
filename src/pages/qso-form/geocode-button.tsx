import React from "react";
import { useFormContext } from "react-hook-form";
import { View } from "react-native";
import { geocode } from "../../utils/geocode";
import { latlong2Maidenhead } from "../../utils/locator";
import { Button } from "../../utils/theme/components/button";
import { Typography } from "../../utils/theme/components/typography";

export type GeocodeButtonProps = {};

export type GeocodeButtonComponent = React.FC<GeocodeButtonProps>;

export const GeocodeButton: GeocodeButtonComponent = (): JSX.Element => {
    const { getValues, setValue } = useFormContext();
    const { qth } = getValues();
    return (
        <View>
            <Typography>&nbsp;</Typography>
            <Button
                endIcon="arrow-forward"
                onPress={() =>
                    geocode(qth).then((data) => {
                        if (data.length) {
                            setValue(
                                "locator",
                                latlong2Maidenhead({ latitude: +data[0].lat, longitude: +data[0].lon }),
                            );
                        }
                    })
                }
            />
        </View>
    );
};
