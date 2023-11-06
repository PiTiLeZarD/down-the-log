import { Text } from '@gluestack-ui/themed';
import React from 'react';
import { latlong2Maidenhead } from '../utils/locator';
import { useLocation } from '../utils/use-location';

export type LocationHeaderProps = {};

export type LocationHeaderComponent = React.FC<LocationHeaderProps>;

export const LocationHeader: LocationHeaderComponent = (): JSX.Element => {
    const location = useLocation();

    return <Text>My current grid square: {location ? latlong2Maidenhead(location.coords) : 'Waiting...'}</Text>;
};
