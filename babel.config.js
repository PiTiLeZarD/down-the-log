module.exports = (api) => {
    api.cache(true);
    return {
        presets: ["babel-preset-expo"],
        plugins: [
            [
                "react-native-unistyles/plugin",
                {
                    root: "src",
                    // Unistyles hides style properties behind non-enumerable descriptors, so a
                    // stylesheet handed to a component it hasn't processed silently renders unstyled.
                    // These libraries all forward our styles to a react-native primitive.
                    // html-elements ships compiled `build/` since SDK 58 (it was `src/` before); a
                    // path that stops matching drops every Typography style without a warning.
                    autoProcessPaths: ["@expo/html-elements/build"],
                },
            ],
            "react-native-worklets/plugin",
        ],
    };
};
