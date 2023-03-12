"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.commands = void 0;
var commands_1 = require("./commands");
var menus_1 = require("./menus");
var players = require('./players');
var stopped = require('./stopped');
var ohno = require('./ohno');
var utils = require('./utils');
exports.commands = {
    warn2: {
        args: ['player:player', 'reason:string?'],
        description: 'warn a player.',
        level: commands_1.PermissionsLevel.mod,
        handler: function (_a) {
            var _b;
            var rawArgs = _a.rawArgs, args = _a.args, sender = _a.sender, outputSuccess = _a.outputSuccess, outputFail = _a.outputFail;
            var reason = (_b = args.reason) !== null && _b !== void 0 ? _b : "You have been warned. I suggest you stop what you're doing";
            (0, menus_1.menu)('Warning', reason, [['accept']], args.player);
            outputSuccess("Warned player \"".concat(args.player.name, "\" for \"").concat(reason, "\""));
        }
    },
    kick2: {
        args: ['player:player', 'reason:string?'],
        description: 'Kick a player with optional reason.',
        level: commands_1.PermissionsLevel.mod,
        handler: function (_a) {
            var _b;
            var args = _a.args, outputSuccess = _a.outputSuccess, outputFail = _a.outputFail, sender = _a.sender;
            if (args.player.admin || args.player.mod) {
                //if(args.player.rank.level >= sender.rank.level)
                outputFail('You do not have permission to kick this player.');
            }
            else {
                var reason = (_b = args.reason) !== null && _b !== void 0 ? _b : 'A staff member did not like your actions.';
                args.player.player.kick(reason);
                outputSuccess("Kicked player \"".concat(args.player.name, "\" for \"").concat(reason, "\""));
            }
        }
    },
    mod2: {
        args: ['action:string', 'player:player', 'tellPlayer:boolean?'],
        description: "Add or remove a player's mod status.",
        level: commands_1.PermissionsLevel.admin,
        handler: function (_a) {
            var args = _a.args, outputSuccess = _a.outputSuccess, outputFail = _a.outputFail;
            switch (args["add/remove"]) {
                case "add":
                case "a":
                case "give":
                case "promote":
                    if (args.player.mod == true) {
                        outputFail("".concat(args.player.name, " is already a Moderator."));
                    }
                    else {
                        args.player.mod = true;
                        outputSuccess("".concat(args.player.name, " [#48e076] is now ranked Moderator."));
                        args.player.sendMessage('[yellow] Your rank is now [#48e076]Moderator.[yellow] Use [acid]"/help mod"[yellow] to see available commands.');
                        players.updateName(args.player);
                        players.save();
                    }
                    break;
                case "remove":
                case "rm":
                case "r":
                case "demote":
                    if (args.player.admin) {
                        outputFail("".concat(args.player.name, " is an Admin."));
                    }
                    else if (!args.player.mod) {
                        outputFail("".concat(args.player.name, " is not a Moderator."));
                    }
                    else {
                        args.player.mod = false;
                        players.updateName(args.player);
                        players.save();
                        if (args.tellPlayer) {
                            args.player.sendMessage('[scarlet] You are now no longer a Moderator.');
                        }
                        outputSuccess("".concat(args.player.name, " [#48e076]is no longer a moderator."));
                    }
                    break;
                default:
                    outputFail("Invalid argument. [yellow]Usage: \"/mod <add|remove> <player>\"");
                    return;
            }
        }
    },
    admin2: {
        args: ['action:string', 'player:player', 'tellPlayer:boolean?'],
        description: "Add or remove a player's admin status.",
        level: commands_1.PermissionsLevel.admin,
        handler: function (_a) {
            var args = _a.args, outputSuccess = _a.outputSuccess, outputFail = _a.outputFail, execServer = _a.execServer;
            switch (args["add/remove"]) {
                case "add":
                case "a":
                case "give":
                case "promote":
                    if (args.player.admin == true) {
                        outputFail("".concat(args.player.name, " is already an Admin."));
                    }
                    else {
                        args.player.admin = true;
                        execServer("admin add ".concat(args.player.player.uuid()));
                        outputSuccess("".concat(args.player.name, " [#48e076] is now an Admin."));
                        args.player.sendMessage('[yellow] Your rank is now [#48e076]Admin.[yellow] Use [sky]"/help mod"[yellow] to see available commands.');
                        players.updateName(args.player);
                        players.save();
                    }
                    break;
                case "remove":
                case "rm":
                case "r":
                case "demote":
                    if (!args.player.admin) {
                        outputFail("".concat(args.player.name, " is not an Admin."));
                    }
                    else {
                        args.player.admin = false;
                        execServer("admin remove ".concat(args.player.player.uuid()));
                        players.updateName(args.player);
                        players.save();
                        if (args.tellPlayer) {
                            args.player.sendMessage('[scarlet] You are now no longer an Admin.');
                        }
                        outputSuccess("".concat(args.player.name, " [#48e076]is no longer an admin."));
                    }
                    break;
                default:
                    outputFail("Invalid argument. [yellow]Usage: \"/admin <add|remove> <player>\"");
                    return;
            }
        }
    },
    murder2: {
        args: [],
        description: 'Kills all ohno units',
        level: commands_1.PermissionsLevel.mod,
        customUnauthorizedMessage: "[yellow]You're a [scarlet]monster[].",
        handler: function (_a) {
            var outputSuccess = _a.outputSuccess;
            var numOhnos = ohno.totalOhno();
            ohno.killOhno();
            outputSuccess("You massacred [#48e076]' ".concat(numOhnos, " '[yellow] helpless ohno crawlers."));
        }
    },
    stop_offline2: {
        args: ["name:string"],
        description: "Stops an offline player.",
        level: commands_1.PermissionsLevel.mod,
        handler: function (_a) {
            var args = _a.args, sender = _a.sender, outputFail = _a.outputFail, outputSuccess = _a.outputSuccess;
            var admins = Vars.netServer.admins;
            var possiblePlayers = admins.searchNames(args.name).toSeq().items;
            if (possiblePlayers.length > 20) {
                var exactPlayers = admins.findByName(args.name).toSeq().items;
                if (exactPlayers.size > 0) {
                    possiblePlayers = exactPlayers;
                }
                else {
                    outputFail('Too many players with that name.');
                }
            }
            (0, menus_1.menu)("Stop", "Choose a player to stop", possiblePlayers, sender, function (_a) {
                var option = _a.option, sender = _a.sender;
                stopped.addStopped(option.id);
                players.addPlayerHistory(option.id, {
                    action: 'stopped',
                    by: sender.name,
                    time: Date.now(),
                });
                outputSuccess("Player ".concat(option.lastName, " was stopped."));
            }, true, function (p) { return p.lastName; });
        }
    },
};
