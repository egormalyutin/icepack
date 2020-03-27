const process = require("process")
const path = require("path")
const { inspect } = require("util")
const fs = require("fs").promises
const { R_OK } = require("fs").constants

const yargs = require("yargs")

const webpack = require("webpack")

// TODO: help, examples
// TODO: gcc, custom min plugin
// TODO: env
// TODO: default tsconfig
// TODO: append, prepend
// TODO: disable/only assets
// TODO: main.js, glob
// TODO: disable smaps for entry
// TODO: config gen
// TODO: 4 replace options for entries
// TODO: inline source maps, enable for entry
// TODO: no source source maps for production, ext source maps for development

const parser = yargs
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
            "only-min-js",
            "library-target",
            "public-path",
            "devtool",
            "external",
            "target"
        ],
        "Webpack options:"
    )

    .option("entry", {
        alias: "e",
        type: "string",
        description:
            "Entry file (can be specified multiple times, " +
            "default is src/index.ts or src/index.js or " +
            "src/main.ts or src/main.js, checked in this order)",
        array: true,
        default: []
    })

    .option("entry-output", {
        alias: "eo",
        type: "string",
        description:
            "Entry file with output bundle name " +
            "(accepts 2 arguments, can be specified multiple times)",
        array: true,
        nargs: 2,
        default: []
    })

    .option("dist", {
        alias: "d",
        type: "string",
        description: "Dist dir",
        default: "dist"
    })

    .option("production", {
        alias: "p",
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

    .option("only-min-js", {
        alias: "omjs",
        type: "boolean",
        description: "Generate single minified .min.js in production mode",
        default: false
    })

    .option("library-target", {
        alias: "lt",
        type: "string",
        description: "libraryTarget Webpack option",
        default: "var"
    })

    .option("public-path", {
        alias: "pp",
        type: "string",
        description: "publicPath Webpack option",
        default: ""
    })

    .option("inline-source-maps", {
        alias: "ism",
        type: "boolean",
        description: "Enable inlined source maps",
        default: false
    })

    .option("inline-source-maps-entry", {
        alias: "isme",
        type: "string",
        array: true,
        description: "Enable inlined source maps for entries (ACCEPTS REGEXPS)",
        default: []
    })

    .option("source-maps", {
        alias: "sm",
        type: "boolean",
        description: "Enable source maps",
        default: false
    })

    .option("source-maps-entry", {
        alias: "sme",
        type: "string",
        array: true,
        description: "Enable source maps for entries (ACCEPTS REGEXPS)",
        default: []
    })

    .option("no-source-source-maps", {
        alias: "nssm",
        type: "boolean",
        description: "Enable source maps without sources included",
        default: false
    })

    .option("no-source-source-maps-entry", {
        alias: "nssme",
        type: "string",
        array: true,
        description:
            "Enable source maps without sources included " +
            "for entries (ACCEPTS REGEXPS)",
        default: []
    })

    .option("external", {
        alias: "ext",
        type: "string",
        array: true,
        description: "externals Webpack option (ACCEPTS REGEXPS)",
        default: []
    })

    .option("target", {
        type: "string",
        description: "target Webpack option",
        default: "web"
    })

    .alias("h", "help")
    .alias("v", "version")

    .wrap(yargs.terminalWidth())

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

const removeEmpty = arr => arr.filter(Boolean)

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
            if (opts.onlyMinJs) delete entries[name]
        }
    }

    // GENERATE CONFIG
    const config = {
        mode: opts.production ? "production" : "development",

        entry: entries,

        output: {
            path: path.resolve(opts.dist),
            filename: "[name].js",
            libraryTarget: opts.libraryTarget,
            publicPath: opts.publicPath
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

        devtool: false,

        externals: opts.external.map(e => new RegExp(e)),

        target: opts.target,

        optimization: {
            minimize: opts.production,
            minimizer: opts.production
                ? [
                      new (require("terser-webpack-plugin"))({
                          include: opts.singleJs ? /\.js$/ : /\.min\.js$/,
                          sourceMap: true
                      })
                  ]
                : []
        },

        plugins: [
            ...(opts.inlineSourceMaps
                ? new webpack.SourceMapDevToolPlugin({})
                : []),
            ...opts.inlineSourceMapsEntry.map(
                r => new webpack.SourceMapDevToolPlugin({ test: new RegExp(r) })
            ),
            ...(opts.sourceMaps
                ? new webpack.SourceMapDevToolPlugin({
                      filename: "[name].js.map"
                  })
                : []),
            ...opts.sourceMapsEntry.map(
                r =>
                    new webpack.SourceMapDevToolPlugin({
                        test: new RegExp(r),
                        filename: "[name].js.map"
                    })
            ),
            ...(opts.noSourceSourceMaps
                ? new webpack.SourceMapDevToolPlugin({
                      noSources: true,
                      filename: "[name].js.map"
                  })
                : []),
            ...opts.noSourceSourceMapsEntry.map(
                r =>
                    new webpack.SourceMapDevToolPlugin({
                        test: new RegExp(r),
                        noSources: true,
                        filename: "[name].js.map"
                    })
            )
        ]
    }

    if (opts.inspect) {
        console.log(inspect(config, { depth: 999999, colors: true }))
    }

    runWebpack(config)
})().catch(err => {
    console.error(err)
    process.exit(1)
})
