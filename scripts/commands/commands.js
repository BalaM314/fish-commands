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
exports.register = exports.canPlayerAccess = exports.PermissionsLevel = void 0;
var menus_1 = require("../menus");
var players = require("players");
/**
 * Misc notes:
 * I made a handful of arbitrary choices, you can change them if you want
 * the api i wanted is pretty much complete, we just need to port over the commands and maybe abstract away the "select a player" menu?
 */
/** Represents a permission level that is required to run a specific command. */
var PermissionsLevel = /** @class */ (function () {
    function PermissionsLevel(name, customErrorMessage) {
        this.name = name;
        this.customErrorMessage = customErrorMessage;
    }
    PermissionsLevel.all = new PermissionsLevel("all");
    PermissionsLevel.player = new PermissionsLevel("player");
    PermissionsLevel.mod = new PermissionsLevel("mod");
    PermissionsLevel.admin = new PermissionsLevel("admin");
    PermissionsLevel.member = new PermissionsLevel("member", "You must have a [scarlet]Fish Membership[yellow] to use this command. Subscribe on the [sky]/discord[yellow]!");
    return PermissionsLevel;
}());
exports.PermissionsLevel = PermissionsLevel;
var commandArgTypes = ["string", "number", "boolean", "player"];
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
/**Takes a list of args passed to the command, and processes it, turning it into a kwargs style object. */
function processArgs(args, processedCmdArgs) {
    var e_1, _a;
    var outputArgs = {};
    var unresolvedArgs = [];
    try {
        for (var _b = __values(processedCmdArgs.entries()), _c = _b.next(); !_c.done; _c = _b.next()) {
            var _d = __read(_c.value, 2), i = _d[0], cmdArg = _d[1];
            if (!args[i]) {
                if (cmdArg.isOptional) {
                    outputArgs[cmdArg.name] = null;
                    continue;
                }
                else if (cmdArg.type == "player") {
                    outputArgs[cmdArg.name] = null;
                    unresolvedArgs.push(cmdArg);
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
                        return { error: "Player \"".concat(args[i], "\" not found.") };
                    outputArgs[cmdArg.name] = player;
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
                            outputArgs[cmdArg.name] = true;
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
//const cause why not?
/**Determines if a FishPlayer can run a command with a specific permission level. */
var canPlayerAccess = function canPlayerAccess(player, level) {
    switch (level) {
        case PermissionsLevel.all: return true;
        case PermissionsLevel.player: return !player.stopped || player.mod || player.admin;
        case PermissionsLevel.mod: return player.mod || player.admin;
        case PermissionsLevel.admin: return player.admin;
        case PermissionsLevel.member: return player.member;
        default:
            Log.err("ERROR!: canPlayerAccess called with invalid permissions level ".concat(level));
            return false;
    }
};
exports.canPlayerAccess = canPlayerAccess;
/**
 * Registers all commands in a list to a client command handler.
 * @argument runner (method) => new Packages.arc.util.CommandHandler.CommandRunner({ accept: method })
 * */
function register(commands, clientCommands, serverCommands, runner) {
    var e_2, _a;
    function outputFail(message, sender) {
        sender.sendMessage("[scarlet]\u26A0 [yellow]".concat(message));
    }
    function outputSuccess(message, sender) {
        sender.sendMessage("[#48e076]".concat(message));
    }
    var _loop_1 = function (name) {
        //Cursed for of loop due to lack of object.entries
        var data = commands[name];
        //Process the args
        var processedCmdArgs = data.args.map(processArgString);
        clientCommands.register(name, 
        //Convert the CommandArg[] to the format accepted by Arc CommandHandler
        processedCmdArgs.map(function (arg, index, array) {
            var brackets = (arg.isOptional || arg.type == "player") ? ["[", "]"] : ["<", ">"];
            //if the arg is a string and last argument, make it a spread type (so if `/warn player a b c d` is run, the last arg is "a b c d" not "a")
            return brackets[0] + arg.name + (arg.type == "string" && index + 1 == array.length ? "..." : "") + brackets[1];
        }).join(" "), data.description, runner(function (rawArgs, sender) {
            var _a, _b;
            var fishSender = players.getP(sender);
            //Verify authorization
            if (!(0, exports.canPlayerAccess)(fishSender, data.level)) {
                outputFail((_b = (_a = data.customUnauthorizedMessage) !== null && _a !== void 0 ? _a : data.level.customErrorMessage) !== null && _b !== void 0 ? _b : "You do not have the required permission (".concat(data.level, ") to execute this command"), sender);
                return;
            }
            //closure over processedCmdArgs, should be fine
            var output = processArgs(rawArgs, processedCmdArgs);
            if ("error" in output) {
                //args are invalid
                outputFail(output.error, sender);
                return;
            }
            resolveArgsRecursive(output.processedArgs, output.unresolvedArgs, fishSender, function () {
                //Run the command handler
                data.handler({
                    rawArgs: rawArgs,
                    args: output,
                    sender: fishSender,
                    outputFail: function (message) { return outputFail(message, sender); },
                    outputSuccess: function (message) { return outputSuccess(message, sender); },
                    execServer: function (command) { return serverCommands.handleMessage(command); }
                });
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
exports.register = register;
function resolveArgsRecursive(processedArgs, unresolvedArgs, sender, callback) {
    if (unresolvedArgs.length == 0) {
        callback(processedArgs);
    }
    else {
        var argToResolve_1 = unresolvedArgs.shift();
        var optionsList = void 0;
        //Dubious implementation
        switch (argToResolve_1.type) {
            case "player":
                optionsList = Groups.player.array.items;
                break;
            default: throw new Error("Unable to resolve arg of type ".concat(argToResolve_1.type));
        }
        (0, menus_1.menu)("Select a player", "Select a player for the argument \"".concat(argToResolve_1.name, "\""), optionsList, sender, function (_a) {
            var option = _a.option;
            processedArgs[argToResolve_1.name] = option;
            resolveArgsRecursive(processedArgs, unresolvedArgs, sender, callback);
        }, true, function (player) { return player.name; });
    }
}
