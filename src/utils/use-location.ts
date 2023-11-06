import Device from 'expo-device';
import * as Location from 'expo-location';
import React from 'react';
import { Platform } from 'react-native';

export const useLocation = () => {
    const [location, setLocation] = React.useState<Location.LocationObject | null>(null);

    React.useEffect(() => {
        (async () => {
            if (Platform.OS === 'android' && !Device.isDevice) {
                throw new Error('Oops, this will not work on Snack in an Android Emulator. Try it on your device!');
            }
            const { status } = await Location.requestForegroundPermissionsAsync();
            if (status !== 'granted') {
                throw new Error('Permission to access location was denied');
            }
            const location = await Location.getCurrentPositionAsync({});
            setLocation(location);
        })();
    });

    return location;
};
