module.exports = (api) => {
    api.cache(true);
    return {
        presets: ["babel-preset-expo"],
        plugins: [
            [
                "react-native-unistyles/plugin",
                {
                    root: "app",
                    // Unistyles hides style properties behind non-enumerable descriptors, so a
                    // stylesheet handed to a component it hasn't processed silently renders unstyled.
                    // These libraries all forward our styles to a react-native primitive.
                    autoProcessPaths: ["@expo/html-elements/src"],
                },
            ],
            "react-native-worklets/plugin",
        ],
    };
};
