import React from "react";
import { findCountry, getCallsignData, parseCallsign } from "../utils/callsign";
import { Button } from "../utils/theme/components/button";

export type QrzChipProps = {
    callsign: string;
    textIsCallsign?: boolean;
    includeFlag?: boolean;
};

export type QrzChipComponent = React.FC<QrzChipProps>;

export const QrzChip: QrzChipComponent = ({ callsign, textIsCallsign = false, includeFlag = false }): JSX.Element => {
    const parsed = parseCallsign(callsign);
    return (
        <Button
            text={
                textIsCallsign
                    ? includeFlag
                        ? `${findCountry(getCallsignData(callsign))?.flag} ${callsign}`
                        : callsign
                    : "QRZ"
            }
            variant="chip"
            url={`https://www.qrz.com/db/${parsed?.prefix}${parsed?.index}${parsed?.delineation}`}
        />
    );
};
