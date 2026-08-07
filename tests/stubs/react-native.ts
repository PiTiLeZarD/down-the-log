// react-native's entry point is Flow, not TypeScript (`import typeof * as ... from`), and rollup
// gives up on it before a single test collects. Nothing in tests/ renders anything, so the package
// only has to exist: the components below are never called, they just have to be importable.
// Aliased in vitest.config.ts. Types still come from the real package under tsc.

const component = (name: string) => {
    const Stub = () => null;
    Stub.displayName = name;
    return Stub;
};

export const View = component("View");
export const Text = component("Text");
export const Pressable = component("Pressable");
export const ScrollView = component("ScrollView");
export const FlatList = component("FlatList");
export const Switch = component("Switch");
export const Modal = component("Modal");

export const Animated = {
    View: component("Animated.View"),
    Text: component("Animated.Text"),
    Value: class {
        constructor(public value: number) {}
        setValue(value: number) {
            this.value = value;
        }
    },
    timing: () => ({ start: () => {} }),
    spring: () => ({ start: () => {} }),
};

// The one export the code under test actually reads: `store.ts` branches on it to decide whether
// the HamQTH password goes to SecureStore. Tests run as web, which is the branch that doesn't.
export const Platform = { OS: "web" as const, select: (specifics: Record<string, unknown>) => specifics.web };

export const PixelRatio = { get: () => 1, getFontScale: () => 1, roundToNearestPixel: (n: number) => n };

export const Linking = {
    openURL: async () => {},
    canOpenURL: async () => true,
};

export const StyleSheet = {
    create: <T>(styles: T) => styles,
    flatten: (style: unknown) => style,
    absoluteFillObject: {},
};

export const useWindowDimensions = () => ({ width: 1024, height: 768, scale: 1, fontScale: 1 });
