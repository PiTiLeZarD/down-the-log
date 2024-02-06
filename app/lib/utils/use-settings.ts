import { fixSettings, useStore } from "./store";

export const useSettings = () => {
    const settings = useStore((state) => state.settings);
    return fixSettings(settings);
};
