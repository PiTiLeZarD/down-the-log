import Device from "expo-device";
import * as Location from "expo-location";
import React from "react";
import { Platform } from "react-native";
import { maidenhead2Latlong } from "./locator";

export const useLocation = (staticGridsquare?: string) => {
    const [location, setLocation] = React.useState<Location.LocationObject | null>(null);

    React.useEffect(() => {
        if (staticGridsquare) {
            if (staticGridsquare.length >= 6) {
                const pos = maidenhead2Latlong(staticGridsquare);
                setLocation({
                    coords: {
                        latitude: pos.latitude,
                        longitude: pos.longitude,
                        altitude: null,
                        accuracy: null,
                        altitudeAccuracy: null,
                        heading: null,
                        speed: null,
                    },
                    timestamp: new Date().getMilliseconds(),
                });
            }
        } else {
            (async () => {
                if (Platform.OS === "android" && !Device.isDevice) {
                    throw new Error("Oops, this will not work on Snack in an Android Emulator. Try it on your device!");
                }
                const { status } = await Location.requestForegroundPermissionsAsync();
                if (status !== "granted") {
                    throw new Error("Permission to access location was denied");
                }
                const location = await Location.getCurrentPositionAsync({});
                setLocation(location);
            })();
        }
    }, [staticGridsquare]);

    return location;
};
