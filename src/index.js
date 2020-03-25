const commands = require("./commands")

// TODO: entry as args

require("yargs")
    .detectLocale(false)

    .usage("Usage: $0 <command> [options]\n       $0 [options]")

    .command(
        ["$0", "run"],
        "Save generated webpack config to temporary " +
            "file and use it with webpack-cli (default command)",
        () => {},
        commands.runCommand
    )

    .command(
        "emit",
        "Generated webpack config and emit it to stdout",
        () => {},
        commands.emitCommand
    )

    .command(
        "save",
        "Save generated webpack config to webpack.config.js at the" +
            "root dir of npm package",
        () => {},
        commands.saveCommand
    )

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

    .alias("h", "help")
    .alias("v", "version")
    .parse()
