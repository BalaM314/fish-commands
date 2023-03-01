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
var menus = require('menus');
var players = require("players");
/**
 * Misc notes:
 * I made a handful of arbitrary choices, you can change them if you want
 * this is very, very incomplete
 * the api I want seems feasible to implement
 * maybe we should abstract away the "select a player" menu?
 */
/** Represents a permission level that is required to run a specific command. */
var PermissionsLevel;
(function (PermissionsLevel) {
    PermissionsLevel["all"] = "all";
    PermissionsLevel["player"] = "player";
    PermissionsLevel["mod"] = "mod";
    PermissionsLevel["admin"] = "admin";
})(PermissionsLevel || (PermissionsLevel = {}));
var commandArgTypes = ["string", "number", "boolean", "player"];
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
function processArgs(args, processedCmdArgs) {
    var e_1, _a;
    var outputArgs = {};
    try {
        for (var _b = __values(processedCmdArgs.entries()), _c = _b.next(); !_c.done; _c = _b.next()) {
            var _d = __read(_c.value, 2), i = _d[0], cmdArg = _d[1];
            if (!args[i]) {
                if (cmdArg.isOptional) {
                    outputArgs[cmdArg.name] = null;
                    continue;
                }
                else {
                    throw new Error("arg parsing failed");
                }
            }
            switch (cmdArg.type) {
                case "player":
                    var player = players.getPByName(args[i]);
                    if (player == null)
                        return "Player \"".concat(args[i], "\" not found.");
                    outputArgs[cmdArg.name] = player;
                    break;
                case "number":
                    var number = parseInt(args[i]);
                    if (isNaN(number))
                        return "Invalid number \"".concat(args[i], "\"");
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
                            outputArgs[cmdArg.name] = true;
                            break;
                        default:
                            return "Argument ".concat(args[i], " is not a boolean. Try \"true\" or \"false\".");
                            break;
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
    return outputArgs;
}
//const cause why not?
var canPlayerAccess = function canPlayerAccess(player, level) {
    switch (level) {
        case PermissionsLevel.all: return true;
        case PermissionsLevel.player: return !player.stopped || player.mod || player.admin;
        case PermissionsLevel.mod: return player.mod || player.admin;
        case PermissionsLevel.admin: return player.admin;
    }
};
function register(commands, clientCommands, runner) {
    var e_2, _a;
    function outputFail(message, sender) {
        sender.sendMessage("[scarlet]\u26A0 [yellow]".concat(message));
    }
    function outputSuccess(message, sender) {
        sender.sendMessage("[#48e076]".concat(message));
    }
    var _loop_1 = function (name) {
        var data = commands[name];
        var processedCmdArgs = data.args.map(processArgString);
        clientCommands.register(name, processedCmdArgs.map(function (arg, index, array) {
            var brackets = arg.isOptional ? ["[", "]"] : ["<", ">"];
            return brackets[0] + arg.name + (arg.type == "string" && index + 1 == array.length ? "..." : "") + brackets[1];
        }).join(" "), data.description, 
        //closure over processedCmdArgs, should be fine
        runner(function (rawArgs, sender) {
            var _a;
            var fishSender = players.getP(sender);
            if (!canPlayerAccess(fishSender, data.level)) {
                outputFail((_a = data.customUnauthorizedMessage) !== null && _a !== void 0 ? _a : "You do not have the required permission (".concat(data.level, ") to execute this command"), sender);
                return;
            }
            var output = processArgs(rawArgs, processedCmdArgs);
            if (typeof output == "string") {
                //args are invalid
                outputFail(output, sender);
                return;
            }
            data.handler({
                rawArgs: rawArgs,
                args: output,
                sender: fishSender,
                //getP was modified for this to work
                outputFail: function (message) { return outputFail(message, sender); },
                outputSuccess: function (message) { return outputSuccess(message, sender); },
            });
        }));
    };
    try {
        for (var _b = __values(Object.keys(commands)), _c = _b.next(); !_c.done; _c = _b.next()) {
            var name = _c.value;
            _loop_1(name);
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
module.exports = {
    register: register,
    PermissionsLevel: PermissionsLevel
};
