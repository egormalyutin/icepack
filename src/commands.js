const fs = require("fs")
const os = require("os")
const path = require("path")
const process = require("process")

const generate = require("./generate")
const { logInfo, findRoot, generateSettings } = require("./util")

// Generated webpack config and emit it to stdout",
exports.emitCommand = opts => {
    const code = generate(generateSettings(opts))
    console.log(code)
}

// Save generated webpack config to webpack.config.js at the
// root dir of npm package
exports.saveCommand = opts => {
    const file = path.resolve(findRoot(), "webpack.config.js")
    const code = generate(generateSettings(opts))
    fs.writeFileSync(file, code)
    logInfo(`saved generated webpack config to ${file}`)
}

// Save generated webpack config to temporary file and use it with webpack-cli
exports.runCommand = opts => {
    const signalExit = require("signal-exit")

    const code = generate(generateSettings(opts), findRoot())

    // Create temporary config file
    const file = path.join(
        os.tmpdir(),
        `icepack-${Math.floor(Math.random() * 9999999)}.js`
    )

    fs.writeFileSync(file, code)

    logInfo(`saved generated webpack config to ${file}`)

    // Remove file when exiting
    signalExit(() => {
        console.log()
        fs.unlinkSync(file)
        logInfo(`removed ${file}`)
    })

    // i could just exec webpack-cli, but cmon, who needs that?
    const cliPath = require.resolve("webpack-cli")
    process.argv = [process.argv[0], cliPath, "--config", file]

    logInfo("starting webpack-cli")
    console.log()

    // Become Webpack!
    require(cliPath)
}
