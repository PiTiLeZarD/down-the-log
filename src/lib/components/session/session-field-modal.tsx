import React, { useEffectEvent } from "react";
import { FormProvider, useForm } from "react-hook-form";
import { View } from "react-native";
import { StyleSheet } from "react-native-unistyles";
import { Modal } from "../../utils/modal";
import { Session, sessionFieldLabel } from "../../utils/session";
import { useStore } from "../../utils/store";
import { Button } from "../../ui/button";
import { Typography } from "../../ui/typography";
import { QSO } from "../qso";
import { Stack } from "../stack";
import { SessionField } from "./session-field";

const styles = StyleSheet.create((theme) => ({
    body: {
        backgroundColor: theme.background,
        padding: theme.margins.lg,
        borderRadius: theme.margins.lg,
    },
}));

export type SessionFieldModalProps = {
    session: Session;
    // Which single default is being retuned. Absent closes the modal.
    field?: keyof QSO;
    onClose: () => void;
};

// Retuning one thing mid-activation — dropped to 5 W, swapped antenna — is the common edit, and it
// shouldn't mean opening the whole session editor.
export const SessionFieldModal = ({ session, field, onClose }: SessionFieldModalProps) => {
    const updateSession = useStore((state) => state.updateSession);
    const methods = useForm<QSO>({ defaultValues: session.defaults as QSO });

    // In an effect, not during render: `reset` notifies the fields subscribed to the form, and
    // firing that from a render pass updates them from inside this component's own.
    const reopen = useEffectEvent(() => methods.reset(session.defaults as QSO));
    React.useEffect(() => {
        if (field) reopen();
    }, [field]);

    const handleSave = () => {
        if (!field) return;
        const value = methods.getValues()[field];
        const { [field]: dropped, ...rest } = session.defaults;
        updateSession(session.id, {
            defaults: value === undefined || value === "" ? rest : { ...rest, [field]: value },
        });
        onClose();
    };

    return (
        <Modal open={!!field} onClose={onClose}>
            <View style={styles.body}>
                <Stack>
                    <Typography variant="h4">{field ? sessionFieldLabel(field) : ""}</Typography>
                    <FormProvider {...methods}>{field && <SessionField field={field} />}</FormProvider>
                    <Stack direction="row">
                        <View style={{ flexGrow: 1 }}>
                            <Button colour="success" text="OK" onPress={handleSave} />
                        </View>
                        <View style={{ flexGrow: 1 }}>
                            <Button variant="outlined" colour="grey" text="Cancel" onPress={onClose} />
                        </View>
                    </Stack>
                </Stack>
            </View>
        </Modal>
    );
};
