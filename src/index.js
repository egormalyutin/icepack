const process = require("process")
const path = require("path")
const { inspect } = require("util")
const fs = require("fs").promises
const { R_OK } = require("fs").constants

const webpack = require("webpack")

const generateConfig = require("./generate-config")

// TODO: entry as args, help, examples
// TODO: multiple dist

const parser = require("yargs")
    .detectLocale(false)

    .usage("Usage: $0 [options]")

    .option("entry", {
        alias: "e",
        type: "string",
        description: "Entry file (can be specified multiple times)"
    })

    .array("entry")

    .option("dist", {
        alias: "d",
        type: "string",
        description: "Dist dir"
    })

    .option("development", {
        alias: "dev",
        type: "boolean",
        description: "Development mode (production mode is default)"
    })

    .option("tsconfig", {
        alias: "ts",
        type: "string",
        description: "Path to tsconfig.json"
    })

    .option("inspect", {
        alias: "in",
        type: "boolean",
        description: "Inspect Webpack config"
    })

    .option("single-js", {
        alias: "sj",
        type: "boolean",
        description: "Generate single minified .js in production mode"
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

const generateSettings = async opts => {
    settings = {
        production: !opts.development,
        entries: opts.entry,
        dist: opts.dist || "dist",
        tsconfig: opts.tsconfig,
        singleJS: opts["single-js"]
    }

    if (!settings.entries || settings.entries.length == 0) {
        if (await exists(path.resolve("src/index.ts"))) {
            settings.entries = [path.resolve("src/index.ts")]
        } else {
            settings.entries = [path.resolve("src/index.js")]
        }
    }

    return settings
}

;(async () => {
    const settings = await generateSettings(opts)
    const config = generateConfig(settings)

    if (opts.inspect) {
        console.log(inspect(config, { depth: 999999, colors: true }))
    }

    runWebpack(config)
})()
