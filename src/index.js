const fs = require("fs")
const path = require("path")
const process = require("process")
const { spawn } = require("child_process")

const yargs = require("yargs")
const pkgDir = require("pkg-dir")
const tmp = require("tmp")
const chalk = require("chalk")

const { generate, escape } = require("./generate")

// TODO: add note about run mode when no --emit or --save passed
// emit, save and run as commands (run as default)

const error = text => console.error("  " + chalk.bold.red("error") + " " + text)
const info = text => console.error("  " + chalk.bold.blue("info") + " " + text)

// ARGS PARSING
const opts = yargs
    .detectLocale(false)
    .option("entry", {
        alias: "e",
        type: "string",
        description: "Entry file"
    })
    .option("dist", {
        alias: "d",
        type: "string",
        description: "Dist dir"
    })
    .option("emit", {
        type: "boolean",
        description: "Emit generated Webpack config to stdout"
    })
    .option("save", {
        type: "boolean",
        description:
            "Save generated Webpack config to" +
            "webpack.config.js at project's root dir"
    })
    .alias("h", "help")
    .alias("v", "version")
    .parse()

// CREATE ICEPACK CONFIG
const settings = {
    entry: opts.entry || "./src/index.js",
    dist: opts.dist || "dist"
}

// EMIT GENERATED WEBPACK CONFIG TO STDOUT
if (opts.emit) {
    const code = generate(null, settings)
    console.log(code)
    return
}

const root = pkgDir.sync()

if (!root) {
    error(
        `failed to find the root directory of npm package in ${process.cwd()}`
    )
    process.exit(1)
}

// SAVE GENERATED WEBPACK CONFIG TO webpack.config.js AT PROJECT'S ROOT DIR
if (opts.save) {
    const file = path.resolve(root, "webpack.config.js")
    const code = generate(null, settings)
    fs.writeFileSync(file, code)
    info(`saved generated webpack config to ${file}`)
    return
}

// EXECUTE WEBPACK CONFIG
if (!opts.emit && !opts.save) {
    const code = generate(root, settings)

    tmp.file({ prefix: "icepack-", postfix: ".js" }, (err, file, _, end) => {
        if (err) {
            error(`failed to create tmp file`)
            throw err
        }

        fs.writeFileSync(file, code)
        info(`saved generated webpack config to ${file}`)

        const cliPath = require.resolve("webpack-cli")
        const args = ["--color", "--config", file]

        info(`starting webpack-cli`)

        const cli = spawn(cliPath, args)

        cli.stdout.pipe(process.stdout)
        cli.stderr.pipe(process.stderr)

        cli.on("close", code => {
            end()
            process.exit(code)
        })
    })
}
