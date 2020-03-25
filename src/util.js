const process = require("process")

const pkgDir = require("pkg-dir")
const chalk = require("chalk")

// Log error
exports.logError = text =>
    console.error("  " + chalk.bold.red("error") + " " + text)

// Log info
exports.logInfo = text =>
    console.error("  " + chalk.bold.blue("info") + " " + text)

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

// If `x` is not an array, return an array with it
exports.toArray = x => (Array.isArray(x) ? x : [x])

// If `x` is an array, then return its last element, otherwise return `x`
exports.toItem = x => (Array.isArray(x) ? x[x.length - 1] : x)

// Convert string to double-quoted escaped string
exports.sanitize = str => JSON.stringify(str)

// Convert command line options to internal Icepack config
exports.generateSettings = opts => ({
    entries: exports.toArray(opts.entry || "src/index.js"),
    dist: exports.toItem(opts.dist || "dist")
})
