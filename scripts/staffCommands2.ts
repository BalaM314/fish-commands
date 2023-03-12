import { PermissionsLevel, canPlayerAccess } from "./commands";
import { menu, listeners } from './menus';
const players = require('./players');
const stopped = require('./stopped');
const ohno = require('./ohno');
const utils = require('./utils');

export const commands:FishCommandsList = {
	warn2: {
		args: ['player:player', 'reason:string?'],
		description: 'warn a player.',
		level: PermissionsLevel.mod,
		handler({rawArgs, args, sender, outputSuccess, outputFail}){
			const reason = args.reason ?? "You have been warned. I suggest you stop what you're doing";
			menu('Warning', reason, [['accept']], args.player);
			outputSuccess(`Warned player "${args.player.name}" for "${reason}"`);
		}
	},

	kick2: {
		args: ['player:player', 'reason:string?'],
		description: 'Kick a player with optional reason.',
		level: PermissionsLevel.mod,
		handler({args, outputSuccess, outputFail, sender}) {
			if (args.player.admin || args.player.mod) {
			//if(args.player.rank.level >= sender.rank.level)
				outputFail('You do not have permission to kick this player.');
			} else {
				const reason = args.reason ?? 'A staff member did not like your actions.';
				args.player.player.kick(reason);
				outputSuccess(`Kicked player "${args.player.name}" for "${reason}"`);
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
    handler({args, outputSuccess, outputFail, execServer}){
      
			switch(args["add/remove"]){
				case "add": case "a": case "give": case "promote":
					if(args.player.admin == true){
						outputFail(`${args.player.name} is already an Admin.`);
					} else {
						args.player.admin = true;
						execServer(`admin add ${args.player.player.uuid()}`);
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
						execServer(`admin remove ${args.player.player.uuid()}`);
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

	stop_offline2: {
		args: ["name:string"],
		description: "Stops an offline player.",
		level: PermissionsLevel.mod,
		handler({args, sender, outputFail, outputSuccess}){
			const admins = Vars.netServer.admins;
			let possiblePlayers:mindustryPlayerData[] = admins.searchNames(args.name).toSeq().items;
      if(possiblePlayers.length > 20){
        let exactPlayers = admins.findByName(args.name).toSeq().items;
        if(exactPlayers.size > 0){
          possiblePlayers = exactPlayers;
        } else {
          outputFail('Too many players with that name.');
        }
      }

			menu("Stop", "Choose a player to stop", possiblePlayers, sender, ({option, sender}) => {
				stopped.addStopped(option.id);
				players.addPlayerHistory(option.id, {
					action: 'stopped',
					by: sender.name,
					time: Date.now(),
				});
				outputSuccess(`Player ${option.lastName} was stopped.`);
			}, true, p => p.lastName);
		}
	},

};
