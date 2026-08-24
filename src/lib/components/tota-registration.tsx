import { DateTime } from "luxon";
import React from "react";
import { Alert } from "../ui/alert";
import { Button } from "../ui/button";
import { DateInput, storedDateFormat, userDateFormat } from "../ui/date-input";
import { Typography } from "../ui/typography";
import { Modal } from "../utils/modal";
import { useStore } from "../utils/store";
import { TOTA_BACKDATE_DAYS, dtFormat, totaCutoff } from "../utils/tota";
import { useSettings } from "../utils/use-settings";
import { Stack } from "./stack";

// TOTA's uploader refuses anything dated more than TOTA_BACKDATE_DAYS before the day the account
// was registered. That day is on their site, not in the log, so the Tiles page asks for it once
// and then stops showing activations the site would never take — a download that bounces off the
// form is worse than one that isn't offered.

export const readableDate = (stored: string, datemonth: boolean): string =>
    DateTime.fromFormat(stored, storedDateFormat, { zone: "utc" }).toFormat(userDateFormat(datemonth));

// The step in front of the page. Nothing is saved until Save: a half-typed date shouldn't start
// hiding activations.
export const TotaRegistration = () => {
    const { datemonth } = useSettings();
    const updateSetting = useStore((state) => state.updateSetting);
    const [draft, setDraft] = React.useState<string | undefined>(undefined);

    return (
        <Stack gap="lg">
            <Typography variant="h3">When did you register with TOTA?</Typography>
            <Typography variant="subtitle">
                Their uploader won&apos;t take an activation dated more than {TOTA_BACKDATE_DAYS} days before you signed
                up, so the log needs the day your account was created — it&apos;s on your profile at tilesontheair.com.
                Everything older than that stays in your log, it just isn&apos;t listed here. You can change the date
                later under Settings, My Details.
            </Typography>
            <DateInput value={draft} onChange={setDraft} aria-label="tota registration date" />
            {!!draft && (
                <Typography variant="subtitle">
                    Activations from {readableDate(totaCutoff(draft), datemonth)} onwards will be listed.
                </Typography>
            )}
            <Stack direction="row" gap="md">
                <Button
                    colour={draft ? "success" : "grey"}
                    text="Save"
                    aria-disabled={!draft}
                    onPress={() => draft && updateSetting("totaRegistered", draft)}
                />
                <Button
                    variant="outlined"
                    colour="grey"
                    text="I registered today"
                    onPress={() => updateSetting("totaRegistered", DateTime.utc().toFormat(dtFormat))}
                />
            </Stack>
        </Stack>
    );
};

// The date once it's set: a chip on the page that opens the same field again, so a wrong day is a
// tap away from being fixed rather than a trip to the settings.
export const TotaRegistrationChip = () => {
    const settings = useSettings();
    const updateSetting = useStore((state) => state.updateSetting);
    const [editing, setEditing] = React.useState<boolean>(false);
    const [draft, setDraft] = React.useState<string | undefined>(settings.totaRegistered);

    const open = () => {
        setDraft(settings.totaRegistered);
        setEditing(true);
    };

    return (
        <>
            <Button
                variant="chip"
                startIcon="calendar-outline"
                text={`Registered ${settings.totaRegistered ? readableDate(settings.totaRegistered, settings.datemonth) : "?"}`}
                onPress={open}
            />
            <Modal open={editing} onClose={() => setEditing(false)}>
                <Stack gap="lg">
                    <Typography variant="h3">TOTA registration date</Typography>
                    <Typography variant="subtitle">
                        Activations more than {TOTA_BACKDATE_DAYS} days older than this aren&apos;t listed — their
                        uploader won&apos;t take them.
                    </Typography>
                    <DateInput value={draft} onChange={setDraft} aria-label="tota registration date" />
                    <Button
                        colour={draft ? "success" : "grey"}
                        text="Save"
                        aria-disabled={!draft}
                        onPress={() => {
                            if (!draft) return;
                            updateSetting("totaRegistered", draft);
                            setEditing(false);
                        }}
                    />
                    <Button variant="outlined" colour="grey" text="Cancel" onPress={() => setEditing(false)} />
                </Stack>
            </Modal>
        </>
    );
};

// Same field for the settings page, where clearing it is allowed: no date means the Tiles page
// asks again rather than filtering on a guess.
export const TotaRegistrationSetting = () => {
    const settings = useSettings();
    const updateSetting = useStore((state) => state.updateSetting);

    return (
        <Stack>
            <Typography underline>TOTA registration date:</Typography>
            <Typography variant="subtitle">
                Used by the Tiles page to hide activations tilesontheair.com won&apos;t accept — anything more than{" "}
                {TOTA_BACKDATE_DAYS} days older than the day you registered with them.
            </Typography>
            <DateInput
                value={settings.totaRegistered}
                onChange={(v) => updateSetting("totaRegistered", v)}
                aria-label="tota registration date"
            />
            {settings.totaRegistered && (
                <Alert severity="info">
                    <Typography>
                        Tiles lists activations from{" "}
                        {readableDate(totaCutoff(settings.totaRegistered), settings.datemonth)} onwards.
                    </Typography>
                </Alert>
            )}
        </Stack>
    );
};
