import { Image } from "expo-image";
import jsSHA from "jssha";
import React, { useRef } from "react";
import { View } from "react-native";
import { groupBy } from "../arrays";
import { Feature } from "./common";

export type GoogleCredentials = {
    key: string;
    secret: string;
};

const blurhash =
    "|rF?hV%2WCj[ayj[a|j[az_NaeWBj@ayfRayfQfQM{M|azj[azf6fQfQfQIpWXofj[ayj[j[fQayWCoeoeaya}j[ayfQa{oLj?j[WVj[ayayj[fQoff7azayj[ayj[j[ayofayayayj[fQj[ayayj[ayfjj[j[ayjuayj[";

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

const getActualWidth = (width: "auto" | number, ref: React.RefObject<View>) =>
    typeof width === "number" ? width : ref.current ? (ref.current as unknown as HTMLElement).clientWidth : null;

export const Map: MapComponent = ({ width = "auto", height, google, children }): JSX.Element => {
    const widthRef = useRef<View>(null);
    const features = groupBy<Feature, string>(
        React.Children.toArray(children)
            .filter((f) => (React.isValidElement(f) ? "renderFeature" in (f as any).type : false))
            .map((f: any) => f.type.renderFeature(f.props)),
        (o) =>
            o.style
                ? `${o.type}=${encodeURIComponent(
                      Object.entries(o.style)
                          .map(([k, v]) => `${k}:${v}`)
                          .join("|"),
                  )}`
                : o.type,
    );

    const actualWidth = getActualWidth(width, widthRef);

    let url = `https://maps.googleapis.com/maps/api/staticmap`;
    if (actualWidth) url = `${url}?&size=${actualWidth}x${height}`;
    Object.keys(features).forEach(
        (e) =>
            (url = `${url}&${e}${e.includes("=") ? "|" : "="}${encodeURIComponent(
                features[e].map((f) => f.data).join("|"),
            )}`),
    );
    url = `${url}&key=${google.key}`;

    return (
        <>
            <View style={{ width: "100%", height: 0 }} ref={widthRef} />
            {actualWidth && (
                <Image
                    style={{ width: actualWidth, height }}
                    source={signRequest(url, google.secret)}
                    placeholder={blurhash}
                />
            )}
        </>
    );
};
