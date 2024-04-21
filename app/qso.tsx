import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect } from "react";
import { FormProvider, useForm } from "react-hook-form";
import { FormFields } from "./lib/components/form/form-fields";
import { QSO, useQsos } from "./lib/components/qso";
import { useStore } from "./lib/utils/store";
import { useAutoSave } from "./lib/utils/use-auto-save";

export type QsoProps = {};

export type QsoComponent = React.FC<QsoProps>;

const Qso: QsoComponent = (): JSX.Element => {
    const { navigate } = useRouter();
    const { qsoId } = useLocalSearchParams();
    const qso = useQsos().find((q) => q.id == qsoId);
    const log = useStore((state) => state.log);

    const methods = useForm<QSO>({
        defaultValues: qso,
    });
    useEffect(() => methods.reset(qso), [qsoId]);
    useAutoSave(methods.control, log);

    if (!qso) {
        navigate("/");
        return <></>;
    }
    return (
        <FormProvider {...methods}>
            <FormFields qso={qso} />
        </FormProvider>
    );
};

export default Qso;
