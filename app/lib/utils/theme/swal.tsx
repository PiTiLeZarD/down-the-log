import Swal, { SweetAlertIcon } from "sweetalert2";
import { ThemeType } from "./theme";

export type SwalProps = {
    title: string;
    text: string;
    icon: SweetAlertIcon;
    confirmButtonText: string;
    theme: ThemeType;
};
export const fireSwal = ({ title, text, icon, confirmButtonText, theme }: SwalProps) => {
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
    });
};
