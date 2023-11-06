import {
    Box,
    Button,
    ButtonIcon,
    HStack,
    Icon,
    InfoIcon,
    Menu,
    MenuItem,
    MenuItemLabel,
    Text,
    ThreeDotsIcon,
    VStack,
} from '@gluestack-ui/themed';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import React from 'react';
import { RootStackParamList } from '../RootStack';
import cqzones from '../data/cqzones';
import ituzones from '../data/ituzones';
import { Grid } from '../utils/grid';
import { LatLng, latlong2Maidenhead } from '../utils/locator';
import { decode } from '../utils/polydec';
import { Coord, includes } from '../utils/polygon';
import { useLocation } from '../utils/use-location';

const findZone = (zones: string[][], pos: LatLng): string =>
    (zones.map(([i, d]) => [i, decode(d)]).find(([id, coords]) => includes(coords as Coord[], pos)) || [
        'N/A',
    ])[0] as string;

export type LocationHeaderProps = {} & Pick<NativeStackScreenProps<RootStackParamList, 'Home'>, 'navigation'>;

export type LocationHeaderComponent = React.FC<LocationHeaderProps>;

export const LocationHeader: LocationHeaderComponent = ({ navigation }): JSX.Element => {
    const location = useLocation();

    if (!location) return <Text>Looking for your location...</Text>;

    return (
        <HStack>
            <Box sx={{ flexGrow: 1 }}>
                <HStack>
                    <Box sx={{ flex: 1 }}>
                        <VStack>
                            <Text>My current grid square: {latlong2Maidenhead(location.coords)}</Text>
                            <Text>
                                (CQ: {findZone(cqzones, location.coords)}, ITU: {findZone(ituzones, location.coords)})
                            </Text>
                        </VStack>
                    </Box>
                    <Box sx={{ flex: 1 }}>
                        <Grid container>
                            <Grid item xs={12} sm={6}>
                                <Text>Time local</Text>
                            </Grid>
                            <Grid item xs={12} sm={6}>
                                <Text>Time UTC</Text>
                            </Grid>
                        </Grid>
                    </Box>
                </HStack>
            </Box>
            <Menu
                placement="bottom left"
                trigger={(props) => (
                    <Button {...props}>
                        <ButtonIcon as={ThreeDotsIcon} />
                    </Button>
                )}
                onSelectionChange={(e) => alert(e)}
            >
                <MenuItem
                    key="About"
                    textValue="About"
                    onPress={() => {
                        alert('here');
                        navigation.navigate('About');
                    }}
                >
                    <Icon as={InfoIcon} size="sm" mr="$2" />
                    <MenuItemLabel size="sm">About</MenuItemLabel>
                </MenuItem>
            </Menu>
        </HStack>
    );
};
