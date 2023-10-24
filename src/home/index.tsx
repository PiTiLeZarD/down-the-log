import { ButtonText } from '@gluestack-ui/themed';

import { Box, Button, Text } from '@gluestack-ui/themed';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import React from 'react';
import { RootStackParamList } from '../RootStack';
const classes: Record<string, object> = {
    container: {
        display: 'flex',
        width: '100%',
        height: '100%',
    },
    table: {
        flexGrow: 1,
    },
};
export type HomeProps = {} & NativeStackScreenProps<RootStackParamList, 'Home'>;
export type HomeComponent = React.FC<HomeProps>;
export const Home: HomeComponent = ({ navigation }): JSX.Element => {
    return (
        <Box sx={classes.container}>
            <Box sx={classes.top}>
                <Text>
                    Here the top part{' '}
                    <Button onPress={() => navigation.navigate('About')}>
                        <ButtonText>About</ButtonText>
                    </Button>
                </Text>
            </Box>
            <Box sx={classes.table}>
                <table>
                    <thead>
                        <tr>
                            <th>ID</th>
                            <th>Band</th>
                            <th>CallSign</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td>1</td>
                            <td>20m</td>
                            <td>VK4ALE</td>
                        </tr>
                        <tr>
                            <td>2</td>
                            <td>20m</td>
                            <td>VK4ALE</td>
                        </tr>
                        <tr>
                            <td>3</td>
                            <td>20m</td>
                            <td>VK4ALE</td>
                        </tr>
                        <tr>
                            <td>4</td>
                            <td>20m</td>
                            <td>VK4ALE</td>
                        </tr>
                        <tr>
                            <td>5</td>
                            <td>20m</td>
                            <td>VK4ALE</td>
                        </tr>
                        <tr>
                            <td>6</td>
                            <td>20m</td>
                            <td>VK4ALE</td>
                        </tr>
                        <tr>
                            <td>7</td>
                            <td>20m</td>
                            <td>VK4ALE</td>
                        </tr>
                        <tr>
                            <td>8</td>
                            <td>20m</td>
                            <td>VK4ALE</td>
                        </tr>
                        <tr>
                            <td>9</td>
                            <td>20m</td>
                            <td>VK4ALE</td>
                        </tr>
                        <tr>
                            <td>10</td>
                            <td>20m</td>
                            <td>VK4ALE</td>
                        </tr>
                        <tr>
                            <td>11</td>
                            <td>20m</td>
                            <td>VK4ALE</td>
                        </tr>
                        <tr>
                            <td>12</td>
                            <td>20m</td>
                            <td>VK4ALE</td>
                        </tr>
                        <tr>
                            <td>13</td>
                            <td>20m</td>
                            <td>VK4ALE</td>
                        </tr>
                        <tr>
                            <td>14</td>
                            <td>20m</td>
                            <td>VK4ALE</td>
                        </tr>
                        <tr>
                            <td>15</td>
                            <td>20m</td>
                            <td>VK4ALE</td>
                        </tr>
                        <tr>
                            <td>16</td>
                            <td>20m</td>
                            <td>VK4ALE</td>
                        </tr>
                        <tr>
                            <td>17</td>
                            <td>20m</td>
                            <td>VK4ALE</td>
                        </tr>
                        <tr>
                            <td>18</td>
                            <td>20m</td>
                            <td>VK4ALE</td>
                        </tr>
                        <tr>
                            <td>19</td>
                            <td>20m</td>
                            <td>VK4ALE</td>
                        </tr>
                        <tr>
                            <td>20</td>
                            <td>20m</td>
                            <td>VK4ALE</td>
                        </tr>
                        <tr>
                            <td>21</td>
                            <td>20m</td>
                            <td>VK4ALE</td>
                        </tr>
                        <tr>
                            <td>22</td>
                            <td>20m</td>
                            <td>VK4ALE</td>
                        </tr>
                        <tr>
                            <td>23</td>
                            <td>20m</td>
                            <td>VK4ALE</td>
                        </tr>
                        <tr>
                            <td>24</td>
                            <td>20m</td>
                            <td>VK4ALE</td>
                        </tr>
                        <tr>
                            <td>25</td>
                            <td>20m</td>
                            <td>VK4ALE</td>
                        </tr>
                        <tr>
                            <td>26</td>
                            <td>20m</td>
                            <td>VK4ALE</td>
                        </tr>
                        <tr>
                            <td>27</td>
                            <td>20m</td>
                            <td>VK4ALE</td>
                        </tr>
                        <tr>
                            <td>28</td>
                            <td>20m</td>
                            <td>VK4ALE</td>
                        </tr>
                        <tr>
                            <td>29</td>
                            <td>20m</td>
                            <td>VK4ALE</td>
                        </tr>
                    </tbody>
                </table>
            </Box>
            <Box sx={classes.inputs}>
                <Text>Here the input</Text>
            </Box>
        </Box>
    );
};
