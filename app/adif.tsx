import React from "react";
import { Pressable, View } from "react-native";
import { useStyles } from "react-native-unistyles";
import { Export } from "./lib/components/adif/export";
import { Import } from "./lib/components/adif/import";
import { PageLayout } from "./lib/components/page-layout";
import { useQsos } from "./lib/components/qso";
import { Stack } from "./lib/components/stack";
import { TabsLayout } from "./lib/components/tabs-layout";
import { unique } from "./lib/utils/arrays";
import { useStore } from "./lib/utils/store";
import { Alert } from "./lib/utils/theme/components/alert";
import { Button } from "./lib/utils/theme/components/button";
import { Icon } from "./lib/utils/theme/components/icon";
import { Typography } from "./lib/utils/theme/components/typography";
import { fireSwal } from "./lib/utils/theme/swal";

export type AdifProps = {};

export type AdifComponent = React.FC<AdifProps>;

const Adif: AdifComponent = (): JSX.Element => {
    const { theme } = useStyles();
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
        fireSwal({
            theme,
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
                    <Button colour="secondary" text="Erase all qsos" onPress={handleErase} variant="outlined" />
                </View>
            </Stack>
        </PageLayout>
    );
};

export default Adif;
