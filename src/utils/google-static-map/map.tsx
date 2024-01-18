import { Image } from "expo-image";
import jsSHA from "jssha";
import React from "react";
import { groupBy } from "../arrays";
import { Feature } from "./common";

export type GoogleCredentials = {
    key: string;
    secret: string;
};

const b64unsafeUrl = (b64: string) => b64.replace(/_/g, "/").replace(/-/g, "+");
const b64safeUrl = (b64: string) => b64.replace(/\+/g, "-").replace(/\//g, "_");

const signRequest = (url: string, secret: string) => {
    const { pathname, search } = new URL(url);
    const sha1 = new jsSHA("SHA-1", "TEXT", { encoding: "UTF8" });
    sha1.setHMACKey(b64unsafeUrl(secret), "B64");
    sha1.update(`${pathname}${search}`);
    return `${url}&signature=${b64safeUrl(sha1.getHMAC("B64"))}`;
};

export type MapProps = {
    width?: number | "auto";
    height: number;
    google: GoogleCredentials;
};

export type MapComponent = React.FC<React.PropsWithChildren<MapProps>>;

export const Map: MapComponent = ({ width = "auto", height, google, children }): JSX.Element => {
    const features = groupBy<Feature, Feature["type"]>(
        React.Children.toArray(children)
            .filter((f) => (React.isValidElement(f) ? "renderFeature" in (f as any).type : false))
            .map((f: any) => f.type.renderFeature(f.props)),
        (o) => o.type, // group with style here
    );

    let url = `https://maps.googleapis.com/maps/api/staticmap?&size=600x${height}`;
    Object.keys(features).forEach(
        (e) => (url = `${url}&${e}=${encodeURIComponent(features[e as Feature["type"]].map((f) => f.data).join("|"))}`),
    );
    url = `${url}&key=${google.key}`;

    return <Image source={signRequest(url, google.secret)} />;
};
