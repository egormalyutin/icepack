const process = require("process")
const path = require("path")
const { inspect } = require("util")
const fs = require("fs").promises
const { R_OK } = require("fs").constants

const webpack = require("webpack")

// TODO: help, examples
// TODO: detect index.ts or index.html or index.js
// TODO: gcc, custom min plugin
// TODO: public path, externals, externals regexp
// TODO: env
// TODO: default tsconfig
// TODO: append, prepend
// TODO: disable/only assets
// TODO: main.js, glob

const parser = require("yargs")
    .detectLocale(false)

    .usage("Usage: $0 [options]")

    .group(
        [
            "entry",
            "entry-output",
            "dist",
            "production",
            "tsconfig",
            "inspect",
            "single-js",
            "library-target",
            "devtool"
        ],
        "Webpack options:"
    )

    .option("entry", {
        alias: "e",
        type: "string",
        description:
            "Entry file (can be specified multiple times, " +
            "default is src/index.ts or src/index.js)",
        default: []
    })

    .array("entry")

    .option("entry-output", {
        alias: "eo",
        type: "string",
        description:
            "Entry file with output bundle name " +
            "(accepts 2 arguments, can be specified multiple times)",
        default: []
    })

    .array("entry-output")
    .nargs("entry-output", 2)

    .option("dist", {
        alias: "d",
        type: "string",
        description: "Dist dir",
        default: "dist"
    })

    .option("production", {
        alias: "prod",
        type: "boolean",
        description: "Production mode (development mode is default)",
        default: false
    })

    .option("tsconfig", {
        alias: "ts",
        type: "string",
        description: "Path to tsconfig.json",
        default: "tsconfig.json"
    })

    .option("inspect", {
        alias: "in",
        type: "boolean",
        description: "Inspect Webpack config",
        default: false
    })

    .option("single-js", {
        alias: "sjs",
        type: "boolean",
        description: "Generate single minified .js in production mode",
        default: false
    })

    .option("library-target", {
        alias: "lt",
        type: "string",
        description: "libraryTarget Webpack option",
        default: "var"
    })

    .option("devtool", {
        alias: "dt",
        type: "string",
        description:
            "devtool Webpack option (by default in production is " +
            "none, in development is source-map)"
    })

    .alias("h", "help")
    .alias("v", "version")

    .strict()

const opts = parser.parse()

if (Array.isArray(opts.dist)) {
    parser.showHelp()
    console.error("\nMultiple dist directories aren't supported at this moment")
    process.exit(1)
}

const runWebpack = config =>
    webpack(config, (err, stats) => {
        if (err) {
            console.error(err.stack || err)
            if (err.details) {
                console.error(err.details)
            }
            process.exit(1)
        }

        console.log(stats.toString({ colors: true }))
    })

const exists = async pth => {
    try {
        await fs.access(pth, R_OK)
        return true
    } catch (_) {
        return false
    }
}

;(async () => {
    // ENTRIES
    const entries = {}

    // Add entries from --entry
    for (const entry of opts.entry) {
        entries[path.basename(entry, path.extname(entry))] = entry
    }

    // Add entries from --entry-output
    for (let i = 0; i < opts.entryOutput.length; i += 2) {
        entries[opts.entryOutput[i + 1]] = opts.entryOutput[i]
    }

    // Add default entries
    if (Object.keys(entries).length == 0) {
        if (await exists(path.resolve("src/index.ts"))) {
            entries["index"] = path.resolve("src/index.ts")
        } else {
            entries["index"] = path.resolve("src/index.js")
        }
    }

    // Add .min outputs
    if (opts.production && !opts.singleJs) {
        for (const name in entries) {
            entries[name + ".min"] = entries[name]
        }
    }

    // GENERATE CONFIG
    const config = {
        mode: opts.production ? "production" : "development",

        entry: entries,

        output: {
            path: path.resolve(opts.dist),
            filename: "[name].js",
            libraryTarget: opts.libraryTarget
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
                        configFile: opts.tsconfig
                    }
                }
            ]
        },

        devtool: opts.devtool || opts.production ? "none" : "source-map",

        optimization: {
            minimize: opts.production,
            minimizer: opts.production
                ? [
                      new (require("terser-webpack-plugin"))({
                          include: opts.singleJs ? /\.js$/ : /\.min\.js$/
                      })
                  ]
                : []
        }
    }

    if (opts.inspect) {
        console.log(inspect(config, { depth: 999999, colors: true }))
    }

    runWebpack(config)
})()
