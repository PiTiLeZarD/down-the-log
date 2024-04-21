import Swal, { SweetAlertIcon, SweetAlertResult } from "sweetalert2";
import { ThemeType } from "./theme";

export type SwalProps = {
    title: string;
    text: string;
    icon: SweetAlertIcon;
    confirmButtonText: string;
    cancelButtonText?: string;
    onResult?: (result: SweetAlertResult) => void;
    theme: ThemeType;
};
export const fireSwal = ({
    title,
    text,
    icon,
    confirmButtonText,
    cancelButtonText,
    onResult = () => {},
    theme,
}: SwalProps) => {
    const SwalTheme = {
        confirmButtonColor: theme.colours.primary[theme.shades.dark],
        denyButtonColor: theme.colours.secondary[theme.shades.dark],
        cancelButtonColor: theme.colours.grey[theme.shades.dark],
    };
    Swal.fire({
        ...SwalTheme,
        title,
        text,
        icon,
        confirmButtonText,
        cancelButtonText,
        showCancelButton: cancelButtonText !== undefined,
    }).then(onResult);
};
