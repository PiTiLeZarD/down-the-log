import React, { useEffect, useEffectEvent } from "react";
import { useFormContext } from "react-hook-form";
import { TextInput, View } from "react-native";
import { StyleSheet } from "react-native-unistyles";
import { baseCallsign } from "../../utils/callsign";
import { HamQTHCallsignData, useHamqth } from "../../utils/hamqth";
import { sessionDupeKey, sessionDupeKeys, sessionQsos } from "../../utils/session";
import { Alert } from "../../ui/alert";
import { Button } from "../../ui/button";
import { Input } from "../../ui/input";
import { Typography } from "../../ui/typography";
import { useActiveSession } from "../../utils/use-session";
import { useSettings } from "../../utils/use-settings";
import { QSO, useQsos } from "../qso";
import { SessionStartButton } from "../session/session-start-button";
import { Stack } from "../stack";
import { BandFreqInput } from "./band-freq-input";
import { useCallsignFocus } from "./callsign-focus";
import { CallsignInputExtra } from "./callsign-input-extra";
import { Events } from "./events";
import { FormField } from "./form-field";
import { HamQTHBadge } from "./hamqth-badge";
import { ModeInput } from "./mode-input";
import { Signal } from "./signal";

const styles = StyleSheet.create((theme) => ({
    inputBox: {
        backgroundColor: theme.colours.primary.light,
        borderTopColor: theme.colours.primary.darker,
        borderTopWidth: theme.margins.sm,
        borderTopStyle: "solid",
        padding: theme.margins.md,
    },
    input: {
        backgroundColor: theme.background,
    },
}));

export type CallsignInputProps = {
    handleAdd: () => void;
};

export const CallsignInput = ({ handleAdd }: CallsignInputProps) => {
    const qsos = useQsos();
    const { watch, setValue } = useFormContext<QSO>();
    const { inputBarConfig } = useSettings();
    const session = useActiveSession();

    const callsign = watch("callsign");
    const band = watch("band");
    const mode = watch("mode");

    // Worked-before is only interesting within the session that's running — the same station on the
    // same band and mode. Indexed once per session so typing a callsign isn't a scan of the log.
    const dupeKeys = React.useMemo(() => sessionDupeKeys(sessionQsos(qsos, session)), [qsos, session]);
    const isDupe = !!session && !!callsign && dupeKeys.has(sessionDupeKey({ callsign, band, mode }));
    const previousQso = qsos.filter((q) => baseCallsign(q.callsign) === baseCallsign(callsign));
    const hamqth = useHamqth(callsign);
    let hamqthCSData: Partial<HamQTHCallsignData> | undefined = hamqth.data;
    if ((previousQso || []).length) {
        hamqthCSData = {
            callsign,
            qth: previousQso[0].qth,
            name: previousQso[0].name,
            country: previousQso[0].country,
            itu: previousQso[0].ituzone,
            cq: previousQso[0].cqzone,
            grid: previousQso[0].locator,
        } as any;
    }

    const fillFromLookup = useEffectEvent(() => {
        if (hamqthCSData && hamqthCSData.callsign == baseCallsign(callsign)) {
            setValue("name", hamqthCSData.name);
            setValue("qth", hamqthCSData.qth);
            setValue("locator", hamqthCSData.grid);
        }
    });
    useEffect(() => fillFromLookup(), [hamqthCSData]);

    // Coming back from a QSO page, this screen is still being brought forward when the request
    // lands, and focusing a card that isn't visible yet does nothing — hence the frame of slack.
    const inputRef = React.useRef<TextInput>(null);
    const focusRequest = useCallsignFocus((state) => state.requested);
    useEffect(() => {
        if (!focusRequest) return;
        const timer = setTimeout(() => {
            inputRef.current?.focus();
            // Selecting what's there means the next callsign typed replaces a carried-over one
            // instead of appending to it. DOM-only, hence the guarded call.
            (inputRef.current as any)?.select?.();
        }, 50);
        return () => clearTimeout(timer);
    }, [focusRequest]);

    return (
        <Stack style={styles.inputBox}>
            <CallsignInputExtra value={callsign} hamqthCSData={hamqthCSData} />
            {/* A warning, never a block: a second contact can be perfectly valid, and the operator
                is the one who knows the rules of what they're in. */}
            {isDupe && (
                <Alert severity="warning">
                    <Typography>
                        {callsign} already worked in this session on {band} {mode}
                    </Typography>
                </Alert>
            )}
            <Stack direction="row" gap="xxl">
                <SessionStartButton />
                {inputBarConfig.includes("sig") && (
                    <View>
                        <Events />
                    </View>
                )}
                {inputBarConfig.includes("mode") && <ModeInput noLabel />}
                {inputBarConfig.includes("frequency") && <BandFreqInput noLabel />}
                <View style={{ flexGrow: 1 }}>
                    <Input
                        ref={inputRef}
                        value={callsign}
                        style={styles.input}
                        transformValue={(v) => v.toUpperCase()}
                        onChangeText={(v) => setValue("callsign", v)}
                        onKeyPress={(e: any) => {
                            if (e.keyCode === 13) handleAdd();
                        }}
                        placeholder="Callsign"
                        // Undefined rather than an idle badge: any suffix at all makes `Input` draw
                        // the chip chrome and flatten the field's right border.
                        suffix={hamqth.status === "idle" ? undefined : <HamQTHBadge status={hamqth.status} />}
                    />
                </View>
                {inputBarConfig.includes("name") && <FormField name="name" style={styles.input} placeholder="Name" />}
                {inputBarConfig.includes("qth") && <FormField name="qth" style={styles.input} placeholder="QTH" />}
                {inputBarConfig.includes("rst_received") && (
                    <View>
                        {session?.plainRst && (
                            <FormField name="rst_received" style={styles.input} placeholder="RST rcvd" />
                        )}
                        {!session?.plainRst && <Signal field="rst_received" />}
                    </View>
                )}
                {inputBarConfig.includes("rst_sent") && (
                    <View>
                        {session?.plainRst && <FormField name="rst_sent" style={styles.input} placeholder="RST sent" />}
                        {!session?.plainRst && <Signal field="rst_sent" />}
                    </View>
                )}
                {/* The exchange isn't part of the customisable input bar: in a contest it's the whole
                    point of the QSO, and outside one there's nothing to show. */}
                {session?.contest && (
                    <>
                        <View>
                            <Typography variant="em">#{String(session.contest.serial).padStart(3, "0")}</Typography>
                        </View>
                        <View>
                            <FormField name="srx" style={styles.input} placeholder="Serial rcvd" numeric />
                        </View>
                        <View>
                            <FormField name="srxString" style={styles.input} placeholder="Exch rcvd" />
                        </View>
                    </>
                )}
                <View>
                    <Button onPress={() => handleAdd()} startIcon="add" />
                </View>
            </Stack>
        </Stack>
    );
};
