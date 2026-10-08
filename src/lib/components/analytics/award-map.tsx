import React from "react";
import { GestureResponderEvent, LayoutChangeEvent, Pressable, View } from "react-native";
import Svg, { Circle, G, Path, Text as SvgText } from "react-native-svg";
import { UnitStatus } from "../../utils/award-progress";
import { AwardKey } from "../../utils/awards";
import { awardShapes, shapeAt } from "./award-shapes";
import { useAnalyticsColours } from "./colours";

export type AwardMapProps = {
    award: AwardKey;
    status: (id: string) => UnitStatus;
    selected?: string;
    onSelect?: (id: string) => void;
};

export const AwardMap = ({ award, status, selected, onSelect }: AwardMapProps) => {
    const colours = useAnalyticsColours();
    const [width, setWidth] = React.useState<number>(0);
    const map = awardShapes(award);
    const shapes = map.shapes.map((s) => ({ ...s, status: status(s.id) }));
    const stroke = map.width / 2400;

    // One handler for the whole map, hit-tested here: react-native-svg on web hands a shape's
    // press handlers to the DOM element as responder props, which React rejects for every path.
    const handlePress = (e: GestureResponderEvent) => {
        if (!onSelect || !width) return;
        // A click on web arrives as a plain MouseEvent, with no locationX/Y but an offsetX/Y
        // against the same element.
        const event = e.nativeEvent as GestureResponderEvent["nativeEvent"] & { offsetX?: number; offsetY?: number };
        const scale = map.width / width;
        const point = [
            (event.locationX ?? event.offsetX ?? 0) * scale,
            (event.locationY ?? event.offsetY ?? 0) * scale,
        ];
        // A finger's worth of slop around the dots, so a speck stays easy to hit.
        const hit = shapeAt(shapes, point, map.dot * 2);
        if (hit) onSelect(hit.id);
    };

    return (
        <Pressable
            style={{ width: "100%", aspectRatio: map.width / map.height }}
            onLayout={(e: LayoutChangeEvent) => setWidth(e.nativeEvent.layout.width)}
            onPress={handlePress}
        >
            {/* Taps land on the Pressable, so locationX/Y are measured against the whole map. */}
            <View style={{ flex: 1, pointerEvents: "none" }}>
                <Svg width="100%" height="100%" viewBox={`0 0 ${map.width} ${map.height}`}>
                    {shapes.map(({ id, d, status }) =>
                        d ? (
                            <Path
                                key={id}
                                d={d}
                                fill={colours.status[status]}
                                fillRule="evenodd"
                                stroke={id === selected ? colours.text : colours.background}
                                strokeWidth={id === selected ? stroke * 3 : stroke}
                            />
                        ) : null,
                    )}
                    <G>
                        {shapes.map(({ id, d, dot, pinned, status }) =>
                            // A dot that stands in for an outline is always drawn; one that only
                            // marks a speck shows up once there's something to mark.
                            dot && (!d || pinned || status !== "missing" || id === selected) ? (
                                <Circle
                                    key={id}
                                    cx={dot[0]}
                                    cy={dot[1]}
                                    r={map.dot}
                                    fill={colours.status[status]}
                                    stroke={id === selected ? colours.text : colours.background}
                                    strokeWidth={stroke * 2}
                                />
                            ) : null,
                        )}
                    </G>
                    <G>
                        {shapes.map(({ id, label }) =>
                            label ? (
                                <SvgText
                                    key={id}
                                    x={label[0]}
                                    y={label[1]}
                                    fontSize={map.width / 36}
                                    fontFamily="Quicksand"
                                    fontWeight="bold"
                                    fill={colours.text}
                                    textAnchor="middle"
                                    alignmentBaseline="middle"
                                >
                                    {id}
                                </SvgText>
                            ) : null,
                        )}
                    </G>
                </Svg>
            </View>
        </Pressable>
    );
};
