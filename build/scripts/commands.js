"use strict";
/*
Copyright © BalaM314, 2024. All Rights Reserved.
This file contains the commands system.
*/
//Behold, the power of typescript!
var __makeTemplateObject = (this && this.__makeTemplateObject) || function (cooked, raw) {
    if (Object.defineProperty) { Object.defineProperty(cooked, "raw", { value: raw }); } else { cooked.raw = raw; }
    return cooked;
};
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
exports.CommandError = exports.Req = exports.Perm = exports.consoleCommandList = exports.commandList = exports.allConsoleCommands = exports.allCommands = void 0;
exports.command = command;
exports.formatArg = formatArg;
exports.fail = fail;
exports.handleTapEvent = handleTapEvent;
exports.register = register;
exports.registerConsole = registerConsole;
exports.initialize = initialize;
var config_1 = require("./config");
var globals_1 = require("./globals");
var menus_1 = require("./menus");
var players_1 = require("./players");
var ranks_1 = require("./ranks");
var utils_1 = require("./utils");
var funcs_1 = require("./funcs");
var funcs_2 = require("./funcs");
var funcs_3 = require("./funcs");
var funcs_4 = require("./funcs");
var hiddenUnauthorizedMessage = "[scarlet]Unknown command. Check [lightgray]/help[scarlet].";
var initialized = false;
/** Stores all chat comamnds by their name. */
exports.allCommands = {};
/** Stores all console commands by their name. */
exports.allConsoleCommands = {};
/** Stores the last usage data for chat commands by their name. */
var globalUsageData = {};
/** All valid command arg types. */
var commandArgTypes = [
    "string", "number", "boolean", "player", /*"menuPlayer",*/ "team", "time", "unittype", "block",
    "uuid", "offlinePlayer", "map", "rank", "roleflag",
];
/** Helper function to get the correct type for command lists. */
var commandList = function (list) { return list; };
exports.commandList = commandList;
/** Helper function to get the correct type for command lists. */
var consoleCommandList = function (list) { return list; };
exports.consoleCommandList = consoleCommandList;
/**
 * Helper function to get the correct type definitions for commands that use "data" or init().
 * Necessary because, while typescript is capable of inferring A1, A2...
 * ```
 * {
 * 	prop1: Type<A1>;
 * 	prop2: Type<A2>;
 * }
 * ```
 * it cannot handle inferring A1 and B1.
 * ```
 * {
 * 	prop1: Type<A1, B1>;
 * 	prop2: Type<A2, B2>;
 * }
 * ```
 */
function command(input) {
    return input;
}
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
                (0, funcs_4.crash)("Invalid perm ".concat(name, ": invalid rank name ").concat(check));
            this.check = function (fishP) { return fishP.ranksAtLeast(check); };
        }
        else {
            this.check = check;
        }
        Perm.perms[name] = this;
    }
    Perm.fromRank = function (rank) {
        return new Perm(rank.name, function (fishP) { return fishP.ranksAtLeast(rank); }, rank.color);
    };
    Perm.getByName = function (name) {
        var _a;
        return (_a = Perm.perms[name]) !== null && _a !== void 0 ? _a : (0, funcs_4.crash)("Invalid requiredPerm");
    };
    Perm.perms = {};
    Perm.none = new Perm("all", function (fishP) { return true; }, "[sky]");
    Perm.trusted = Perm.fromRank(ranks_1.Rank.trusted);
    Perm.mod = Perm.fromRank(ranks_1.Rank.mod);
    Perm.admin = Perm.fromRank(ranks_1.Rank.admin);
    Perm.member = new Perm("member", function (fishP) { return fishP.hasFlag("member") && !fishP.marked(); }, "[pink]", "You must have a ".concat(config_1.FColor.member(templateObject_1 || (templateObject_1 = __makeTemplateObject(["Fish Membership"], ["Fish Membership"]))), " to use this command. Get a Fish Membership at[sky] ").concat(config_1.text.membershipURL, " []"));
    Perm.chat = new Perm("chat", function (fishP) { return (!fishP.muted && !fishP.autoflagged) || fishP.ranksAtLeast("mod"); });
    Perm.bypassChatFilter = new Perm("bypassChatFilter", "admin");
    Perm.seeMutedMessages = new Perm("seeMutedMessages", function (fishP) { return fishP.muted || fishP.autoflagged || fishP.ranksAtLeast("mod"); });
    Perm.play = new Perm("play", function (fishP) { return !fishP.stelled() || fishP.ranksAtLeast("mod"); });
    Perm.seeErrorMessages = new Perm("seeErrorMessages", "admin");
    Perm.viewUUIDs = new Perm("viewUUIDs", "admin");
    Perm.blockTrolling = new Perm("blockTrolling", function (fishP) { return fishP.rank === ranks_1.Rank.pi; });
    Perm.visualEffects = new Perm("visualEffects", function (fishP) { return !fishP.stelled() || fishP.ranksAtLeast("mod"); });
    Perm.bulkVisualEffects = new Perm("bulkVisualEffects", function (fishP) { return ((fishP.hasFlag("developer") || fishP.hasFlag("illusionist") || fishP.hasFlag("member")) && !fishP.stelled())
        || fishP.ranksAtLeast("mod"); });
    Perm.bypassVoteFreeze = new Perm("bypassVoteFreeze", "trusted");
    Perm.bypassVotekick = new Perm("bypassVotekick", "mod");
    Perm.warn = new Perm("warn", "mod");
    Perm.vanish = new Perm("vanish", "mod");
    Perm.changeTeam = new Perm("changeTeam", function (fishP) {
        switch (true) {
            case config_1.Gamemode.sandbox(): return fishP.ranksAtLeast("trusted");
            case config_1.Gamemode.attack(): return fishP.ranksAtLeast("admin");
            case config_1.Gamemode.hexed(): return fishP.ranksAtLeast("mod");
            case config_1.Gamemode.pvp(): return fishP.ranksAtLeast("trusted");
            default: return fishP.ranksAtLeast("admin");
        }
    });
    /** Whether players should be allowed to change the team of a unit or building. If not, they will be kicked out of their current unit or building before switching teams. */
    Perm.changeTeamExternal = new Perm("changeTeamExternal", function (fishP) {
        return config_1.Gamemode.sandbox() ? fishP.ranksAtLeast("trusted") : fishP.ranksAtLeast("admin");
    });
    Perm.spawnOhnos = new Perm("spawnOhnos", function () { return !config_1.Gamemode.pvp(); }, "", "Ohnos are disabled in PVP.");
    Perm.usidCheck = new Perm("usidCheck", "trusted");
    Perm.runJS = new Perm("runJS", "manager");
    Perm.bypassNameCheck = new Perm("bypassNameCheck", "fish");
    Perm.hardcore = new Perm("hardcore", "trusted");
    Perm.massKill = new Perm("massKill", function (fishP) { return config_1.Gamemode.sandbox() ? fishP.ranksAtLeast("mod") : fishP.ranksAtLeast("admin"); });
    return Perm;
}());
exports.Perm = Perm;
exports.Req = {
    mode: function (mode) { return function () {
        return config_1.Gamemode[mode]()
            || fail("This command is only available in ".concat((0, utils_1.formatModeName)(mode)));
    }; },
    modeNot: function (mode) { return function () {
        return !config_1.Gamemode[mode]()
            || fail("This command is disabled in ".concat((0, utils_1.formatModeName)(mode)));
    }; },
    moderate: function (argName, allowSameRank, minimumLevel, allowSelfIfUnauthorized) {
        if (allowSameRank === void 0) { allowSameRank = false; }
        if (minimumLevel === void 0) { minimumLevel = "mod"; }
        if (allowSelfIfUnauthorized === void 0) { allowSelfIfUnauthorized = false; }
        return function (_a) {
            var args = _a.args, sender = _a.sender;
            return (sender.canModerate(args[argName], !allowSameRank, minimumLevel, allowSelfIfUnauthorized)
                || fail("You do not have permission to perform moderation actions on this player."));
        };
    },
    cooldown: function (durationMS) { return function (_a) {
        var lastUsedSuccessfullySender = _a.lastUsedSuccessfullySender;
        return Date.now() - lastUsedSuccessfullySender >= durationMS
            || fail("This command was run recently and is on cooldown.");
    }; },
    cooldownGlobal: function (durationMS) { return function (_a) {
        var lastUsedSuccessfullySender = _a.lastUsedSuccessfullySender;
        return Date.now() - lastUsedSuccessfullySender >= durationMS
            || fail("This command was run recently and is on cooldown.");
    }; },
    gameRunning: function () {
        return !Vars.state.gameOver
            || fail("This game is over, please wait for the next map to load.");
    }
};
/** Takes an arg string, like `reason:string?` and converts it to a CommandArg. */
function processArgString(str) {
    //this was copypasted from mlogx haha
    var matchResult = str.match(/(\w+):(\w+)(\?)?/);
    if (!matchResult) {
        (0, funcs_4.crash)("Bad arg string ".concat(str, ": does not match pattern word:word(?)"));
    }
    var _a = __read(matchResult, 4), name = _a[1], type = _a[2], isOptional = _a[3];
    if (commandArgTypes.includes(type)) {
        return { name: name, type: type, isOptional: !!isOptional };
    }
    else {
        (0, funcs_4.crash)("Bad arg string ".concat(str, ": invalid type ").concat(type));
    }
}
function formatArg(a) {
    var isOptional = a.at(-1) == "?";
    var brackets = isOptional ? ["[", "]"] : ["<", ">"];
    return brackets[0] + a.split(":")[0] + brackets[1];
}
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
/** Takes a list of joined args passed to the command, and processes it, turning it into a kwargs style object. */
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
                            return { error: "Name \"".concat(args[i], "\" could refer to more than one player. Try specifying by ID.") };
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
                    var block = (0, utils_1.getBlock)(args[i], "air");
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
                    var map = (0, utils_1.getMap)(args[i]);
                    if (map == "none")
                        return { error: "Map \"".concat(args[i], "\" not found.") };
                    else if (map == "multiple")
                        return { error: "Name \"".concat(args[i], "\" could refer to more than one map. Be more specific.") };
                    outputArgs[cmdArg.name] = map;
                    break;
                case "rank":
                    var ranks = ranks_1.Rank.getByInput(args[i]);
                    if (ranks.length == 0)
                        return { error: "Unknown rank \"".concat(args[i], "\"") };
                    if (ranks.length > 1)
                        return { error: "Ambiguous rank \"".concat(args[i], "\"") };
                    outputArgs[cmdArg.name] = ranks[0];
                    break;
                case "roleflag":
                    var roleflags = ranks_1.RoleFlag.getByInput(args[i]);
                    if (roleflags.length == 0)
                        return { error: "Unknown role flag \"".concat(args[i], "\"") };
                    if (roleflags.length > 1)
                        return { error: "Ambiguous role flag \"".concat(args[i], "\"") };
                    outputArgs[cmdArg.name] = roleflags[0];
                    break;
                default:
                    cmdArg.type;
                    (0, funcs_4.crash)("impossible");
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
var outputFormatter_server = (0, funcs_1.tagProcessorPartial)(function (chunk) {
    if (chunk instanceof players_1.FishPlayer) {
        return "&c(".concat((0, funcs_3.escapeStringColorsServer)(chunk.cleanedName), ")&fr");
    }
    else if (chunk instanceof ranks_1.Rank) {
        return "&p".concat(chunk.name, "&fr");
    }
    else if (chunk instanceof ranks_1.RoleFlag) {
        return "&p".concat(chunk.name, "&fr");
    }
    else if (chunk instanceof Error) {
        return "&r".concat((0, funcs_3.escapeStringColorsServer)(chunk.toString()), "&fr");
    }
    else if (chunk instanceof Player) {
        var player = chunk; //not sure why this is necessary, typescript randomly converts any to unknown
        return "&cPlayer#".concat(player.id, " (").concat((0, funcs_3.escapeStringColorsServer)(Strings.stripColors(player.name)), ")&fr");
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
    else if (chunk instanceof Administration.PlayerInfo) {
        return "&c".concat((0, funcs_3.escapeStringColorsServer)(chunk.plainLastName()), "&fr");
    }
    else if (chunk instanceof UnitType) {
        return "&c".concat(chunk.localizedName, "&fr");
    }
    else if (chunk instanceof Block) {
        return "&c".concat(chunk.localizedName, "&fr");
    }
    else if (chunk instanceof Team) {
        return "&c".concat(chunk.name, "&fr");
    }
    else {
        chunk;
        Log.err("Invalid format object!");
        Log.info(chunk);
        return chunk; //let it get stringified by the JS engine
    }
});
var outputFormatter_client = (0, funcs_1.tagProcessorPartial)(function (chunk, i, data, stringChunks) {
    var _a, _b;
    var reset = (_b = data !== null && data !== void 0 ? data : (_a = stringChunks[0].match(/^\[.+?\]/)) === null || _a === void 0 ? void 0 : _a[0]) !== null && _b !== void 0 ? _b : "";
    if (chunk instanceof players_1.FishPlayer) {
        return "[cyan](".concat(chunk.name, "[cyan])") + reset;
    }
    else if (chunk instanceof ranks_1.Rank) {
        return "".concat(chunk.color).concat(chunk.name, "[]") + reset;
    }
    else if (chunk instanceof ranks_1.RoleFlag) {
        return "".concat(chunk.color).concat(chunk.name, "[]") + reset;
    }
    else if (chunk instanceof Error) {
        return "[red]".concat(chunk.toString()) + reset;
    }
    else if (chunk instanceof Player) {
        var fishP = players_1.FishPlayer.get(chunk);
        return "[cyan](".concat(fishP.name, "[cyan])") + reset;
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
        return chunk.lastName + reset;
    }
    else if (chunk instanceof UnitType) {
        return "[cyan]".concat(chunk.localizedName, "[]");
    }
    else if (chunk instanceof Block) {
        return "[cyan]".concat(chunk.localizedName, "[]");
    }
    else if (chunk instanceof Team) {
        return "[white]".concat(chunk.coloredName(), "[][]");
    }
    else {
        chunk;
        Log.err("Invalid format object!");
        Log.info(chunk);
        return chunk; //allow it to get stringified by the engine
    }
});
exports.CommandError = (function () { });
Object.setPrototypeOf(exports.CommandError.prototype, Error.prototype);
function fail(message) {
    var err = new Error(typeof message == "string" ? message : "");
    //oh no it's even worse now because i have to smuggle a function through here
    err.data = message;
    Object.setPrototypeOf(err, exports.CommandError.prototype);
    throw err;
}
var variadicArgumentTypes = ["player", "string", "map"];
/** Converts the CommandArg[] to the format accepted by Arc CommandHandler */
function convertArgs(processedCmdArgs, allowMenus) {
    return processedCmdArgs.map(function (arg, index, array) {
        var isOptional = (arg.isOptional || (arg.type == "player" && allowMenus)) && !array.slice(index + 1).some(function (c) { return !c.isOptional; });
        var brackets = isOptional ? ["[", "]"] : ["<", ">"];
        //if the arg is a string and last argument, make it variadic (so if `/warn player a b c d` is run, the last arg is "a b c d" not "a")
        return brackets[0] + arg.name + (variadicArgumentTypes.includes(arg.type) && index + 1 == array.length ? "..." : "") + brackets[1];
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
            f: outputFormatter_client,
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
                sender.sendMessage((0, funcs_2.parseError)(err));
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
/**
 * Registers all commands in a list to a client command handler.
 **/
function register(commands, clientHandler, serverHandler) {
    var e_3, _a;
    var _loop_1 = function (name, _data) {
        var data = typeof _data == "function" ? _data() : _data;
        //Process the args
        var processedCmdArgs = data.args.map(processArgString);
        clientHandler.removeCommand(name); //The function silently fails if the argument doesn't exist so this is safe
        clientHandler.register(name, convertArgs(processedCmdArgs, true), data.description, new CommandHandler.CommandRunner({ accept: function (unjoinedRawArgs, sender) {
                if (!initialized)
                    (0, funcs_4.crash)("Commands not initialized!");
                var fishSender = players_1.FishPlayer.get(sender);
                players_1.FishPlayer.onPlayerCommand(fishSender, name, unjoinedRawArgs);
                //Verify authorization
                //as a bonus, this crashes if data.perm is undefined
                if (!data.perm.check(fishSender)) {
                    if (data.customUnauthorizedMessage)
                        (0, utils_1.outputFail)(data.customUnauthorizedMessage, sender);
                    else if (data.isHidden)
                        (0, utils_1.outputMessage)(hiddenUnauthorizedMessage, sender);
                    else
                        (0, utils_1.outputFail)(data.perm.unauthorizedMessage, sender);
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
                    var _a, _b;
                    //Run the command handler
                    var usageData = fishSender.getUsageData(name);
                    var failed = false;
                    try {
                        var args_1 = {
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
                                    (0, funcs_4.crash)("No tap handler to activate: command \"".concat(name, "\""));
                                if (mode == "off") {
                                    fishSender.tapInfo.commandName = null;
                                }
                                else {
                                    fishSender.tapInfo.commandName = name;
                                    fishSender.tapInfo.mode = mode;
                                }
                                fishSender.tapInfo.lastArgs = output.processedArgs;
                            },
                        };
                        (_b = data.requirements) === null || _b === void 0 ? void 0 : _b.forEach(function (r) { return r(args_1); });
                        data.handler(args_1);
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
                                sender.sendMessage((0, funcs_2.parseError)(err));
                            Log.err("Unhandled error in command execution: ".concat(fishSender.cleanedName, " ran /").concat(name));
                            Log.err(err);
                            Log.err(err.stack);
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
            var _d = __read(_c.value, 2), name = _d[0], _data = _d[1];
            _loop_1(name, _data);
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
                    (0, funcs_4.crash)("Commands not initialized!");
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
                    data.handler(__assign({ rawArgs: rawArgs, args: output.processedArgs, data: data.data, outputFail: function (message) { (0, utils_1.outputConsole)(message, Log.err); failed_2 = true; }, outputSuccess: utils_1.outputConsole, output: utils_1.outputConsole, f: outputFormatter_server, execServer: function (command) { return serverHandler.handleMessage(command); }, admins: Vars.netServer.admins }, usageData));
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
                        Log.err((0, funcs_2.parseError)(err));
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
/** Recursively resolves args. This function is necessary to handle cases such as a command that accepts multiple players that all need to be selected through menus. */
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
            default: (0, funcs_4.crash)("Unable to resolve arg of type ".concat(argToResolve_1.type));
        }
        (0, menus_1.menu)("Select a player", "Select a player for the argument \"".concat(argToResolve_1.name, "\""), optionsList_1, sender, function (_a) {
            var option = _a.option;
            processedArgs[argToResolve_1.name] = players_1.FishPlayer.get(option);
            resolveArgsRecursive(processedArgs, unresolvedArgs, sender, callback);
        }, true, function (player) { return Strings.stripColors(player.name).length >= 3 ? Strings.stripColors(player.name) : (0, funcs_3.escapeStringColorsClient)(player.name); });
    }
}
function initialize() {
    var e_5, _a, e_6, _b;
    if (initialized) {
        (0, funcs_4.crash)("Already initialized commands.");
    }
    try {
        for (var _c = __values(Object.entries(exports.allConsoleCommands)), _d = _c.next(); !_d.done; _d = _c.next()) {
            var _e = __read(_d.value, 2), key = _e[0], command_1 = _e[1];
            if (command_1.init)
                command_1.data = command_1.init();
        }
    }
    catch (e_5_1) { e_5 = { error: e_5_1 }; }
    finally {
        try {
            if (_d && !_d.done && (_a = _c.return)) _a.call(_c);
        }
        finally { if (e_5) throw e_5.error; }
    }
    try {
        for (var _f = __values(Object.entries(exports.allCommands)), _g = _f.next(); !_g.done; _g = _f.next()) {
            var _h = __read(_g.value, 2), key = _h[0], command_2 = _h[1];
            if (command_2.init)
                command_2.data = command_2.init();
        }
    }
    catch (e_6_1) { e_6 = { error: e_6_1 }; }
    finally {
        try {
            if (_g && !_g.done && (_b = _f.return)) _b.call(_f);
        }
        finally { if (e_6) throw e_6.error; }
    }
    initialized = true;
}
var templateObject_1;
