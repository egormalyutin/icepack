const path = require("path")

// TODO: paths relative to cwd when saving
// TODO: modes: single minified js or .min.js and .js
// TODO: detect and install uses of plugins
// TODO: use prettier
// TODO: detect index.ts or index.html or index.js
// TODO: err on more than one dist
// TODO: tsconfig option
// TODO: gcc, custom min plugin

module.exports = settings => {
    const entries = {}

    for (entry of settings.entries) {
        const name = path.basename(entry, path.extname(entry))

        entries[name] = entry

        if (settings.production) {
            entries[name + ".min"] = entry
        }
    }

    const config = {
        mode: settings.production ? "production" : "development",

        entry: entries,

        output: {
            path: path.resolve(settings.dist),
            filename: "[name].js"
        },

        resolve: {
            extensions: [".ts", ".tsx", ".js", ".jsx"]
        },

        module: {
            rules: [
                {
                    test: /\\.tsx?$/,
                    loader: "ts-loader",
                    options: {
                        configFile: settings.tsconfig
                    }
                }
            ]
        },

        optimization: {
            minimize: settings.production,
            minimizer: settings.production
                ? [
                      new (require("terser-webpack-plugin"))({
                          include: /\\.min\\.js$/
                      })
                  ]
                : []
        }
    }

    return config
}
