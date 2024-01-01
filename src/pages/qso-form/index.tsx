import { DrawerScreenProps } from "@react-navigation/drawer";
import React, { useEffect } from "react";
import { FormProvider, useForm } from "react-hook-form";
import { NavigationParamList } from "../../Navigation";
import { useStore } from "../../store";
import { QSO, useQsos } from "../../utils/qso";
import { useAutoSave } from "../../utils/use-auto-save";
import { FormFields } from "./form-fields";

export type QsoFormProps = {} & DrawerScreenProps<NavigationParamList, "QsoForm">;

export type QsoFormComponent = React.FC<QsoFormProps>;

export const QsoForm: QsoFormComponent = ({ navigation, route }): JSX.Element => {
    const { qsoId } = route.params;
    const qso = useQsos().find((q) => q.id == qsoId);
    const log = useStore((state) => state.log);

    const methods = useForm<QSO>({
        defaultValues: qso,
    });
    useEffect(() => methods.reset(qso), [qsoId]);
    useAutoSave(methods.control, log);

    if (!qso) return <></>;
    return (
        <FormProvider {...methods}>
            <FormFields qso={qso} navigation={navigation} />
        </FormProvider>
    );
};
