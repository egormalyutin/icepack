const process = require("process")
const path = require("path")
const fs = require("fs").promises
const { R_OK } = require("fs").constants

const webpack = require("webpack")

const generateConfig = require("./generate-config")

// TODO: entry as args, help, examples

const opts = require("yargs")
    .detectLocale(false)

    .usage("Usage: $0 [options]")

    .option("entry", {
        alias: "e",
        type: "string",
        description: "Entry file"
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
        description: "Development mode"
    })

    .option("tsconfig", {
        alias: "ts",
        type: "string",
        description: "Path to tsconfig.json"
    })

    .alias("h", "help")
    .alias("v", "version")

    .parse()

const runWebpack = config =>
    webpack(config, (err, stats) => {
        if (err) {
            console.error(err.stack || err)
            if (err.details) {
                console.error(err.details)
            }
            process.exit(1)
        }

        console.log(
            stats.toString({
                preset: "normal",
                colors: true
            })
        )
    })

const exists = async pth => {
    try {
        await fs.access(pth, R_OK)
        return true
    } catch (_) {
        return false
    }
}

const toItem = x => (Array.isArray(x) ? x[x.length - 1] : x)

const generateSettings = async opts => {
    settings = {
        production: !opts.development,
        entries: opts.entry,
        dist: toItem(opts.dist || "dist"),
        tsconfig: opts.tsconfig
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
    runWebpack(config)
})()
