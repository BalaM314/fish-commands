

const staffCommands:FishCommandsList = {
	warn: {
		args: ['player:player', 'reason:string?'],
		description: 'warn a player.',
		level: PermissionsLevel.mod,
		handler({rawArgs, args, sender}){
			//declare let args: [player:FishPlayer, reason:string | null];
			
			
			//Should be handled by register()
			// if (!playerData.admin && !playerData.mod) {
			// 	realP.sendMessage('[scarlet]⚠ [yellow]You do not have access to this command.');
			// 	return;
			// }

			
			if (/*args[0].rank > Rank.mod*/ args.player.mod || args.player.admin) {
				sender.player.sendMessage('[scarlet]⚠ [yellow] You cannot warn staff.');
				//replyFail("You cannot warn staff.");
				return;
			}

			Call.menu(args.player.player.con, menus.getMenus().listeners.warn, 'Warning', args.reason ?? "You have been warned. I suggest you stop what you're doing", [['accept']]);
			//menu()
		}
	}
};