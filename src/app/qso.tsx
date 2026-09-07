import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useEffectEvent } from "react";
import { FormProvider, useForm } from "react-hook-form";
import { FormFields } from "../lib/components/form/form-fields";
import { QSO, useQsos, withBand } from "../lib/components/qso";
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
    // Retuning this QSO moves its band with it: the form only sets a frequency now, so the band is
    // caught up on the way to the store rather than being a second field to keep in step.
    useAutoSave(methods.control, (edited: QSO) => log(withBand(edited)));

    // Deep-linking a stale qsoId, or having this QSO deleted from under the page, leaves nothing to
    // edit. Bouncing back to the log is a router write, so it belongs in an effect: done in the
    // render body it warns about updating a component mid-render and can fire twice under Strict
    // Mode.
    useEffect(() => {
        if (!qso) navigate("/");
    }, [qso, navigate]);

    if (!qso) return <></>;
    return (
        <FormProvider {...methods}>
            <FormFields qso={qso} />
        </FormProvider>
    );
};

export default Qso;
