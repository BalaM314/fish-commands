"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
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
exports.initialize = exports.registerConsole = exports.register = exports.handleTapEvent = exports.fail = exports.CommandError = exports.formatArg = exports.Perm = exports.command = exports.consoleCommandList = exports.commandList = exports.allConsoleCommands = exports.allCommands = void 0;
var config_1 = require("./config");
var globals_1 = require("./globals");
var menus_1 = require("./menus");
var players_1 = require("./players");
var ranks_1 = require("./ranks");
var utils_1 = require("./utils");
//Behold, the power of typescript!
var initialized = false;
exports.allCommands = {};
exports.allConsoleCommands = {};
var globalUsageData = {};
var commandArgTypes = [
    "string", "number", "boolean", "player", "menuPlayer", "team", "time", "unittype", "block",
    "uuid", "offlinePlayer", "map"
];
/** Use this to get the correct type for command lists. */
var commandList = function (list) { return list; };
exports.commandList = commandList;
/** Use this to get the correct type for command lists. */
var consoleCommandList = function (list) { return list; };
exports.consoleCommandList = consoleCommandList;
/** Use this wrapper function to get the correct type definitions for commands using "data" or init(). */
function command(input) {
    return input;
}
exports.command = command;
/** Represents a permission that is required to do something. */
var Perm = /** @class */ (function () {
    function Perm(name, check, color, unauthorizedMessage) {
        if (color === void 0) { color = ""; }
        if (unauthorizedMessage === void 0) { unauthorizedMessage = "You do not have the required permission (".concat(name, ") to execute this command"); }
        this.name = name;
        this.color = color;
        this.unauthorizedMessage = unauthorizedMessage;
        if (typeof check == "string") {
            if (ranks_1.Rank.getByName(check) == null)
                (0, utils_1.crash)("Invalid perm ".concat(name, ": invalid rank name ").concat(check));
            this.check = function (fishP) { return fishP.ranksAtLeast(check); };
        }
        else {
            this.check = check;
        }
    }
    Perm.fromRank = function (rank) {
        return new Perm(rank.name, function (fishP) { return fishP.ranksAtLeast(rank); }, rank.color);
    };
    Perm.none = new Perm("all", function (fishP) { return true; }, "[sky]");
    Perm.mod = Perm.fromRank(ranks_1.Rank.mod);
    Perm.admin = Perm.fromRank(ranks_1.Rank.admin);
    Perm.member = new Perm("member", function (fishP) { return fishP.hasFlag("member") && !fishP.marked(); }, "[pink]", "You must have a [pink]Fish Membership[] to use this command. Subscribe on the [sky]/discord[yellow]!");
    Perm.chat = new Perm("chat", function (fishP) { return (!fishP.muted && !fishP.autoflagged) || fishP.ranksAtLeast("mod"); });
    Perm.bypassChatFilter = new Perm("bypassChatFilter", "admin");
    Perm.seeMutedMessages = new Perm("seeMutedMessages", function (fishP) { return fishP.muted || fishP.autoflagged || fishP.ranksAtLeast("mod"); });
    Perm.play = new Perm("play", function (fishP) { return (!fishP.marked() && !fishP.autoflagged) || fishP.ranksAtLeast("mod"); });
    Perm.seeErrorMessages = new Perm("seeErrorMessages", "admin");
    Perm.viewUUIDs = new Perm("viewUUIDs", "admin");
    Perm.blockTrolling = new Perm("blockTrolling", function (fishP) { return fishP.rank === ranks_1.Rank.pi; });
    Perm.bulkLabelPacket = new Perm("bulkLabelPacket", "mod");
    Perm.bypassVoteFreeze = new Perm("bypassVoteFreeze", "trusted");
    Perm.bypassVotekick = new Perm("bypassVotekick", "mod");
    Perm.changeTeam = new Perm("changeTeam", function (fishP) {
        return config_1.Mode.sandbox() ? fishP.ranksAtLeast("trusted")
            : config_1.Mode.attack() ? fishP.ranksAtLeast("admin")
                : config_1.Mode.pvp() ? fishP.ranksAtLeast("mod")
                    : fishP.ranksAtLeast("admin");
    });
    Perm.spawnOhnos = new Perm("spawnOhnos", function () { return !config_1.Mode.pvp(); }, "", "Ohnos are disabled in PVP.");
    Perm.usidCheck = new Perm("usidCheck", "trusted");
    Perm.runJS = new Perm("runJS", "manager");
    Perm.bypassNameCheck = new Perm("bypassNameCheck", "fish");
    return Perm;
}());
exports.Perm = Perm;
/**Takes an arg string, like `reason:string?` and converts it to a CommandArg. */
function processArgString(str) {
    //this was copypasted from mlogx haha
    var matchResult = str.match(/(\w+):(\w+)(\?)?/);
    if (!matchResult) {
        (0, utils_1.crash)("Bad arg string ".concat(str, ": does not match pattern word:word(?)"));
    }
    var _a = __read(matchResult, 4), name = _a[1], type = _a[2], isOptional = _a[3];
    if (commandArgTypes.includes(type)) {
        return { name: name, type: type, isOptional: !!isOptional };
    }
    else {
        (0, utils_1.crash)("Bad arg string ".concat(str, ": invalid type ").concat(type));
    }
}
function formatArg(a) {
    var isOptional = a.at(-1) == "?";
    var brackets = isOptional ? ["[", "]"] : ["<", ">"];
    return brackets[0] + a.split(":")[0] + brackets[1];
}
exports.formatArg = formatArg;
/** Joins multi-word arguments that have been groups with quotes. Ex: turns [`"a`, `b"`] into [`a b`]*/
function joinArgs(rawArgs) {
    var e_1, _a;
    var outputArgs = [];
    var groupedArg = null;
    try {
        for (var rawArgs_1 = __values(rawArgs), rawArgs_1_1 = rawArgs_1.next(); !rawArgs_1_1.done; rawArgs_1_1 = rawArgs_1.next()) {
            var arg = rawArgs_1_1.value;
            if (arg.startsWith("\"") && groupedArg == null) {
                groupedArg = [];
            }
            if (groupedArg) {
                groupedArg.push(arg);
                if (arg.endsWith("\"")) {
                    outputArgs.push(groupedArg.join(" ").slice(1, -1));
                    groupedArg = null;
                }
            }
            else {
                outputArgs.push(arg);
            }
        }
    }
    catch (e_1_1) { e_1 = { error: e_1_1 }; }
    finally {
        try {
            if (rawArgs_1_1 && !rawArgs_1_1.done && (_a = rawArgs_1.return)) _a.call(rawArgs_1);
        }
        finally { if (e_1) throw e_1.error; }
    }
    if (groupedArg != null) {
        //return `Unterminated string literal.`;
        outputArgs.push(groupedArg.join(" "));
    }
    return outputArgs;
}
/**Takes a list of joined args passed to the command, and processes it, turning it into a kwargs style object. */
function processArgs(args, processedCmdArgs, allowMenus) {
    var e_2, _a;
    if (allowMenus === void 0) { allowMenus = true; }
    var outputArgs = {};
    var unresolvedArgs = [];
    try {
        for (var _b = __values(processedCmdArgs.entries()), _c = _b.next(); !_c.done; _c = _b.next()) {
            var _d = __read(_c.value, 2), i = _d[0], cmdArg = _d[1];
            if (!(i in args) || args[i] === "") {
                //if the arg was not provided or it was empty
                if (cmdArg.isOptional) {
                    outputArgs[cmdArg.name] = null;
                }
                else if (cmdArg.type == "player" && allowMenus) {
                    outputArgs[cmdArg.name] = null;
                    unresolvedArgs.push(cmdArg);
                }
                else
                    return { error: "No value specified for arg ".concat(cmdArg.name, ". Did you type two spaces instead of one?") };
                continue;
            }
            //Deserialize the arg
            switch (cmdArg.type) {
                case "player":
                    var output = players_1.FishPlayer.getOneByString(args[i]);
                    if (output == "none")
                        return { error: "Player \"".concat(args[i], "\" not found.") };
                    else if (output == "multiple")
                        return { error: "Name \"".concat(args[i], "\" could refer to more than one player.") };
                    outputArgs[cmdArg.name] = output;
                    break;
                case "offlinePlayer":
                    if (globals_1.uuidPattern.test(args[i])) {
                        var player = players_1.FishPlayer.getById(args[i]);
                        if (player == null)
                            return { error: "Player with uuid \"".concat(args[i], "\" not found. Specify \"create:").concat(args[i], "\" to create the player.") };
                        outputArgs[cmdArg.name] = player;
                    }
                    else if (globals_1.uuidPattern.test(args[i].split("create:")[1])) {
                        outputArgs[cmdArg.name] = players_1.FishPlayer.getFromInfo(Vars.netServer.admins.getInfo(args[i].split("create:")[1]));
                    }
                    else {
                        var output_1 = players_1.FishPlayer.getOneOfflineByName(args[i]);
                        if (output_1 == "none")
                            return { error: "Player \"".concat(args[i], "\" not found.") };
                        else if (output_1 == "multiple")
                            return { error: "Name \"".concat(args[i], "\" could refer to more than one player. Try specifying by UUID.") };
                        outputArgs[cmdArg.name] = output_1;
                    }
                    break;
                case "team":
                    var team = (0, utils_1.getTeam)(args[i]);
                    if (typeof team == "string")
                        return { error: team };
                    outputArgs[cmdArg.name] = team;
                    break;
                case "number":
                    var number = Number(args[i]);
                    if (isNaN(number)) {
                        if (/\(\d+,/.test(args[i]))
                            number = Number(args[i].slice(1, -1));
                        else if (/\d+\)/.test(args[i]))
                            number = Number(args[i].slice(0, -1));
                        if (isNaN(number))
                            return { error: "Invalid number \"".concat(args[i], "\"") };
                    }
                    outputArgs[cmdArg.name] = number;
                    break;
                case "time":
                    var milliseconds = (0, utils_1.parseTimeString)(args[i]);
                    if (milliseconds == null)
                        return { error: "Invalid time string \"".concat(args[i], "\"") };
                    outputArgs[cmdArg.name] = milliseconds;
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
                        case "ye":
                        case "t":
                        case "y":
                        case "1":
                            outputArgs[cmdArg.name] = true;
                            break;
                        case "false":
                        case "no":
                        case "nah":
                        case "nay":
                        case "nope":
                        case "f":
                        case "n":
                        case "0":
                            outputArgs[cmdArg.name] = false;
                            break;
                        default: return { error: "Argument ".concat(args[i], " is not a boolean. Try \"true\" or \"false\".") };
                    }
                    break;
                case "block":
                    var block = (0, utils_1.getBlock)(args[i]);
                    if (typeof block == "string")
                        return { error: block };
                    outputArgs[cmdArg.name] = block;
                    break;
                case "unittype":
                    var unit = (0, utils_1.getUnitType)(args[i]);
                    if (typeof unit == "string")
                        return { error: unit };
                    outputArgs[cmdArg.name] = unit;
                    break;
                case "uuid":
                    if (!globals_1.uuidPattern.test(args[i]))
                        return { error: "Invalid uuid string \"".concat(args[i], "\"") };
                    outputArgs[cmdArg.name] = args[i];
                    break;
                case "map":
                    var map = Vars.maps.byName(args[i]);
                    if (map == null)
                        return { error: "Unknown map \"".concat(args[i], "\". Run [cyan]/maps[] to get a list of all maps.") };
                    break;
            }
        }
    }
    catch (e_2_1) { e_2 = { error: e_2_1 }; }
    finally {
        try {
            if (_c && !_c.done && (_a = _b.return)) _a.call(_b);
        }
        finally { if (e_2) throw e_2.error; }
    }
    return { processedArgs: outputArgs, unresolvedArgs: unresolvedArgs };
}
var outputFormatter_server = (0, utils_1.tagProcessor)(function (chunk) {
    if (chunk instanceof players_1.FishPlayer) {
        return "&c".concat(chunk.cleanedName, "&fr");
    }
    else if (chunk instanceof ranks_1.Rank) {
        return "&p".concat(chunk.name, "&fr");
    }
    else if (chunk instanceof ranks_1.RoleFlag) {
        return "&p".concat(chunk.name, "&fr");
    }
    else if (chunk instanceof Error) {
        return "&r".concat(chunk.toString(), "&fr");
    }
    else if (chunk instanceof Player) {
        var player = chunk; //not sure why this is necessary, typescript randomly converts any to unknown
        return "&cPlayer#".concat(player.id, " (").concat((0, utils_1.escapeStringColorsServer)(Strings.stripColors(player.name)), ")&fr");
    }
    else if (typeof chunk == "string") {
        if (globals_1.uuidPattern.test(chunk)) {
            return "&b".concat(chunk, "&fr");
        }
        else if (globals_1.ipPattern.test(chunk)) {
            return "&b".concat(chunk, "&fr");
        }
        else {
            return "".concat(chunk);
        }
    }
    else if (typeof chunk == "boolean") {
        return "&b".concat(chunk.toString(), "&fr");
    }
    else if (typeof chunk == "number") {
        return "&b".concat(chunk.toString(), "&fr");
    }
    else {
        return chunk;
    }
});
var outputFormatter_client = (0, utils_1.tagProcessorPartial)(function (chunk, i, data, stringChunks) {
    var _a, _b;
    var color = (_b = data !== null && data !== void 0 ? data : (_a = stringChunks[0].match(/^\[.+?\]/)) === null || _a === void 0 ? void 0 : _a[0]) !== null && _b !== void 0 ? _b : "";
    if (chunk instanceof players_1.FishPlayer) {
        return "[cyan]\"".concat(chunk.player.coloredName(), "[cyan]\"") + color;
    }
    else if (chunk instanceof ranks_1.Rank) {
        return "[cyan]\"".concat(chunk.coloredName(), "[cyan]\"") + color;
    }
    else if (chunk instanceof ranks_1.RoleFlag) {
        return "[cyan]\"".concat(chunk.coloredName(), "[cyan]\"") + color;
    }
    else if (chunk instanceof Error) {
        return "[red]".concat(chunk.toString()) + color;
    }
    else if (chunk instanceof Player) {
        var player = chunk; //not sure why this is necessary, typescript randomly converts any to unknown
        return "[cyan]\"".concat(player.coloredName(), "[cyan]\"") + color;
    }
    else if (typeof chunk == "string") {
        if (globals_1.uuidPattern.test(chunk)) {
            return "[blue]".concat(chunk, "[]");
        }
        else if (globals_1.ipPattern.test(chunk)) {
            return "[blue]".concat(chunk, "[]");
        }
        else {
            //TODO reset color?
            return chunk;
        }
    }
    else if (typeof chunk == "boolean") {
        return "[blue]".concat(chunk.toString(), "[]");
    }
    else if (typeof chunk == "number") {
        return "[blue]".concat(chunk.toString(), "[]");
    }
    else if (chunk instanceof Administration.PlayerInfo) {
        return chunk.lastName + color;
    }
    else {
        return chunk; //allow it to get stringified by the engine
    }
});
exports.CommandError = (function () { });
Object.setPrototypeOf(exports.CommandError.prototype, Error.prototype);
function fail(message) {
    var err = new Error(typeof message == "string" ? message : "");
    //oh god it's even worse now because i have to smuggle a function through here
    err.data = message;
    Object.setPrototypeOf(err, exports.CommandError.prototype);
    throw err;
}
exports.fail = fail;
/**Converts the CommandArg[] to the format accepted by Arc CommandHandler */
function convertArgs(processedCmdArgs, allowMenus) {
    return processedCmdArgs.map(function (arg, index, array) {
        var isOptional = (arg.isOptional || (arg.type == "player" && allowMenus)) && !array.slice(index + 1).some(function (c) { return !c.isOptional; });
        var brackets = isOptional ? ["[", "]"] : ["<", ">"];
        //if the arg is a string and last argument, make it variadic (so if `/warn player a b c d` is run, the last arg is "a b c d" not "a")
        return brackets[0] + arg.name + (["player", "string"].includes(arg.type) && index + 1 == array.length ? "..." : "") + brackets[1];
    }).join(" ");
}
function handleTapEvent(event) {
    var _a;
    var sender = players_1.FishPlayer.get(event.player);
    if (sender.tapInfo.commandName == null)
        return;
    var command = exports.allCommands[sender.tapInfo.commandName];
    var usageData = sender.getUsageData(sender.tapInfo.commandName);
    try {
        var failed_1 = false;
        (_a = command.tapped) === null || _a === void 0 ? void 0 : _a.call(command, {
            args: sender.tapInfo.lastArgs,
            data: command.data,
            outputFail: function (message) { (0, utils_1.outputFail)(message, sender); failed_1 = true; },
            outputSuccess: function (message) { return (0, utils_1.outputSuccess)(message, sender); },
            output: function (message) { return (0, utils_1.outputMessage)(message, sender); },
            admins: Vars.netServer.admins,
            commandLastUsed: usageData.lastUsed,
            commandLastUsedSuccessfully: usageData.lastUsedSuccessfully,
            lastUsed: usageData.tapLastUsed,
            lastUsedSuccessfully: usageData.tapLastUsedSuccessfully,
            sender: sender,
            tile: event.tile,
            x: event.tile.x,
            y: event.tile.y,
        });
        if (!failed_1)
            usageData.tapLastUsedSuccessfully = Date.now();
    }
    catch (err) {
        if (err instanceof exports.CommandError) {
            //If the error is a command error, then just outputFail
            (0, utils_1.outputFail)(err.data, sender);
        }
        else {
            sender.sendMessage("[scarlet]\u274C An error occurred while executing the command!");
            if (sender.hasPerm("seeErrorMessages"))
                sender.sendMessage((0, utils_1.parseError)(err));
            Log.err("Unhandled error in command execution: ".concat(sender.cleanedName, " ran /").concat(sender.tapInfo.commandName, " and tapped"));
            Log.err(err);
        }
    }
    finally {
        if (sender.tapInfo.mode == "once") {
            sender.tapInfo.commandName = null;
        }
        usageData.tapLastUsed = Date.now();
    }
}
exports.handleTapEvent = handleTapEvent;
/**
 * Registers all commands in a list to a client command handler.
 **/
function register(commands, clientHandler, serverHandler) {
    var e_3, _a;
    var _loop_1 = function (name, data) {
        //Process the args
        var processedCmdArgs = data.args.map(processArgString);
        clientHandler.removeCommand(name); //The function silently fails if the argument doesn't exist so this is safe
        clientHandler.register(name, convertArgs(processedCmdArgs, true), data.description, new CommandHandler.CommandRunner({ accept: function (unjoinedRawArgs, sender) {
                var _a;
                if (!initialized)
                    (0, utils_1.crash)("Commands not initialized!");
                var fishSender = players_1.FishPlayer.get(sender);
                players_1.FishPlayer.onPlayerCommand(fishSender, name, unjoinedRawArgs);
                //Verify authorization
                //as a bonus, this crashes if data.perm is undefined
                if (!data.perm.check(fishSender)) {
                    (0, utils_1.outputFail)((_a = data.customUnauthorizedMessage) !== null && _a !== void 0 ? _a : data.perm.unauthorizedMessage, sender);
                    return;
                }
                //closure over processedCmdArgs, should be fine
                //Process the args
                var rawArgs = joinArgs(unjoinedRawArgs);
                var output = processArgs(rawArgs, processedCmdArgs);
                if ("error" in output) {
                    //if args are invalid
                    (0, utils_1.outputFail)(output.error, sender);
                    return;
                }
                //Recursively resolve unresolved args (such as players that need to be determined through a menu)
                resolveArgsRecursive(output.processedArgs, output.unresolvedArgs, fishSender, function () {
                    var _a;
                    //Run the command handler
                    var usageData = fishSender.getUsageData(name);
                    var failed = false;
                    try {
                        data.handler({
                            rawArgs: rawArgs,
                            args: output.processedArgs,
                            sender: fishSender,
                            data: data.data,
                            outputFail: function (message) { (0, utils_1.outputFail)(message, sender); failed = true; },
                            outputSuccess: function (message) { return (0, utils_1.outputSuccess)(message, sender); },
                            output: function (message) { return (0, utils_1.outputMessage)(message, sender); },
                            f: outputFormatter_client,
                            execServer: function (command) { return serverHandler.handleMessage(command); },
                            admins: Vars.netServer.admins,
                            lastUsedSender: usageData.lastUsed,
                            lastUsedSuccessfullySender: usageData.lastUsedSuccessfully,
                            lastUsedSuccessfully: ((_a = globalUsageData[name]) !== null && _a !== void 0 ? _a : (globalUsageData[name] = { lastUsed: -1, lastUsedSuccessfully: -1 })).lastUsedSuccessfully,
                            allCommands: exports.allCommands,
                            currentTapMode: fishSender.tapInfo.commandName == null ? "off" : fishSender.tapInfo.mode,
                            handleTaps: function (mode) {
                                if (data.tapped == undefined)
                                    (0, utils_1.crash)("No tap handler to activate: command \"".concat(name, "\""));
                                if (mode == "off") {
                                    fishSender.tapInfo.commandName = null;
                                }
                                else {
                                    fishSender.tapInfo.commandName = name;
                                    fishSender.tapInfo.mode = mode;
                                }
                                fishSender.tapInfo.lastArgs = output.processedArgs;
                            },
                        });
                        //Update usage data
                        if (!failed) {
                            usageData.lastUsedSuccessfully = globalUsageData[name].lastUsedSuccessfully = Date.now();
                        }
                    }
                    catch (err) {
                        if (err instanceof exports.CommandError) {
                            //If the error is a command error, then just outputFail
                            (0, utils_1.outputFail)(err.data, sender);
                        }
                        else {
                            sender.sendMessage("[scarlet]\u274C An error occurred while executing the command!");
                            if (fishSender.hasPerm("seeErrorMessages"))
                                sender.sendMessage((0, utils_1.parseError)(err));
                            Log.err("Unhandled error in command execution: ".concat(fishSender.cleanedName, " ran /").concat(fishSender.tapInfo.commandName));
                            Log.err(err);
                        }
                    }
                    finally {
                        usageData.lastUsed = globalUsageData[name].lastUsed = Date.now();
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
    catch (e_3_1) { e_3 = { error: e_3_1 }; }
    finally {
        try {
            if (_c && !_c.done && (_a = _b.return)) _a.call(_b);
        }
        finally { if (e_3) throw e_3.error; }
    }
}
exports.register = register;
function registerConsole(commands, serverHandler) {
    var e_4, _a;
    var _loop_2 = function (name, data) {
        //Cursed for of loop due to lack of object.entries
        //Process the args
        var processedCmdArgs = data.args.map(processArgString);
        serverHandler.removeCommand(name); //The function silently fails if the argument doesn't exist so this is safe
        serverHandler.register(name, convertArgs(processedCmdArgs, false), data.description, new CommandHandler.CommandRunner({ accept: function (rawArgs) {
                var _a;
                var _b;
                if (!initialized)
                    (0, utils_1.crash)("Commands not initialized!");
                //closure over processedCmdArgs, should be fine
                //Process the args
                var output = processArgs(rawArgs, processedCmdArgs, false);
                if ("error" in output) {
                    //ifargs are invalid
                    Log.warn(output.error);
                    return;
                }
                var usageData = ((_a = globalUsageData[_b = "_console_" + name]) !== null && _a !== void 0 ? _a : (globalUsageData[_b] = { lastUsed: -1, lastUsedSuccessfully: -1 }));
                try {
                    var failed_2 = false;
                    data.handler(__assign({ rawArgs: rawArgs, args: output.processedArgs, data: data.data, outputFail: function (message) { Log.err("".concat(message)); failed_2 = true; }, outputSuccess: function (message) { return Log.info("".concat(message)); }, output: function (message) { return Log.info(message); }, execServer: function (command) { return serverHandler.handleMessage(command); }, admins: Vars.netServer.admins }, usageData));
                    usageData.lastUsed = Date.now();
                    if (!failed_2)
                        usageData.lastUsedSuccessfully = Date.now();
                }
                catch (err) {
                    usageData.lastUsed = Date.now();
                    if (err instanceof exports.CommandError) {
                        Log.warn(typeof err.data == "function" ? err.data("&fr") : err.data);
                    }
                    else {
                        Log.err("&lrAn error occured while executing the command!&fr");
                        Log.err((0, utils_1.parseError)(err));
                    }
                }
            } }));
        exports.allConsoleCommands[name] = data;
    };
    try {
        for (var _b = __values(Object.entries(commands)), _c = _b.next(); !_c.done; _c = _b.next()) {
            var _d = __read(_c.value, 2), name = _d[0], data = _d[1];
            _loop_2(name, data);
        }
    }
    catch (e_4_1) { e_4 = { error: e_4_1 }; }
    finally {
        try {
            if (_c && !_c.done && (_a = _b.return)) _a.call(_b);
        }
        finally { if (e_4) throw e_4.error; }
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
                Groups.player.each(function (player) { return optionsList_1.push(player); });
                break;
            default: (0, utils_1.crash)("Unable to resolve arg of type ".concat(argToResolve_1.type));
        }
        (0, menus_1.menu)("Select a player", "Select a player for the argument \"".concat(argToResolve_1.name, "\""), optionsList_1, sender, function (_a) {
            var option = _a.option;
            processedArgs[argToResolve_1.name] = players_1.FishPlayer.get(option);
            resolveArgsRecursive(processedArgs, unresolvedArgs, sender, callback);
        }, true, function (player) { return player.name; });
    }
}
function initialize() {
    var e_5, _a, e_6, _b;
    var _c, _d;
    if (initialized) {
        (0, utils_1.crash)("Already initialized commands.");
    }
    try {
        for (var _e = __values(Object.entries(exports.allConsoleCommands)), _f = _e.next(); !_f.done; _f = _e.next()) {
            var _g = __read(_f.value, 2), key = _g[0], command_1 = _g[1];
            command_1.data = (_c = command_1.init) === null || _c === void 0 ? void 0 : _c.call(command_1);
        }
    }
    catch (e_5_1) { e_5 = { error: e_5_1 }; }
    finally {
        try {
            if (_f && !_f.done && (_a = _e.return)) _a.call(_e);
        }
        finally { if (e_5) throw e_5.error; }
    }
    try {
        for (var _h = __values(Object.entries(exports.allCommands)), _j = _h.next(); !_j.done; _j = _h.next()) {
            var _k = __read(_j.value, 2), key = _k[0], command_2 = _k[1];
            command_2.data = (_d = command_2.init) === null || _d === void 0 ? void 0 : _d.call(command_2);
        }
    }
    catch (e_6_1) { e_6 = { error: e_6_1 }; }
    finally {
        try {
            if (_j && !_j.done && (_b = _h.return)) _b.call(_h);
        }
        finally { if (e_6) throw e_6.error; }
    }
    initialized = true;
}
exports.initialize = initialize;
