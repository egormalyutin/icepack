const pkgDir = require("pkg-dir")
const chalk = require("chalk")
const process = require("process")

// Log error
exports.logError = text =>
    console.error("  " + chalk.bold.red("error") + " " + text)

// Log info
exports.logInfo = text =>
    console.error("  " + chalk.bold.blue("info") + " " + text)

// Convert command line options to internal Icepack config
exports.generateSettings = opts => ({
    entry: opts.entry || "./src/index.js",
    dist: opts.dist || "dist"
})

// Find the root directory of npm package in cwd
exports.findRoot = () => {
    const root = pkgDir.sync()
    if (!root) {
        exports.logError(
            "failed to find the root directory of npm package in " +
                process.cwd()
        )
        process.exit(1)
    }
    return root
}
