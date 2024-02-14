import React from "react";
import { Modal as RNModal, View } from "react-native";
import { createStyleSheet, useStyles } from "react-native-unistyles";
import { Grid } from "../components/grid";

const stylesheet = createStyleSheet((theme) => ({
    container: {
        backgroundColor: theme.background,
        flex: 1,
    },
}));

export type ModalProps = {
    open: boolean;
    wide?: boolean;
    onClose: () => void;
};

export type ModalComponent = React.FC<React.PropsWithChildren<ModalProps>>;

export const Modal: ModalComponent = ({ open, wide, onClose, children }): JSX.Element => {
    const { styles } = useStyles(stylesheet);
    return (
        <RNModal animationType="none" visible={open} onRequestClose={onClose} transparent>
            <View style={styles.container}>
                <Grid container>
                    <Grid
                        item
                        {...(wide ? { xs: -1, md: 1, lg: 2, xl: 3, xxl: 4 } : { xs: 1, md: 2, lg: 3, xl: 4, xxl: 5 })}
                    />
                    <Grid
                        item
                        {...(wide ? { xs: 12, md: 10, lg: 8, xl: 6, xxl: 4 } : { xs: 10, md: 8, lg: 6, xl: 4, xxl: 2 })}
                    >
                        {children}
                    </Grid>
                    <Grid
                        item
                        {...(wide ? { xs: -1, md: 1, lg: 2, xl: 3, xxl: 4 } : { xs: 1, md: 2, lg: 3, xl: 4, xxl: 5 })}
                    />
                </Grid>
            </View>
        </RNModal>
    );
};
