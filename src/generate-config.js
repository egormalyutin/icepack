const path = require("path")

// TODO: config gen
// TODO: detect index.ts or index.html or index.js
// TODO: output file
// TODO: gcc, custom min plugin
// TODO: libraryTarget, public path, target, externals, externals regexp
// TODO: env

module.exports = settings => {
    const entries = {}

    for (entry of settings.entries) {
        const name = path.basename(entry, path.extname(entry))

        entries[name] = entry

        if (settings.production && !settings.singleJS) {
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
            modules: [".", "node_modules"],
            extensions: [".ts", ".tsx", ".js", ".jsx"]
        },

        module: {
            rules: [
                {
                    test: /\.tsx?$/,
                    loader: "ts-loader",
                    options: {
                        configFile: settings.tsconfig || "tsconfig.json"
                    }
                }
            ]
        },

        optimization: {
            minimize: settings.production,
            minimizer: settings.production
                ? [
                      new (require("terser-webpack-plugin"))({
                          include: settings.singleJS ? /\.js$/ : /\.min\.js$/
                      })
                  ]
                : []
        }
    }

    return config
}
