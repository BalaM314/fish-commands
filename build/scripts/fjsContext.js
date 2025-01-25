"use strict";
/*
Copyright © BalaM314, 2024. All Rights Reserved.
This file contains the context for the "fjs" command, which executes code with access to the plugin's internals.
*/
Object.defineProperty(exports, "__esModule", { value: true });
exports.runJS = void 0;
var api = require("./api");
var commands = require("./commands");
var config = require("./config");
var consoleCommands = require("./consoleCommands").commands;
var files = require("./files");
var globals = require("./globals");
var memberCommands = require("./memberCommands").commands;
var menus = require("./menus");
var packetHandlers = require("./packetHandlers");
var playerCommands = require("./playerCommands").commands;
var players = require("./players");
var ranks = require("./ranks");
var staffCommands = require("./staffCommands").commands;
var timers = require("./timers");
var utils = require("./utils");
var votes = require("./votes");
var Promise = require("./promise").Promise;
var Perm = commands.Perm, allCommands = commands.allCommands;
var FishPlayer = players.FishPlayer;
var Rank = ranks.Rank, RoleFlag = ranks.RoleFlag;
var menu = menus.menu;
Object.assign(this, utils); //global scope goes brrrrr, I'm sure this will not cause any bugs whatsoever
var Ranks = null;
var $ = Object.assign(function $(input) {
    if (typeof input == "string") {
        if (Pattern.matches("[a-zA-Z0-9+/]{22}==", input)) {
            return FishPlayer.getById(input);
        }
    }
    return null;
}, {
    sussy: true,
    info: function (input) {
        if (typeof input == "string") {
            if (Pattern.matches("[a-zA-Z0-9+/]{22}==", input)) {
                return Vars.netServer.admins.getInfo(input);
            }
        }
        return null;
    },
    create: function (input) {
        if (typeof input == "string") {
            if (Pattern.matches("[a-zA-Z0-9+/]{22}==", input)) {
                return FishPlayer.getFromInfo(Vars.netServer.admins.getInfo(input));
            }
        }
        return null;
    },
});
/** Used to persist variables. */
var vars = {};
function runJS(input, outputFunction, errorFunction) {
    if (outputFunction == undefined)
        outputFunction = Log.info;
    if (errorFunction == undefined)
        errorFunction = Log.err;
    try {
        var admins = Vars.netServer.admins;
        var output = eval(input);
        if (output instanceof Array) {
            outputFunction("&cArray: [&fr" + output.join(", ") + "&c]&fr");
        }
        else if (output === undefined) {
            outputFunction("undefined");
        }
        else if (output === null) {
            outputFunction("null");
        }
        else {
            outputFunction(output);
        }
    }
    catch (err) {
        errorFunction(err);
    }
}
exports.runJS = runJS;
