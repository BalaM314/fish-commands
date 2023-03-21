import { PermissionsLevel } from "./commands";
import { menu } from './menus';
import { FishPlayer } from "./players";
import type { FishCommandsList, mindustryPlayerData } from "./types";
import { getTimeSinceText } from "./utils";
import * as api from "./api";
import { Ohnos } from "./ohno";

export const commands:FishCommandsList = {
	warn: {
		args: ['player:player', 'reason:string?'],
		description: 'Warn a player.',
		level: PermissionsLevel.mod,
		handler({args, outputSuccess }){
			const reason = args.reason ?? "You have been warned. I suggest you stop what you're doing";
			menu('Warning', reason, [['accept']], args.player);
			outputSuccess(`Warned player "${args.player.name}" for "${reason}"`);
		}
	},

	mute: {
		args: ['player:player'],
		description: 'Stops a player from chatting.',
		level: PermissionsLevel.mod,
		handler({args, sender, outputSuccess, outputFail }){
			if(args.player.muted){
				outputFail(`Player "${args.player.name}" is already muted.`);
				return;
			}
			if(args.player.admin){
				outputFail(`Player "${args.player.name}" is an admin.`);
				return;
			}
			args.player.muted = true;
			args.player.updateName();
			outputSuccess(`Muted player "${args.player.name}".`);
			args.player.player.sendMessage(`[yellow] Hey! You have been muted. You can still use /msg to send a message to someone.`);
			args.player.addHistoryEntry({
				action: 'unmuted',
				by: sender.name,
				time: Date.now(),
			});
			FishPlayer.saveAll();
		}
	},

	unmute: {
		args: ['player:player'],
		description: 'Unmutes a player',
		level: PermissionsLevel.mod,
		handler({args, sender, outputSuccess, outputFail }){
			if(args.player.muted){
				args.player.muted = false;
				args.player.updateName();
				outputSuccess(`Unmuted player "${args.player.name}".`);
				args.player.player.sendMessage(`[green]You have been unmuted.`);
				args.player.addHistoryEntry({
          action: 'unmuted',
          by: sender.name,
          time: Date.now(),
        });
			} else {
				outputFail(`Player "${args.player.name}" is not muted.`);
			}
		}
	},

	kick: {
		args: ['player:player', 'reason:string?'],
		description: 'Kick a player with optional reason.',
		level: PermissionsLevel.mod,
		handler({args, outputSuccess, outputFail }) {
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

	stop: {
		args: ['player:player'],
		description: 'Stops a player.',
		level: PermissionsLevel.mod,
		handler({args, sender, outputSuccess, outputFail}) {
			if(args.player.stopped){
				outputFail(`Player "${args.player.name}" is already stopped.`);
			} else {
				args.player.stop(sender);
				outputSuccess(`Player "${args.player.name}" has been stopped.`);
			}
		}
	},

	free: {
		args: ['player:player'],
		description: 'Frees a player.',
		level: PermissionsLevel.mod,
		handler({args, sender, outputSuccess, outputFail}) {
			if(args.player.stopped){
				args.player.free(sender);
				outputSuccess(`Player "${args.player.name}" has been freed.`);
			} else {
				outputFail(`Player "${args.player.name}" is not stopped.`);;
			}
		}
	},

	mod: {
    args: ['action:string', 'player:player', 'tellPlayer:boolean?'],
    description: "Add or remove a player's mod status.",
		level: PermissionsLevel.admin,
    handler({args, outputSuccess, outputFail}){
			switch(args.action){
				case "add": case "a": case "give": case "promote":
					if(args.player.mod == true){
						outputFail(`${args.player.name} is already a Moderator.`);
					} else {
						args.player.mod = true;
						outputSuccess(`${args.player.name} [#48e076] is now ranked Moderator.`);
						args.player.sendMessage(
							'[yellow] Your rank is now [#48e076]Moderator.[yellow] Use [acid]"/help mod"[yellow] to see available commands.'
						);
						args.player.updateName();
						FishPlayer.saveAll();
					}
					break;
				case "remove": case "rm": case "r": case "demote":
					if(args.player.admin){
						outputFail(`${args.player.name} is an Admin.`);
					} else if(!args.player.mod){
						outputFail(`${args.player.name} is not a Moderator.`);
					} else {
						args.player.mod = false;
						args.player.updateName();
						FishPlayer.saveAll();
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

	admin: {
    args: ['action:string', 'player:player', 'tellPlayer:boolean?'],
    description: "Add or remove a player's admin status.",
		level: PermissionsLevel.admin,
    handler({args, outputSuccess, outputFail, execServer}){

			switch(args.action){
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
						args.player.updateName();
						FishPlayer.saveAll();
					}
					break;
				case "remove": case "rm": case "r": case "demote":
					if(!args.player.admin){
						outputFail(`${args.player.name} is not an Admin.`);
					} else {
						args.player.admin = false;
						execServer(`admin remove ${args.player.player.uuid()}`);
						args.player.updateName();
						FishPlayer.saveAll();
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

	murder: {
    args: [],
    description: 'Kills all ohno units',
		level: PermissionsLevel.mod,
		customUnauthorizedMessage: `[yellow]You're a [scarlet]monster[].`,
    handler({output}){
			const numOhnos = Ohnos.amount();
			Ohnos.killAll();
			output(`[orange]You massacred [cyan]${numOhnos}[] helpless ohno crawlers.`);
    }
	},

	stop_offline: {
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
				const fishP = FishPlayer.getFromInfo(option);
				fishP.stopped = true;
				api.addStopped(option.id);
				fishP.addHistoryEntry({
					action: 'stopped',
					by: sender.name,
					time: Date.now(),
				});
				outputSuccess(`Player ${option.lastName} was stopped.`);
			}, true, p => p.lastName);
		}
	},

	restart: {
		args: [],
		description: "Stops and restarts the server. Do not run when the player count is high.",
		level: PermissionsLevel.admin,
		handler({outputFail}){
			const now = Date.now();
			const lastRestart = Core.settings.get("lastRestart", "");
			if(lastRestart != ""){
				const numOld = Number(lastRestart);
				if (now - numOld < 600000) {
          outputFail(`You need to wait at least 10 minutes between restarts.`);
          return;
        }
			}
			Core.settings.put("lastRestart", String(now));
			Core.settings.manualSave();
			const file = Vars.saveDirectory.child('1' + '.' + Vars.saveExtension);
			const restartLoop = (sec:number) => {
				if (sec === 5) {
					Call.sendMessage('[green]Game saved. [scarlet]Server restarting in:');
				}

				Call.sendMessage('[scarlet]' + String(sec));

				if (sec <= 0) {
					Core.app.post(() => {
						SaveIO.save(file);
						Core.app.exit();
					});
					return;
				}
				Timer.schedule(() => {
					const newSec = sec - 1;
					restartLoop(newSec);
				}, 1);
			};
			restartLoop(5);
		}
	},

	history: {
		args: ["player:player"],
		description: "Shows moderation history for a player.",
		level: PermissionsLevel.mod,
		handler({args, output}){
			if(args.player.history && args.player.history.length > 0){
				output(
					`[yellow]_______________Player history_______________\n\n` +
					(args.player as FishPlayer).history.map(e =>
						`${e.by} [yellow]${e.action} ${args.player.name} [white]${getTimeSinceText(e.time)}`
					).join("\n")
				);
			} else {
				output(`[yellow]No history was found for player ${args.player.name}.`);
			}
		}
	},

	save: {
		args: [],
		description: "Saves the game state.",
		level: PermissionsLevel.mod,
		handler({outputSuccess}){
			FishPlayer.saveAll();
			const file = Vars.saveDirectory.child('1' + '.' + Vars.saveExtension);
      SaveIO.save(file);
      outputSuccess('Game saved.');
		}
	},

	wave: {
		args: ["wave:number"],
		description: "Sets the wave number.",
		level: PermissionsLevel.admin,
		handler({args, outputSuccess, outputFail}){
			if(args.wave > 0 && Number.isInteger(args.wave)){
				Vars.state.wave = args.wave;
				outputSuccess(`Set wave to ${Vars.state.wave}`);
			} else {
				outputFail(`Wave must be a positive integer.`);
			}
		}
	},

	label: {
		args: ["time:number", "message:string"],
		description: "Places a label at your position for a specified amount of time.",
		level: PermissionsLevel.admin,
		handler({args, sender, outputSuccess, outputFail}){
			if(args.time <= 0 || args.time > 3600){
				outputFail(`Time must be a positive number less than 3600.`);
				return;
			}
			let timeRemaining = args.time;
			const labelx = sender.player.x;
			const labely = sender.player.y;
			Timer.schedule(() => {
				if(timeRemaining > 0) {
					let timeseconds = timeRemaining % 60;
					let timeminutes = (timeRemaining - timeseconds) / 60;
					Call.label(
						`${sender.name}\n\n[white]${args.message}\n\n[acid]${timeminutes}:${timeseconds}`,
						1, labelx, labely
					);
					timeRemaining --;
				}
			}, 0, 1, args.time);
			outputSuccess(`Placed label "${args.message}" for ${args.time} seconds.`);
		}
	},

	member: {
		args: ["value:boolean", "player:player"],
		description: "Sets a player's member status.",
		level: PermissionsLevel.admin,
		handler({args, outputSuccess}){
			(args.player as FishPlayer).member = args.value;
			args.player.updateName();
			FishPlayer.saveAll();
			outputSuccess(`Set membership status of player "${args.player.name}" to ${args.value}.`);
		}
	},

	ipban: {
		args: [],
		description: "Bans a player's IP.",
		level: PermissionsLevel.admin,
		handler({sender, outputFail, outputSuccess, execServer}){
			let playerList:mindustryPlayer[] = [];
			(Groups.player as mindustryPlayer[]).forEach(player => {
				if(!player.admin) playerList.push(player);
			});
			menu(`IP BAN`, "Choose a player to IP ban.", playerList, sender, ({option}) => {
				if(option.admin){
					outputFail(`Cannot ip ban an admin.`);
				} else {
					execServer(`ban ip ${option.ip()}`);
					outputSuccess(`IP-banned player ${option.name}.`);
				}
			}, true, opt => opt.name);
		}
	}

};
