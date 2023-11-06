import { Text } from '@gluestack-ui/themed';
import React from 'react';
import cqzones from '../data/cqzones';
import ituzones from '../data/ituzones';
import { LatLng, latlong2Maidenhead } from '../utils/locator';
import { decode } from '../utils/polydec';
import { Coord, includes } from '../utils/polygon';
import { useLocation } from '../utils/use-location';

const findZone = (zones: string[][], pos: LatLng): string =>
    (zones.map(([i, d]) => [i, decode(d)]).find(([id, coords]) => includes(coords as Coord[], pos)) || [
        'N/A',
    ])[0] as string;

export type LocationHeaderProps = {};

export type LocationHeaderComponent = React.FC<LocationHeaderProps>;

export const LocationHeader: LocationHeaderComponent = (): JSX.Element => {
    const location = useLocation();

    if (!location) return <Text>Looking for your location...</Text>;

    return (
        <Text>
            My current grid square: {latlong2Maidenhead(location.coords)} (CQ: {findZone(cqzones, location.coords)},
            ITU: {findZone(ituzones, location.coords)})
        </Text>
    );
};
