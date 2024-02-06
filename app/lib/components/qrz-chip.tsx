import React from "react";
import { parseCallsign } from "../utils/callsign";
import { Button } from "../utils/theme/components/button";

export type QrzChipProps = {
    callsign: string;
};

export type QrzChipComponent = React.FC<QrzChipProps>;

export const QrzChip: QrzChipComponent = ({ callsign }): JSX.Element => {
    const parsed = parseCallsign(callsign);
    return (
        <Button
            text="QRZ"
            variant="chip"
            url={`https://www.qrz.com/db/${parsed?.prefix}${parsed?.index}${parsed?.delineation}`}
        />
    );
};
