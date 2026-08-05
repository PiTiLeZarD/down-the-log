// Tauri serves the exported web build from the bundle root, so the gh-pages
// sub-path prefix must be dropped there or every asset URL 404s.
module.exports = ({ config }) => ({
    ...config,
    experiments: {
        ...config.experiments,
        baseUrl: process.env.TAURI_BUILD ? "" : "/down-the-log",
    },
});
