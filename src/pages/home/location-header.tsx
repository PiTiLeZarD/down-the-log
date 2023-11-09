import {
    Button,
    ButtonIcon,
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
import { RootStackParamList } from '../../RootStack';
import cqzones from '../../data/cqzones.json';
import dxcc from '../../data/dxcc.json';
import ituzones from '../../data/ituzones.json';
import { useStore } from '../../store';
import { Grid } from '../../utils/grid';
import { maidenhead2Latlong } from '../../utils/locator';
import { findZone } from '../../utils/polydec';

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
    const currentLocation = useStore((state) => state.currentLocation);

    if (!currentLocation) return <Text>Looking for your location...</Text>;

    return (
        <Grid container sx={classes.header as any}>
            <Grid item xs={10} sm={11}>
                <VStack>
                    <Text sx={classes.text}>Locator: {currentLocation}</Text>
                    <Text sx={classes.text}>
                        (CQ: {findZone(cqzones, maidenhead2Latlong(currentLocation))}, ITU:{' '}
                        {findZone(ituzones, maidenhead2Latlong(currentLocation))}, DXCC:{' '}
                        {findZone(dxcc, maidenhead2Latlong(currentLocation))})
                    </Text>
                </VStack>
            </Grid>
            <Grid item xs={2} sm={1}>
                <Menu
                    placement="bottom left"
                    trigger={(props) => (
                        <Button {...props}>
                            <ButtonIcon as={ThreeDotsIcon} />
                        </Button>
                    )}
                >
                    <MenuItem key="About" textValue="About" onPressOut={() => navigation.navigate('About')}>
                        <Icon as={InfoIcon} size="sm" mr="$2" />
                        <MenuItemLabel size="sm">About</MenuItemLabel>
                    </MenuItem>
                </Menu>
            </Grid>
        </Grid>
    );
};
