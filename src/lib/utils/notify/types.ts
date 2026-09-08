// Shared shape of the three notifiers. Kept out of ./index so a backend can import it without
// importing its two siblings back.

export type NotifyPermission = "granted" | "denied" | "default" | "unsupported";

export type NotifyOptions = {
    title: string;
    body: string;
    // Collapses a repeat onto the notification already on screen instead of stacking a second copy
    // of the same activation.
    tag: string;
    // Where a tap should land, relative to the app's own base path.
    url?: string;
};

export type NotifyBackend = {
    // Whether this build can raise a notification at all, asked before anything is offered on the
    // settings screen. Cheap and synchronous: every backend can answer it from what is on `window`
    // or from `Platform.OS`, without loading the module behind it.
    supported: () => boolean;
    permission: () => Promise<NotifyPermission>;
    // Must be called from inside a user gesture — Safari grants from nowhere else, and Android
    // holds the same rule for the runtime POST_NOTIFICATIONS prompt.
    request: () => Promise<NotifyPermission>;
    send: (options: NotifyOptions) => Promise<void>;
};

// A tag is a string everywhere except Tauri and Android, which want a number. Same string in, same
// id out, so a re-spot of one activation still replaces its own notification rather than stacking.
export const tagId = (tag: string): number => {
    let hash = 0;
    for (let index = 0; index < tag.length; index += 1) hash = (Math.imul(31, hash) + tag.charCodeAt(index)) | 0;
    // Positive and inside the signed 32-bit range Android's notification id is.
    return Math.abs(hash) || 1;
};
