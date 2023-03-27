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
exports.register = exports.Perm = void 0;
var menus_1 = require("./menus");
var players_1 = require("./players");
/** Represents a permission level that is required to run a specific command. */
var Perm = /** @class */ (function () {
    function Perm(name, check, unauthorizedMessage) {
        if (unauthorizedMessage === void 0) { unauthorizedMessage = "You do not have the required permission (".concat(name, ") to execute this command"); }
        this.name = name;
        this.check = check;
        this.unauthorizedMessage = unauthorizedMessage;
    }
    Perm.all = new Perm("all", function (fishP) { return true; });
    Perm.notGriefer = new Perm("player", function (fishP) { return !fishP.stopped || fishP.mod || fishP.admin; });
    Perm.mod = new Perm("mod", function (fishP) { return fishP.mod || fishP.admin; });
    Perm.admin = new Perm("admin", function (fishP) { return fishP.admin; });
    Perm.member = new Perm("member", function (fishP) { return fishP.member || !fishP.stopped; }, "You must have a [scarlet]Fish Membership[yellow] to use this command. Subscribe on the [sky]/discord[yellow]!");
    return Perm;
}());
exports.Perm = Perm;
var commandArgTypes = ["string", "number", "boolean", "player", "exactPlayer", "namedPlayer"];
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
                case "namedPlayer":
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
/**
 * Registers all commands in a list to a client command handler.
 **/
function register(commands, clientCommands, serverCommands) {
    var e_2, _a;
    function outputFail(message, sender) {
        sender.sendMessage("[scarlet]\u26A0 [yellow]".concat(message));
    }
    function outputSuccess(message, sender) {
        sender.sendMessage("[#48e076]".concat(message));
    }
    function outputMessage(message, sender) {
        sender.sendMessage(message);
    }
    var _loop_1 = function (name) {
        //Cursed for of loop due to lack of object.entries
        var data = commands[name];
        //Process the args
        var processedCmdArgs = data.args.map(processArgString);
        clientCommands.removeCommand(name); //The function silently fails if the argument doesn't exist so this is safe
        clientCommands.register(name, 
        //Convert the CommandArg[] to the format accepted by Arc CommandHandler
        processedCmdArgs.map(function (arg, index, array) {
            var brackets = (arg.isOptional || arg.type == "player") ? ["[", "]"] : ["<", ">"];
            //if the arg is a string and last argument, make it a spread type (so if `/warn player a b c d` is run, the last arg is "a b c d" not "a")
            return brackets[0] + arg.name + (arg.type == "string" && index + 1 == array.length ? "..." : "") + brackets[1];
        }).join(" "), data.description, new Packages.arc.util.CommandHandler.CommandRunner({ accept: function (rawArgs, sender) {
                var _a;
                var fishSender = players_1.FishPlayer.get(sender);
                //Verify authorization
                if (!data.level.check(fishSender)) {
                    outputFail((_a = data.customUnauthorizedMessage) !== null && _a !== void 0 ? _a : data.level.unauthorizedMessage, sender);
                    return;
                }
                //closure over processedCmdArgs, should be fine
                var output = processArgs(rawArgs, processedCmdArgs);
                if ("error" in output) {
                    //args are invalid
                    outputFail(output.error, sender);
                    return;
                }
                //Recursively resolve unresolved args (such as players that need to be determined through a menu)
                resolveArgsRecursive(output.processedArgs, output.unresolvedArgs, fishSender, function () {
                    //Run the command handler
                    data.handler({
                        rawArgs: rawArgs,
                        args: output.processedArgs,
                        sender: fishSender,
                        outputFail: function (message) { return outputFail(message, sender); },
                        outputSuccess: function (message) { return outputSuccess(message, sender); },
                        output: function (message) { return outputMessage(message, sender); },
                        execServer: function (command) { return serverCommands.handleMessage(command); },
                    });
                });
            } }));
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
