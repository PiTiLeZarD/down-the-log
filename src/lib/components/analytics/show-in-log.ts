import { useRouter } from "expo-router";
import { AwardKey } from "../../utils/awards";
import { useStore } from "../../utils/store";
import { QsoFilter, dxcc2label } from "../filters";

const filterFor = (award: AwardKey, id: string): QsoFilter =>
    ({
        dxcc: { name: "dxcc", values: [dxcc2label(+id)] },
        wac: { name: "continent", values: [id] },
        waz: { name: "cq", values: [id] },
        itu: { name: "itu", values: [id] },
        was: { name: "wasState", values: [id] },
        wavkca: { name: "vkCallArea", values: [id] },
    })[award];

/** Opens the log on one unit's QSOs, replacing whatever filters were set. */
export const useShowInLog = (award: AwardKey) => {
    const updateFilters = useStore((state) => state.updateFilters);
    const { navigate } = useRouter();
    return (id: string) => {
        updateFilters([filterFor(award, id)]);
        navigate("/");
    };
};
