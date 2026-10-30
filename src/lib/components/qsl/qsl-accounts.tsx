import { Stack } from "../stack";
import { Input } from "../../ui/input";
import { Typography } from "../../ui/typography";
import { useStore } from "../../utils/store";
import { useSettings } from "../../utils/use-settings";

// The logins live beside the buttons they unlock rather than in Settings: a greyed-out Download
// used to mean a trip to another screen and back to find out why.

export const LotwAccount = () => {
    const settings = useSettings();
    const updateSetting = useStore((state) => state.updateSetting);

    return (
        <Stack>
            <Typography variant="subtitle">
                Your lotw.arrl.org website login, used only to pull confirmations into the log. Your callsign
                certificate is never asked for — signing stays in tqsl. The password is kept in the device keychain
                on iOS and Android. It goes to lotw.arrl.org, through cors.jadami.com on web and desktop.
            </Typography>
            <Stack direction="row">
                <Typography>User:</Typography>
                <Input
                    value={settings.lotw?.user || ""}
                    onChangeText={(v) =>
                        updateSetting("lotw", { ...(settings.lotw || { user: "", password: "" }), user: v })
                    }
                />
                <Typography>Password:</Typography>
                <Input
                    password
                    value={settings.lotw?.password || ""}
                    onChangeText={(v) =>
                        updateSetting("lotw", {
                            ...(settings.lotw || { user: "", password: "" }),
                            password: v,
                        })
                    }
                />
            </Stack>
        </Stack>
    );
};

export const EqslAccount = () => {
    const settings = useSettings();
    const updateSetting = useStore((state) => state.updateSetting);

    return (
        <Stack>
            <Typography variant="subtitle">
                Your eqsl.cc login, used to upload QSOs and pull confirmations. The QTH nickname is only needed if
                your account holds more than one QTH for this callsign. The password is kept in the device keychain
                on iOS and Android. It goes to eqsl.cc, through cors.jadami.com on web and desktop, along with the
                QSOs not yet marked as sent when uploading.
            </Typography>
            <Stack direction="row">
                <Typography>User:</Typography>
                <Input
                    value={settings.eqsl?.user || ""}
                    onChangeText={(v) =>
                        updateSetting("eqsl", { ...(settings.eqsl || { user: "", password: "" }), user: v })
                    }
                />
                <Typography>Password:</Typography>
                <Input
                    password
                    value={settings.eqsl?.password || ""}
                    onChangeText={(v) =>
                        updateSetting("eqsl", {
                            ...(settings.eqsl || { user: "", password: "" }),
                            password: v,
                        })
                    }
                />
            </Stack>
            <Stack direction="row">
                <Typography>QTH nickname:</Typography>
                <Input
                    value={settings.eqsl?.qthNickname || ""}
                    onChangeText={(v) =>
                        updateSetting("eqsl", {
                            ...(settings.eqsl || { user: "", password: "" }),
                            qthNickname: v === "" ? undefined : v,
                        })
                    }
                />
            </Stack>
        </Stack>
    );
};

export const ClublogAccount = () => {
    const settings = useSettings();
    const updateSetting = useStore((state) => state.updateSetting);

    return (
        <Stack>
            <Typography variant="subtitle">
                Your clublog.org login, used to upload QSOs. If your account has an application password, use that
                one. Leave the callsign empty to send each QSO to the log of the callsign it was made under. The
                password is kept in the device keychain on iOS and Android. Uploading sends Club Log the QSOs not yet
                marked as sent, with this login.
            </Typography>
            <Stack direction="row">
                <Typography>Email:</Typography>
                <Input
                    value={settings.clublog?.email || ""}
                    onChangeText={(v) =>
                        updateSetting("clublog", {
                            ...(settings.clublog || { email: "", password: "" }),
                            email: v,
                        })
                    }
                />
                <Typography>Password:</Typography>
                <Input
                    password
                    value={settings.clublog?.password || ""}
                    onChangeText={(v) =>
                        updateSetting("clublog", {
                            ...(settings.clublog || { email: "", password: "" }),
                            password: v,
                        })
                    }
                />
            </Stack>
            <Stack direction="row">
                <Typography>Callsign:</Typography>
                <Input
                    value={settings.clublog?.callsign || ""}
                    onChangeText={(v) =>
                        updateSetting("clublog", {
                            ...(settings.clublog || { email: "", password: "" }),
                            callsign: v === "" ? undefined : v.toUpperCase(),
                        })
                    }
                />
            </Stack>
        </Stack>
    );
};
