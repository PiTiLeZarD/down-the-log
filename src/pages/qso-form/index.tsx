import { NativeStackScreenProps } from "@react-navigation/native-stack";
import React from "react";
import { useForm } from "react-hook-form";
import { Button, ScrollView, View } from "react-native";
import { RootStackParamList } from "../../RootStack";
import { freq2band } from "../../data/bands";
import { useStore } from "../../store";
import { FormField } from "../../utils/form-field";
import { Grid } from "../../utils/grid";
import { QSO, useQsos } from "../../utils/qso";
import { Typography } from "../../utils/theme/components/typography";

export type QsoFormProps = {} & NativeStackScreenProps<RootStackParamList, "QsoForm">;

export type QsoFormComponent = React.FC<QsoFormProps>;

export const QsoForm: QsoFormComponent = ({ navigation, route }): JSX.Element => {
    const { qsoId } = route.params;
    const qso = useQsos().filter((q) => q.id == qsoId)[0];
    const log = useStore((state) => state.log);
    const deleteLog = useStore((state) => state.deleteLog);

    const { handleSubmit, control, watch } = useForm<QSO>({
        defaultValues: qso,
    });

    const freq = watch("frequency");

    const onSubmit = (qso: QSO) => {
        log(qso);
        navigation.navigate("Home");
    };

    const onDelete = () => {
        deleteLog(qso);
        navigation.navigate("Home");
    };

    return (
        <ScrollView>
            <Button title="Back" onPress={() => navigation.navigate("Home")} />
            <Grid container>
                <Grid item xs={12} sm={6}>
                    <FormField name="callsign" label="Callsign:" control={control} />
                </Grid>
                <Grid item xs={12} sm={6}>
                    <FormField name="name" label="Name:" control={control} />
                </Grid>
            </Grid>
            <Grid container>
                <Grid item xs={12} sm={3}>
                    <FormField
                        role="select"
                        name="mode"
                        label="Mode:"
                        options={{ SSB: "SSB", AM: "AM", FM: "FM", CW: "CW" }}
                        control={control}
                    />
                </Grid>
                <Grid item xs={8} sm={4}>
                    <FormField name="frequency" label="Frequency:" control={control} placeholder="In Khz" />
                </Grid>
                <Grid item xs={4} sm={2}>
                    <Typography>Band:</Typography>
                    <Typography>{freq2band(freq) || "N/A"}</Typography>
                </Grid>
                <Grid item xs={12} sm={3}>
                    <FormField name="power" label="Power:" control={control} />
                </Grid>
            </Grid>
            <Grid container>
                <Grid item xs={12} sm={6}>
                    <FormField name="qth" label="QTH:" control={control} />
                </Grid>
                <Grid item xs={12} sm={6}>
                    <FormField name="locator" label="Locator:" control={control} />
                </Grid>
            </Grid>
            <FormField role="textarea" name="note" label="Note:" control={control} />
            <View>
                <Button title="Submit" onPress={handleSubmit(onSubmit)} />
                <Button title="Delete" onPress={() => onDelete()} />
            </View>
        </ScrollView>
    );
};
