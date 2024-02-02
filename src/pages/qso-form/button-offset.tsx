import React from "react";
import { Stack } from "../../utils/stack";
import { Typography } from "../../utils/theme/components/typography";

export type ButtonOffsetProps = {};

export type ButtonOffsetComponent = React.FC<React.PropsWithChildren<ButtonOffsetProps>>;

export const ButtonOffset: ButtonOffsetComponent = ({ children }): JSX.Element => {
    return (
        <Stack>
            <Typography>&nbsp;</Typography>
            {children}
        </Stack>
    );
};
