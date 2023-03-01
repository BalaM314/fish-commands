const { PermissionsLevel } = require("./commands");
const menus = require('./menus');
const players = require('./players');
const ohno = require('./ohno');

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

			
			// if (/*args[0].rank >= Rank.mod*/ args.player.mod || args.player.admin) {
			// 	outputFail('You cannot warn staff.');
			// 	return;
			// }

			Call.menu(args.player.player.con, menus.getMenus().warn, 'Warning', args.reason ?? "You have been warned. I suggest you stop what you're doing", [['accept']]);
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

	mod2: {
    args: ['action:string', 'player:player', 'tellPlayer:boolean?'],
    description: "Add or remove a player's mod status.",
		level: PermissionsLevel.admin,
    handler({args, outputSuccess, outputFail}){
      
			switch(args["add/remove"]){
				case "add": case "a": case "give": case "promote":
					if(args.player.mod == true){
						outputFail(`${args.player.name} is already a Moderator.`);
					} else {
						args.player.mod = true;
						outputSuccess(`${args.player.name} [#48e076] is now ranked Moderator.`);
						args.player.sendMessage(
							'[yellow] Your rank is now [#48e076]Moderator.[yellow] Use [acid]"/help mod"[yellow] to see available commands.'
						);
						players.updateName(args.player);
						players.save();
					}
					break;
				case "remove": case "rm": case "r": case "demote":
					if(args.player.admin){
						outputFail(`${args.player.name} is an Admin.`);
					} else if(!args.player.mod){
						outputFail(`${args.player.name} is not a Moderator.`);
					} else {
						args.player.mod = false;
						players.updateName(args.player);
						players.save();
						if(args.tellPlayer){
							args.player.sendMessage(
								'[scarlet] You are now no longer a Moderator.'
							);
						}
						outputSuccess(`${args.player.name} [#48e076]is no longer a moderator.`);
					}
					break;
				default: outputFail(`Invalid argument. [yellow]Usage: "/mod <add|remove> <player>"`); return;
			}

    }
	},
	admin2: {
    args: ['action:string', 'player:player', 'tellPlayer:boolean?'],
    description: "Add or remove a player's admin status.",
		level: PermissionsLevel.admin,
    handler({args, outputSuccess, outputFail}){
      
			switch(args["add/remove"]){
				case "add": case "a": case "give": case "promote":
					if(args.player.admin == true){
						outputFail(`${args.player.name} is already an Admin.`);
					} else {
						args.player.admin = true;
						outputSuccess(`${args.player.name} [#48e076] is now an Admin.`);
						args.player.sendMessage(
							'[yellow] Your rank is now [#48e076]Admin.[yellow] Use [sky]"/help mod"[yellow] to see available commands.'
						);
						players.updateName(args.player);
						players.save();
					}
					break;
				case "remove": case "rm": case "r": case "demote":
					if(!args.player.admin){
						outputFail(`${args.player.name} is not an Admin.`);
					} else {
						args.player.admin = false;
						players.updateName(args.player);
						players.save();
						if(args.tellPlayer){
							args.player.sendMessage(
								'[scarlet] You are now no longer an Admin.'
							);
						}
						outputSuccess(`${args.player.name} [#48e076]is no longer an admin.`);
					}
					break;
				default: outputFail(`Invalid argument. [yellow]Usage: "/admin <add|remove> <player>"`); return;
			}

    }
	},

	murder2: {
    args: [],
    description: 'Kills all ohno units',
		level: PermissionsLevel.mod,
		customUnauthorizedMessage: `[yellow]You're a [scarlet]monster[].`,
    handler({outputSuccess}){
			const numOhnos = ohno.totalOhno();
			ohno.killOhno();
			outputSuccess(`You massacred [#48e076]' ${numOhnos} '[yellow] helpless ohno crawlers.`);
    }
	},

};

module.exports = {
	commands
};