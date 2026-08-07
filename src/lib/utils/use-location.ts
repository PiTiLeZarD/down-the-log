import { isDevice } from "expo-device";
import * as Location from "expo-location";
import React from "react";
import { Platform } from "react-native";
import { maidenhead2Latlong } from "./locator";

export const useLocation = (staticGridsquare?: string) => {
    const [gpsLocation, setGpsLocation] = React.useState<Location.LocationObject | null>(null);

    // A gridsquare in the settings is a plain derivation, no effect needed.
    const staticLocation = React.useMemo<Location.LocationObject | null>(() => {
        if (!staticGridsquare || staticGridsquare.length < 6) return null;
        const pos = maidenhead2Latlong(staticGridsquare);
        return {
            coords: {
                latitude: pos.latitude,
                longitude: pos.longitude,
                altitude: null,
                accuracy: null,
                altitudeAccuracy: null,
                heading: null,
                speed: null,
            },
            // A gridsquare out of the settings isn't a fix taken at a point in time, so there's no
            // timestamp to report. Reading a clock here would make the render impure anyway.
            timestamp: 0,
        };
    }, [staticGridsquare]);

    React.useEffect(() => {
        if (staticGridsquare) return;

        let cancelled = false;
        (async () => {
            if (Platform.OS === "android" && !isDevice) {
                throw new Error("Oops, this will not work on Snack in an Android Emulator. Try it on your device!");
            }
            const { status } = await Location.requestForegroundPermissionsAsync();
            if (status !== "granted") {
                throw new Error("Permission to access location was denied");
            }
            const location = await Location.getCurrentPositionAsync({});
            if (!cancelled) setGpsLocation(location);
        })();

        return () => {
            cancelled = true;
        };
    }, [staticGridsquare]);

    return staticGridsquare ? staticLocation : gpsLocation;
};
