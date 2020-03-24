const path = require("path")

const escape = str => JSON.stringify(str)

exports.escape = escape

// CONFIG GENERATION
exports.generate = (dirname, settings) => {
    let config = 'const path = require("path")\n\n'

    config += `module.exports = {
    entry: [${escape(
        dirname ? path.resolve(dirname, settings.entry) : settings.entry
    )}],
    output: {
        path: path.resolve(${dirname ? escape(dirname) : "__dirname"}, ${escape(
        settings.dist
    )}),
        filename: "[name].js"
    }
}`

    return config
}
