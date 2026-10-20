import { Switch, View } from "react-native";
import { Button } from "../../ui/button";
import { Input } from "../../ui/input";
import { Typography } from "../../ui/typography";
import { ClusterStatus, DxCluster, useClusterStatus } from "../../utils/spots";
import { useStore } from "../../utils/store";
import { useSettings } from "../../utils/use-settings";
import { Stack } from "../stack";

// Spots counted is the proof the login worked; until the first one, the cluster's last words say why not.
const describe = (status: ClusterStatus): string =>
    [
        status.message,
        status.connected &&
            (status.spots ? `${status.spots} spots, last ${status.lastSpot?.toFormat("HH:mm:ss")}Z` : "no spots yet"),
        status.connected && !status.spots && status.lastLine ? `"${status.lastLine}"` : "",
    ]
        .filter(Boolean)
        .join(" · ");

/**
 * The telnet DX clusters the desktop build logs in to. Shown only there: the browser and the phones
 * can't open a socket, and read HamQTH's copy of the feed instead.
 */
export const ClusterSettings = () => {
    const settings = useSettings();
    const updateSetting = useStore((state) => state.updateSetting);
    const statuses = useClusterStatus();
    const clusters = settings.dxClusters;

    const update = (id: string, fields: Partial<DxCluster>) =>
        updateSetting(
            "dxClusters",
            clusters.map((cluster) => (cluster.id === id ? { ...cluster, ...fields } : cluster)),
        );
    const add = () =>
        updateSetting("dxClusters", [
            ...clusters,
            { id: Date.now().toString(36), host: "", port: 7300, enabled: false },
        ]);
    const remove = (id: string) =>
        updateSetting(
            "dxClusters",
            clusters.filter((cluster) => cluster.id !== id),
        );

    return (
        <>
            <Typography underline>DX Cluster:</Typography>
            <Typography variant="subtitle">
                Telnet clusters to log in to. Their spots arrive live as the DX cluster source on the Spots page and the
                bandmap, and Spot me can post to the first one connected. The login is your callsign unless you set
                another; the password is only for clusters that ask for one, and is stored with the app's settings.
                Commands after login are sent on every connection: set/skimmer for RBN spots on DXSpider, or a
                cluster-side filter.
            </Typography>
            {clusters.map((cluster) => {
                const status = statuses[cluster.id];
                return (
                    <Stack key={cluster.id} gap="sm">
                        <Stack direction="row">
                            <Switch
                                value={cluster.enabled}
                                onValueChange={(enabled) => update(cluster.id, { enabled })}
                                aria-label="Connect"
                            />
                            <Typography>Host:</Typography>
                            <Input
                                value={cluster.host}
                                placeholder="dxc.example.net"
                                autoCapitalize="none"
                                onChangeText={(host) => update(cluster.id, { host })}
                            />
                            <Typography>Port:</Typography>
                            <Input
                                numeric
                                value={cluster.port ? String(cluster.port) : ""}
                                onChangeText={(port) => update(cluster.id, { port: +port || 0 })}
                            />
                        </Stack>
                        <Stack direction="row">
                            <Typography>Login:</Typography>
                            <Input
                                value={cluster.login || ""}
                                placeholder={settings.myCallsign || "Callsign"}
                                autoCapitalize="characters"
                                onChangeText={(login) => update(cluster.id, { login: login || undefined })}
                            />
                            <Typography>Password:</Typography>
                            <Input
                                password
                                value={cluster.password || ""}
                                placeholder="If asked"
                                onChangeText={(password) => update(cluster.id, { password: password || undefined })}
                            />
                            <View>
                                <Button
                                    variant="chip"
                                    colour="danger"
                                    startIcon="trash"
                                    aria-label="Remove cluster"
                                    onPress={() => remove(cluster.id)}
                                />
                            </View>
                        </Stack>
                        <Stack direction="row">
                            <Typography>After login:</Typography>
                            <Input
                                multiline
                                value={cluster.commands || ""}
                                placeholder={"One command per line, e.g.\nset/skimmer"}
                                autoCapitalize="none"
                                onChangeText={(commands) => update(cluster.id, { commands: commands || undefined })}
                            />
                        </Stack>
                        <Typography variant="subtitle">
                            {!cluster.enabled ? "Off" : status ? describe(status) : "Connecting..."}
                        </Typography>
                    </Stack>
                );
            })}
            <View>
                <Button text="Add cluster" variant="outlined" onPress={add} />
            </View>
        </>
    );
};
