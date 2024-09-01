"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const fs = require("node:fs");
const path = require("node:path");
function fail(message) {
    console.error(message);
    process.exit(1);
}
if (!process.argv[2])
    fail(`Please provide the path to your server jar file. If you do not have one, run the "dev" script instead.`);
const filepath = path.resolve(process.argv[2]);
try {
    fs.accessSync(filepath, fs.constants.R_OK);
}
catch {
    fail(`Path "${filepath}" does not exist or is not accessible.`);
}
if (path.extname(filepath) != ".jar")
    fail(`Path must point to a jar file.`);
const configDir = path.join(filepath, "..", "config");
try {
    if (!fs.statSync(configDir).isDirectory())
        fail(`Config folder at "${configDir}" is not a directory. Are you sure this is a Mindustry server directory?`);
}
catch {
    fail(`Path "${configDir}" does not exist or is not accessible. Are you sure this is a Mindustry server directory?`);
}
const fishCommandsFolder = path.join(configDir, "mods", "fish-commands");
try {
    if (fs.lstatSync(fishCommandsFolder).isSymbolicLink()) {
        //Symlink already exists, delete it
        fs.unlinkSync(fishCommandsFolder);
        console.log(`Unlinked fish-commands.`);
    }
    else {
        fail(`fish-commands folder at "${fishCommandsFolder}" already exists, but is not a symlink. Consider deleting it.`);
    }
}
catch {
    //File does not exist, create a symlink
    const buildPath = path.join(process.argv[1], "../../build");
    console.log(`Creating symlink from "${fishCommandsFolder}" to "${buildPath}"`);
    fs.symlinkSync(buildPath, fishCommandsFolder);
    console.log(`Successfully linked fish-commands.`);
}
