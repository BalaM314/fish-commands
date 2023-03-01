const { PermissionsLevel } = require("./commands");
const menus = require('./menus');

const commands:FishCommandsList = {
	warn2: {
		args: ['player:player', 'reason:string?'],
		description: 'warn a player.',
		level: PermissionsLevel.mod,
		handler({rawArgs, args, sender, outputSuccess, outputFail}){
			//declare let args: [player:FishPlayer, reason:string | null];
			
			
			//Should be handled by register()
			// if (!playerData.admin && !playerData.mod) {
			// 	realP.sendMessage('[scarlet]⚠ [yellow]You do not have access to this command.');
			// 	return;
			// }

			
			if (/*args[0].rank >= Rank.mod*/ args.player.mod || args.player.admin) {
				outputFail('You cannot warn staff.');
				return;
			}

			Call.menu(args.player.player.con, menus.getMenus().listeners.warn, 'Warning', args.reason ?? "You have been warned. I suggest you stop what you're doing", [['accept']]);
			//menu()
			outputSuccess(`Warned player "${args.player.name}" for "${args.reason ?? "You have been warned. I suggest you stop what you're doing"}"`);
			//TODO: add FishPlayer.cleanedName for Strings.stripColors
		}
	},

	kick2: {
		args: ['player:player', 'reason:string?'],
		description: 'Kick a player with optional reason.',
		level: PermissionsLevel.mod,
		handler({args, outputSuccess, outputFail}) {
			if (args.player.admin || args.player.mod) {
				outputFail('You do not have permission to kick this player.');
			} else {
				args.player.player.kick(args.reason ?? 'A staff member did not like your actions.');
				outputSuccess(`Kicked player "${args.player.name}" for "${args.reason ?? 'A staff member did not like your actions.'}"`);
			}
		}
	},

};

module.exports = {
	commands
};