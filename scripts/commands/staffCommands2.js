"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var PermissionsLevel = require("./commands").PermissionsLevel;
var menus = require('./menus');
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
};
module.exports = {
    commands: commands
};
