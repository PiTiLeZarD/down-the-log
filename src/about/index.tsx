import { Box, Button, ButtonText, Text } from '@gluestack-ui/themed';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import React from 'react';
import { RootStackParamList } from '../RootStack';

export type AboutProps = {} & NativeStackScreenProps<RootStackParamList, 'About'>;

export type AboutComponent = React.FC<AboutProps>;

export const About: AboutComponent = ({ navigation }): JSX.Element => {
    return (
        <Box>
            <Text>About</Text>
            <Button onPress={() => navigation.goBack()}>
                <ButtonText>Back</ButtonText>
            </Button>
        </Box>
    );
};