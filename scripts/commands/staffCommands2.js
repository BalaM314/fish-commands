"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var PermissionsLevel = require("./commands").PermissionsLevel;
var menus = require('./menus');
var players = require('./players');
var ohno = require('./ohno');
var commands = {
    warn2: {
        args: ['player:player', 'reason:string?'],
        description: 'warn a player.',
        level: PermissionsLevel.mod,
        handler: function (_a) {
            //declare let args: [player:FishPlayer, reason:string | null];
            var _b, _c;
            var rawArgs = _a.rawArgs, args = _a.args, sender = _a.sender, outputSuccess = _a.outputSuccess, outputFail = _a.outputFail;
            //Should be handled by register()
            // if (!playerData.admin && !playerData.mod) {
            // 	realP.sendMessage('[scarlet]⚠ [yellow]You do not have access to this command.');
            // 	return;
            // }
            // if (/*args[0].rank >= Rank.mod*/ args.player.mod || args.player.admin) {
            // 	outputFail('You cannot warn staff.');
            // 	return;
            // }
            Call.menu(args.player.player.con, menus.getMenus().warn, 'Warning', (_b = args.reason) !== null && _b !== void 0 ? _b : "You have been warned. I suggest you stop what you're doing", [['accept']]);
            //menu()
            outputSuccess("Warned player \"".concat(args.player.name, "\" for \"").concat((_c = args.reason) !== null && _c !== void 0 ? _c : "You have been warned. I suggest you stop what you're doing", "\""));
            //TODO: add FishPlayer.cleanedName for Strings.stripColors
        }
    },
    kick2: {
        args: ['player:player', 'reason:string?'],
        description: 'Kick a player with optional reason.',
        level: PermissionsLevel.mod,
        handler: function (_a) {
            var _b, _c;
            var args = _a.args, outputSuccess = _a.outputSuccess, outputFail = _a.outputFail;
            if (args.player.admin || args.player.mod) {
                outputFail('You do not have permission to kick this player.');
            }
            else {
                args.player.player.kick((_b = args.reason) !== null && _b !== void 0 ? _b : 'A staff member did not like your actions.');
                outputSuccess("Kicked player \"".concat(args.player.name, "\" for \"").concat((_c = args.reason) !== null && _c !== void 0 ? _c : 'A staff member did not like your actions.', "\""));
            }
        }
    },
    mod2: {
        args: ['action:string', 'player:player', 'tellPlayer:boolean?'],
        description: "Add or remove a player's mod status.",
        level: PermissionsLevel.admin,
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
        level: PermissionsLevel.admin,
        handler: function (_a) {
            var args = _a.args, outputSuccess = _a.outputSuccess, outputFail = _a.outputFail;
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
        level: PermissionsLevel.mod,
        customUnauthorizedMessage: "[yellow]You're a [scarlet]monster[].",
        handler: function (_a) {
            var outputSuccess = _a.outputSuccess;
            var numOhnos = ohno.totalOhno();
            ohno.killOhno();
            outputSuccess("You massacred [#48e076]' ".concat(numOhnos, " '[yellow] helpless ohno crawlers."));
        }
    },
};
module.exports = {
    commands: commands
};
