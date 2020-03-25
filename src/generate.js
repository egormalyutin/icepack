const path = require("path")

const { sanitize } = require("./util")

// TODO: paths relative to cwd when saving
// TODO: modes: single minified js or .min.js and .js
// TODO: prod and dev mode
// TODO: detect uses of plugins
// TODO: use prettier

module.exports = (settings, dirname) => {
    const req = m => sanitize(dirname ? require.resolve(m) : m)

    const toEntryMin = (entry, min) =>
        `\n        ` +
        sanitize(
            path.basename(entry, path.extname(entry)) + (min ? ".min" : "")
        ) +
        `: path.resolve(${dirname ? sanitize(dirname) : "__dirname"}, ` +
        sanitize(dirname ? path.resolve(dirname, entry) : entry) +
        `)`

    const toEntry = entry => toEntryMin(entry) + "," + toEntryMin(entry, true)

    const config = `\
const path = require("path")
const TerserPlugin = require(${req("terser-webpack-plugin")})

module.exports = {
    entry: {${settings.entries.map(toEntry).join(", ")}\n    },

    output: {
        path: path.resolve(${
            dirname ? sanitize(dirname) : "__dirname"
        }, ${sanitize(settings.dist)}),
        filename: "[name].js"
    },

    resolve: {
        extensions: [".ts", ".tsx", ".js", ".jsx"]
    },

    module: {
        rules: [
            { test: /\\.tsx?$/, loader: ${req("ts-loader")} }
        ]
    },

    optimization: {
        minimize: true,
        minimizer: [new TerserPlugin({ include: /\\.min\\.js$/ })]
    }
}`

    return config
}
