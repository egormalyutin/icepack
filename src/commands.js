const fs = require("fs")
const os = require("os")
const path = require("path")
const process = require("process")

const pkgDir = require("pkg-dir")
const chalk = require("chalk")

const generate = require("./generate")

const error = text => console.error("  " + chalk.bold.red("error") + " " + text)
const info = text => console.error("  " + chalk.bold.blue("info") + " " + text)

const generateSettings = opts => ({
    entry: opts.entry || "./src/index.js",
    dist: opts.dist || "dist"
})

exports.emitCommand = opts => {
    const code = generate(null, generateSettings(opts))
    console.log(code)
}

const findRoot = () => {
    const root = pkgDir.sync()
    if (!root) {
        error(
            "failed to find the root directory of npm package in " +
                process.cwd()
        )
        process.exit(1)
    }
    return root
}

exports.saveCommand = opts => {
    const file = path.resolve(findRoot(), "webpack.config.js")
    const code = generate(null, generateSettings(opts))
    fs.writeFileSync(file, code)
    info(`saved generated webpack config to ${file}`)
}

exports.runCommand = opts => {
    const code = generate(findRoot(), generateSettings(opts))

    const file = path.join(
        os.tmpdir(),
        `icepack-${Math.floor(Math.random() * 99999)}.js`
    )

    fs.writeFileSync(file, code)
    process.on("exit", () => fs.unlinkSync(file))

    const cliPath = require.resolve("webpack-cli")
    // Become Webpack!
    process.argv = [process.argv[0], cliPath, "--config", file]
    require(cliPath)
}
