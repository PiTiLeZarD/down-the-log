import { useRouter } from "expo-router";

export const useGoBack = () => {
    const { navigate, canGoBack, back } = useRouter();
    return () => {
        if (canGoBack()) back();
        else navigate("/");
    };
};
