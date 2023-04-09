"use strict";
var __read = (this && this.__read) || function (o, n) {
    var m = typeof Symbol === "function" && o[Symbol.iterator];
    if (!m) return o;
    var i = m.call(o), r, ar = [], e;
    try {
        while ((n === void 0 || n-- > 0) && !(r = i.next()).done) ar.push(r.value);
    }
    catch (error) { e = { error: error }; }
    finally {
        try {
            if (r && !r.done && (m = i["return"])) m.call(i);
        }
        finally { if (e) throw e.error; }
    }
    return ar;
};
var __values = (this && this.__values) || function(o) {
    var s = typeof Symbol === "function" && Symbol.iterator, m = s && o[s], i = 0;
    if (m) return m.call(o);
    if (o && typeof o.length === "number") return {
        next: function () {
            if (o && i >= o.length) o = void 0;
            return { value: o && o[i++], done: !o };
        }
    };
    throw new TypeError(s ? "Object is not iterable." : "Symbol.iterator is not defined.");
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerConsole = exports.register = exports.fail = exports.formatArg = exports.Perm = exports.allCommands = void 0;
var menus_1 = require("./menus");
var players_1 = require("./players");
var ranks_1 = require("./ranks");
exports.allCommands = {};
var commandArgTypes = ["string", "number", "boolean", "player", "exactPlayer"];
/** Represents a permission level that is required to run a specific command. */
var Perm = /** @class */ (function () {
    function Perm(name, check, unauthorizedMessage) {
        if (unauthorizedMessage === void 0) { unauthorizedMessage = "You do not have the required permission (".concat(name, ") to execute this command"); }
        this.name = name;
        this.check = check;
        this.unauthorizedMessage = unauthorizedMessage;
    }
    Perm.fromRank = function (rank) {
        return new Perm(rank.name, function (fishP) { return fishP.ranksAtLeast(rank); });
    };
    Perm.all = new Perm("all", function (fishP) { return true; });
    Perm.notGriefer = new Perm("player", function (fishP) { return !fishP.stopped || Perm.mod.check(fishP); });
    Perm.mod = Perm.fromRank(ranks_1.Rank.mod);
    Perm.admin = Perm.fromRank(ranks_1.Rank.admin);
    Perm.member = new Perm("member", function (fishP) { return fishP.member || !fishP.stopped; }, "You must have a [scarlet]Fish Membership[yellow] to use this command. Subscribe on the [sky]/discord[yellow]!");
    return Perm;
}());
exports.Perm = Perm;
/**Takes an arg string, like `reason:string?` and converts it to a CommandArg. */
function processArgString(str) {
    //this was copypasted from mlogx haha
    var matchResult = str.match(/(\w+):(\w+)(\?)?/);
    if (!matchResult) {
        throw new Error("Bad arg string ".concat(str, ": does not match pattern word:word(?)"));
    }
    var _a = __read(matchResult, 4), name = _a[1], type = _a[2], isOptional = _a[3];
    if (commandArgTypes.includes(type)) {
        return { name: name, type: type, isOptional: !!isOptional };
    }
    else {
        throw new Error("Bad arg string ".concat(str, ": invalid type ").concat(type));
    }
}
function formatArg(a) {
    var isOptional = a.at(-1) == "?";
    var brackets = isOptional ? ["[", "]"] : ["<", ">"];
    return brackets[0] + a.split(":")[0] + brackets[1];
}
exports.formatArg = formatArg;
/**Takes a list of args passed to the command, and processes it, turning it into a kwargs style object. */
function processArgs(args, processedCmdArgs, allowMenus) {
    var e_1, _a;
    if (allowMenus === void 0) { allowMenus = true; }
    var outputArgs = {};
    var unresolvedArgs = [];
    try {
        for (var _b = __values(processedCmdArgs.entries()), _c = _b.next(); !_c.done; _c = _b.next()) {
            var _d = __read(_c.value, 2), i = _d[0], cmdArg = _d[1];
            //if the arg was not provided
            if (!args[i]) {
                if (cmdArg.isOptional) {
                    outputArgs[cmdArg.name] = null;
                }
                else if (cmdArg.type == "player" && allowMenus) {
                    outputArgs[cmdArg.name] = null;
                    unresolvedArgs.push(cmdArg);
                }
                else
                    throw new Error("arg parsing failed");
                continue;
            }
            //Deserialize the arg
            switch (cmdArg.type) {
                case "player":
                    var player = players_1.FishPlayer.getByName(args[i]);
                    if (player == null)
                        return { error: "Player \"".concat(args[i], "\" not found.") };
                    outputArgs[cmdArg.name] = player;
                    break;
                case "exactPlayer":
                    var players = players_1.FishPlayer.getAllByName(args[i]);
                    if (players.length === 0)
                        return { error: "Player \"".concat(args[i], "\" not found. You must specify the name exactly without colors.") };
                    else if (players.length > 1)
                        return { error: "Name \"".concat(args[i], "\" could refer to more than one player.") };
                    outputArgs[cmdArg.name] = players[0];
                    break;
                case "number":
                    var number = parseInt(args[i]);
                    if (isNaN(number))
                        return { error: "Invalid number \"".concat(args[i], "\"") };
                    outputArgs[cmdArg.name] = number;
                    break;
                case "string":
                    outputArgs[cmdArg.name] = args[i];
                    break;
                case "boolean":
                    switch (args[i].toLowerCase()) {
                        case "true":
                        case "yes":
                        case "yeah":
                        case "ya":
                        case "ya":
                        case "t":
                        case "y":
                            outputArgs[cmdArg.name] = true;
                            break;
                        case "false":
                        case "no":
                        case "nah":
                        case "nay":
                        case "nope":
                        case "f":
                        case "n":
                            outputArgs[cmdArg.name] = false;
                            break;
                        default: return { error: "Argument ".concat(args[i], " is not a boolean. Try \"true\" or \"false\".") };
                    }
                    break;
            }
        }
    }
    catch (e_1_1) { e_1 = { error: e_1_1 }; }
    finally {
        try {
            if (_c && !_c.done && (_a = _b.return)) _a.call(_b);
        }
        finally { if (e_1) throw e_1.error; }
    }
    return { processedArgs: outputArgs, unresolvedArgs: unresolvedArgs };
}
function outputFail(message, sender) {
    sender.sendMessage("[scarlet]\u26A0 [yellow]".concat(message));
}
function outputSuccess(message, sender) {
    sender.sendMessage("[#48e076]\u2714 ".concat(message));
}
function outputMessage(message, sender) {
    sender.sendMessage(message);
}
var CommandError = (function () { });
Object.setPrototypeOf(CommandError.prototype, Error.prototype);
//Shenanigans necessary due to odd behavior of Typescript's compiled error subclass
function fail(message) {
    var err = new Error(message);
    Object.setPrototypeOf(err, CommandError.prototype);
    throw err;
}
exports.fail = fail;
/**Converts the CommandArg[] to the format accepted by Arc CommandHandler */
function convertArgs(processedCmdArgs, allowMenus) {
    return processedCmdArgs.map(function (arg, index, array) {
        var isOptional = arg.isOptional || (arg.type == "player" && allowMenus && !array.slice(index + 1).some(function (c) { return !c.isOptional; }));
        var brackets = isOptional ? ["[", "]"] : ["<", ">"];
        //if the arg is a string and last argument, make it a spread type (so if `/warn player a b c d` is run, the last arg is "a b c d" not "a")
        return brackets[0] + arg.name + (arg.type == "string" && index + 1 == array.length ? "..." : "") + brackets[1];
    }).join(" ");
}
/**
 * Registers all commands in a list to a client command handler.
 **/
function register(commands, clientHandler, serverHandler) {
    var e_2, _a;
    var _loop_1 = function (name, data) {
        //Process the args
        var processedCmdArgs = data.args.map(processArgString);
        clientHandler.removeCommand(name); //The function silently fails if the argument doesn't exist so this is safe
        clientHandler.register(name, convertArgs(processedCmdArgs, true), data.description, new Packages.arc.util.CommandHandler.CommandRunner({ accept: function (rawArgs, sender) {
                var _a;
                var fishSender = players_1.FishPlayer.get(sender);
                //Verify authorization
                //as a bonus, this crashes if data.perm is undefined
                if (!data.perm.check(fishSender)) {
                    outputFail((_a = data.customUnauthorizedMessage) !== null && _a !== void 0 ? _a : data.perm.unauthorizedMessage, sender);
                    return;
                }
                //closure over processedCmdArgs, should be fine
                //Process the args
                var output = processArgs(rawArgs, processedCmdArgs);
                if ("error" in output) {
                    //if args are invalid
                    outputFail(output.error, sender);
                    return;
                }
                //Recursively resolve unresolved args (such as players that need to be determined through a menu)
                resolveArgsRecursive(output.processedArgs, output.unresolvedArgs, fishSender, function () {
                    //Run the command handler
                    try {
                        data.handler({
                            rawArgs: rawArgs,
                            args: output.processedArgs,
                            sender: fishSender,
                            outputFail: function (message) { return outputFail(message, sender); },
                            outputSuccess: function (message) { return outputSuccess(message, sender); },
                            output: function (message) { return outputMessage(message, sender); },
                            execServer: function (command) { return serverHandler.handleMessage(command); },
                            allCommands: exports.allCommands
                        });
                    }
                    catch (err) {
                        if (err instanceof CommandError) {
                            //If the error is a command error, then just outputFail
                            outputFail(err.message, sender);
                        }
                        else {
                            sender.sendMessage("[scarlet]\u274C An error occurred while executing the command!");
                            if (fishSender.ranksAtLeast(ranks_1.Rank.admin))
                                sender.sendMessage(err.toString());
                        }
                    }
                });
            } }));
        exports.allCommands[name] = data;
    };
    try {
        for (var _b = __values(Object.entries(commands)), _c = _b.next(); !_c.done; _c = _b.next()) {
            var _d = __read(_c.value, 2), name = _d[0], data = _d[1];
            _loop_1(name, data);
        }
    }
    catch (e_2_1) { e_2 = { error: e_2_1 }; }
    finally {
        try {
            if (_c && !_c.done && (_a = _b.return)) _a.call(_b);
        }
        finally { if (e_2) throw e_2.error; }
    }
}
exports.register = register;
function registerConsole(commands, serverHandler) {
    var e_3, _a;
    var _loop_2 = function (name, data) {
        //Cursed for of loop due to lack of object.entries
        //Process the args
        var processedCmdArgs = data.args.map(processArgString);
        serverHandler.removeCommand(name); //The function silently fails if the argument doesn't exist so this is safe
        serverHandler.register(name, convertArgs(processedCmdArgs, false), data.description, new Packages.arc.util.CommandHandler.CommandRunner({ accept: function (rawArgs) {
                //closure over processedCmdArgs, should be fine
                //Process the args
                var output = processArgs(rawArgs, processedCmdArgs, false);
                if ("error" in output) {
                    //ifargs are invalid
                    Log.warn(output.error);
                    return;
                }
                try {
                    data.handler({
                        rawArgs: rawArgs,
                        args: output.processedArgs,
                        outputFail: function (message) { return Log.warn("\u26A0 ".concat(message)); },
                        outputSuccess: function (message) { return Log.info("".concat(message)); },
                        output: function (message) { return Log.info(message); },
                        execServer: function (command) { return serverHandler.handleMessage(command); },
                    });
                }
                catch (err) {
                    if (err instanceof CommandError) {
                        Log.warn("\u26A0 ".concat(err.message));
                    }
                    else {
                        Log.err("&lrAn error occured while executing the command!&fr");
                        Log.err(err);
                    }
                }
            } }));
    };
    try {
        for (var _b = __values(Object.entries(commands)), _c = _b.next(); !_c.done; _c = _b.next()) {
            var _d = __read(_c.value, 2), name = _d[0], data = _d[1];
            _loop_2(name, data);
        }
    }
    catch (e_3_1) { e_3 = { error: e_3_1 }; }
    finally {
        try {
            if (_c && !_c.done && (_a = _b.return)) _a.call(_b);
        }
        finally { if (e_3) throw e_3.error; }
    }
}
exports.registerConsole = registerConsole;
/**Recursively resolves args. This function is necessary to handle cases such as a command that accepts multiple players that all need to be selected through menus. */
function resolveArgsRecursive(processedArgs, unresolvedArgs, sender, callback) {
    if (unresolvedArgs.length == 0) {
        callback(processedArgs);
    }
    else {
        var argToResolve_1 = unresolvedArgs.shift();
        var optionsList_1 = [];
        //TODO Dubious implementation
        switch (argToResolve_1.type) {
            case "player":
                Groups.player.forEach(function (player) { return optionsList_1.push(player); });
                break;
            default: throw new Error("Unable to resolve arg of type ".concat(argToResolve_1.type));
        }
        (0, menus_1.menu)("Select a player", "Select a player for the argument \"".concat(argToResolve_1.name, "\""), optionsList_1, sender, function (_a) {
            var option = _a.option;
            processedArgs[argToResolve_1.name] = players_1.FishPlayer.get(option);
            resolveArgsRecursive(processedArgs, unresolvedArgs, sender, callback);
        }, true, function (player) { return player.name; });
    }
}
