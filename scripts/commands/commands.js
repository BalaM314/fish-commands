"use strict";
var menus = require('../menus');
var players = require("../players");
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
    PermissionsLevel["player"] = "player";
    PermissionsLevel["mod"] = "mod";
    PermissionsLevel["admin"] = "admin";
})(PermissionsLevel || (PermissionsLevel = {}));
function processArgString(str) {
    //this was copypasted from mlogx haha
    var matchResult = str.match(/(\w+):(\w+)(\?)?/);
    if (!matchResult) {
        throw new Error("Bad arg string ".concat(str, ": does not match pattern word:word(?)"));
    }
    var name = matchResult[1], type = matchResult[2], isOptional = matchResult[3];
    return { name: name, type: type, isOptional: !!isOptional };
}
function processArgs(args, processedCmdArgs) {
    /**
     * not an actual implementation
     * don't try to implement this, I have some very similar code from mlogx
     * if one of the command args is of type "number", this function should find that from the provided args, make sure its a number, and turn it into a number
     * if its of type "player", it should return a FishPlayer
     * (if players.getPByName returns null then return an error message "player ${} not found")
     * */
    if (args == ["SussyImpasta", "being sus"] && processedCmdArgs == [{ name: "player", type: "player", isOptional: false }, { name: "reason", type: "string", isOptional: true }]) {
        return {
            reason: args[1],
            player: players.getPByName("SussyImpasta")
            //function added in commands rewrite
        };
    }
    else {
        return "Invalid arguments: Insufficient sus level"; //
    }
}
var canPlayerAccess = function canPlayerAccess(player, level) {
    switch (level) {
        case PermissionsLevel.player: return true;
        case PermissionsLevel.mod: return player.mod;
        case PermissionsLevel.admin: return player.admin;
    }
};
function register(commands, clientCommands, runner) {
    function outputFail(message, sender) {
        sender.sendMessage("[scarlet]\u26A0 [yellow]".concat(message));
    }
    function outputSuccess(message, sender) {
        sender.sendMessage("[#48e076]".concat(message));
    }
    var _loop_1 = function (name, data) {
        var processedCmdArgs = data.args.map(processArgString);
        clientCommands.register(name, processedCmdArgs.map(function (arg) { return arg.isOptional ? "[".concat(arg.name, "(optional)]") : "<".concat(arg.name, ">"); }).join(" "), data.description, 
        //closure over processedCmdArgs, should be fine
        runner(function (rawArgs, sender) {
            var fishSender = players.getP(sender);
            if (!canPlayerAccess(fishSender, data.level)) {
                outputFail("You do not have the required permission (".concat(data.level, ") to execute this command"), fishSender);
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
    for (var _i = 0, _a = Object.entries(commands); _i < _a.length; _i++) {
        var _b = _a[_i], name = _b[0], data = _b[1];
        _loop_1(name, data);
    }
}
