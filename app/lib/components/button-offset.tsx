import { PropsWithChildren } from "react";
import { Typography } from "../utils/theme/components/typography";
import { Stack } from "./stack";

export type ButtonOffsetProps = PropsWithChildren;

export const ButtonOffset = ({ children }: ButtonOffsetProps) => {
    return (
        <Stack>
            <Typography>&nbsp;</Typography>
            {children}
        </Stack>
    );
};
