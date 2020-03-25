const yargs = require("yargs")

const commands = require("./commands")

yargs
    .detectLocale(false)

    .usage("Usage: $0 <command> [options]\n       $0 [options]")

    .command(
        ["$0", "run"],
        "Save generated webpack config to temporary " +
            "file and run webpack-cli with it as config (default command)",
        () => {},
        commands.runCommand
    )

    .command(
        "emit",
        "Emit generated webpack config to stdout",
        () => {},
        commands.emitCommand
    )

    .command(
        "save",
        "Save generated webpack config to " +
            "webpack.config.js at project's root dir",
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
