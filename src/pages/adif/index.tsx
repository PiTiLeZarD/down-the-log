import { StackScreenProps } from "@react-navigation/stack";
import React from "react";
import { Pressable, View } from "react-native";
import Swal from "sweetalert2";
import { NavigationParamList } from "../../Navigation";
import { useStore } from "../../store";
import { unique } from "../../utils/arrays";
import { PageLayout } from "../../utils/page-layout";
import { useQsos } from "../../utils/qso";
import { Stack } from "../../utils/stack";
import { TabsLayout } from "../../utils/tabs-layout";
import { Alert } from "../../utils/theme/components/alert";
import { Button } from "../../utils/theme/components/button";
import { Icon } from "../../utils/theme/components/icon";
import { Typography } from "../../utils/theme/components/typography";
import { SwalTheme } from "../../utils/theme/theme";
import { Export } from "./export";
import { Import } from "./import";

export type AdifProps = {} & StackScreenProps<NavigationParamList, "Adif">;

export type AdifComponent = React.FC<AdifProps>;

export const Adif: AdifComponent = (): JSX.Element => {
    const [showHoneypotDetails, setShowHoneypotDetails] = React.useState<boolean>(false);
    const resetStore = useStore((state) => state.resetStore);
    const qsos = useQsos();
    const honeypotFields = unique(
        qsos
            .map((q) => Object.keys(q.honeypot || {}))
            .flat()
            .filter((e) => !!e),
    );

    const handleErase = () => {
        resetStore();
        Swal.fire({
            ...SwalTheme,
            title: "Done!",
            text: "All records have been erased!",
            icon: "success",
            confirmButtonText: "Ok",
        });
    };

    return (
        <PageLayout title="Import/Export">
            <Stack>
                <Alert severity="info">
                    <Typography variant="em">
                        Import/Export is lossless, if this app doesn't handle an attribute, it'll keep it so you don't
                        lose it on export
                    </Typography>
                </Alert>
                {honeypotFields.length > 0 && (
                    <Alert>
                        <Stack>
                            <Pressable onPress={() => setShowHoneypotDetails(!showHoneypotDetails)}>
                                <Typography variant="em">
                                    <Icon name={showHoneypotDetails ? "arrow-up" : "arrow-down"} /> A number of fields
                                    imported aren't handled by this application
                                </Typography>
                            </Pressable>
                            {showHoneypotDetails && (
                                <>
                                    <Typography>
                                        if they are important to you, see the about section of this app to reach me,
                                        I'll add them to my todolist
                                    </Typography>
                                    {honeypotFields.map((f) => (
                                        <Typography key={f} variant="subtitle">
                                            <Icon name="arrow-forward" />
                                            {f}
                                        </Typography>
                                    ))}
                                </>
                            )}
                        </Stack>
                    </Alert>
                )}

                <TabsLayout tabs={["Export", "Import"]}>
                    <Export />
                    <Import />
                </TabsLayout>

                <View>
                    <Button colour="secondary" text="Erase all qsos" onPress={handleErase} />
                </View>
            </Stack>
        </PageLayout>
    );
};
