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
import { DateTime } from 'luxon';
import React from 'react';
import { RootStackParamList } from '../../RootStack';
import cqzones from '../../data/cqzones.json';
import dxcc from '../../data/dxcc.json';
import ituzones from '../../data/ituzones.json';
import { useStore } from '../../store';
import { Grid } from '../../utils/grid';
import { latlong2Maidenhead } from '../../utils/locator';
import { findZone } from '../../utils/polydec';
import { useLocation } from '../../utils/use-location';

const classes = {
    header: {
        backgroundColor: '$primary200',
        padding: 4,
    },
    text: {
        color: '$textDark800',
    },
};

export type LocationHeaderProps = {} & Pick<NativeStackScreenProps<RootStackParamList, 'Home'>, 'navigation'>;

export type LocationHeaderComponent = React.FC<LocationHeaderProps>;

export const LocationHeader: LocationHeaderComponent = ({ navigation }): JSX.Element => {
    const [time, setTime] = React.useState<DateTime>(DateTime.local());
    const setCurrentLocation = useStore((state) => state.setCurrentLocation);
    const location = useLocation();

    React.useEffect(() => {
        const timer = setInterval(() => {
            setTime(DateTime.local());
        }, 1000 * 60);
        return () => {
            clearInterval(timer);
        };
    }, []);

    React.useEffect(() => {
        if (location) setCurrentLocation(latlong2Maidenhead(location.coords));
    }, [location]);

    if (!location) return <Text>Looking for your location...</Text>;

    return (
        <HStack sx={classes.header}>
            <Box sx={{ flexGrow: 1 }}>
                <Grid container>
                    <Grid item xs={8}>
                        <VStack>
                            <Text sx={classes.text}>My current grid square: {latlong2Maidenhead(location.coords)}</Text>
                            <Text sx={classes.text}>
                                (CQ: {findZone(cqzones, location.coords)}, ITU: {findZone(ituzones, location.coords)},
                                DXCC: {findZone(dxcc, location.coords)})
                            </Text>
                        </VStack>
                    </Grid>
                    <Grid item xs={4}>
                        <Grid container>
                            <Grid item xs={12} sm={6}>
                                <Text sx={classes.text}>Local: {time.toFormat('HH:mm')}</Text>
                            </Grid>
                            <Grid item xs={12} sm={6}>
                                <Text sx={classes.text}>UTC: {time.toUTC().toFormat('HH:mm')}</Text>
                            </Grid>
                        </Grid>
                    </Grid>
                </Grid>
            </Box>
            <Menu
                placement="bottom left"
                trigger={(props) => (
                    <Button {...props}>
                        <ButtonIcon as={ThreeDotsIcon} />
                    </Button>
                )}
            >
                <MenuItem key="About" textValue="About" onPress={() => navigation.navigate('About')}>
                    <Icon as={InfoIcon} size="sm" mr="$2" />
                    <MenuItemLabel size="sm">About</MenuItemLabel>
                </MenuItem>
            </Menu>
        </HStack>
    );
};
