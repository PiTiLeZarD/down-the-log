import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useEffectEvent } from "react";
import { FormProvider, useForm } from "react-hook-form";
import { FormFields } from "../lib/components/form/form-fields";
import { QSO, useQsos } from "../lib/components/qso";
import { useStore } from "../lib/utils/store";
import { useAutoSave } from "../lib/utils/use-auto-save";

const Qso = () => {
    const { navigate } = useRouter();
    const { qsoId } = useLocalSearchParams();
    const qso = useQsos().find((q) => q.id == qsoId);
    const log = useStore((state) => state.log);

    const methods = useForm<QSO>({
        defaultValues: qso,
    });
    // Only navigating to another QSO reloads the form; edits to the one on screen must not.
    const loadQso = useEffectEvent(() => methods.reset(qso));
    useEffect(() => loadQso(), [qsoId]);
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
