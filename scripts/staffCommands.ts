import { Perm, fail } from "./commands";
import { menu } from './menus';
import { FishPlayer } from "./players";
import type { FishCommandsList, mindustryPlayerData } from "./types";
import { getTimeSinceText } from "./utils";
import * as api from "./api";
import { Ohnos } from "./ohno";
import { Rank } from "./ranks";

export const commands:FishCommandsList = {
	warn: {
		args: ['player:player', 'reason:string?'],
		description: 'Warn a player.',
		perm: Perm.mod,
		handler({args, outputSuccess}){
			const reason = args.reason ?? "You have been warned. I suggest you stop what you're doing";
			menu('Warning', reason, [['accept']], args.player);
			outputSuccess(`Warned player "${args.player.cleanedName}" for "${reason}"`);
		}
	},

	mute: {
		args: ['player:player'],
		description: 'Stops a player from chatting.',
		perm: Perm.mod,
		handler({args, sender, outputSuccess}){
			if(args.player.muted) fail(`Player "${args.player.cleanedName}" is already muted.`);
			if(!sender.canModerate(args.player)) fail(`You do not have permission to mute this player.`);
			args.player.muted = true;
			args.player.updateName();
			outputSuccess(`Muted player "${args.player.cleanedName}".`);
			args.player.sendMessage(`[yellow] Hey! You have been muted. You can still use /msg to send a message to someone.`);
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
		perm: Perm.mod,
		handler({args, sender, outputSuccess, outputFail }){
			if(args.player.muted){
				args.player.muted = false;
				args.player.updateName();
				outputSuccess(`Unmuted player "${args.player.cleanedName}".`);
				args.player.sendMessage(`[green]You have been unmuted.`);
				args.player.addHistoryEntry({
          action: 'unmuted',
          by: sender.name,
          time: Date.now(),
        });
			} else {
				outputFail(`Player "${args.player.cleanedName}" is not muted.`);
			}
		}
	},

	kick: {
		args: ['player:player', 'reason:string?'],
		description: 'Kick a player with optional reason.',
		perm: Perm.mod,
		handler({args, outputSuccess, outputFail, sender}){
			if(!sender.canModerate(args.player)) fail(`You do not have permission to kick this player.`);
			const reason = args.reason ?? 'A staff member did not like your actions.';
			args.player.player.kick(reason);
			outputSuccess(`Kicked player "${args.player.cleanedName}" for "${reason}"`);
		}
	},

	stop: {
		args: ['player:player'],
		description: 'Stops a player.',
		perm: Perm.mod,
		handler({args, sender, outputFail}) {
			if(args.player.stopped) fail(`Player "${args.player.name}" is already stopped.`);
			if(!sender.canModerate(args.player, false)) fail(`You do not have permission to kick this player.`);
			args.player.stop(sender);
			Call.sendMessage(`Player "${args.player.name}" has been stopped.`);
		}
	},

	free: {
		args: ['player:player'],
		description: 'Frees a player.',
		perm: Perm.mod,
		handler({args, sender, outputSuccess, outputFail}) {
			if(args.player.stopped){
				args.player.free(sender);
				outputSuccess(`Player "${args.player.name}" has been freed.`);
			} else {
				outputFail(`Player "${args.player.name}" is not stopped.`);;
			}
		}
	},

	setrank: {
		args: ["player:exactPlayer", "rank:string"],
		description: "Set a player's rank.",
		perm: Perm.mod,
		handler({args, outputFail, outputSuccess, sender}){
			const rank = Rank.getByName(args.rank);
			if(rank == null) fail(`Unknown rank ${args.rank}`);
			if(rank.level >= sender.rank.level)
				fail(`You do not have permission to promote players to rank "${rank.name}", because your current rank is "${sender.rank.name}"`);
			if(!sender.canModerate(args.player))
				fail(`You do not have permission to modify the rank of player "${args.player.name}"`);

			args.player.setRank(rank);
			outputSuccess(`Set rank of player "${args.player.name}" to ${rank.name}`);
		}
	},

	murder: {
    args: [],
    description: 'Kills all ohno units',
		perm: Perm.mod,
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
		perm: Perm.mod,
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
				if(sender.canModerate(fishP, false)){
					fishP.stopped = true;
					api.addStopped(option.id);
					fishP.addHistoryEntry({
						action: 'stopped',
						by: sender.name,
						time: Date.now(),
					});
					outputSuccess(`Player "${option.lastName}" was stopped.`);
				} else {
					outputFail(`You do not have permission to stop this player.`);
				}
			}, true, p => p.lastName);
		}
	},

	restart: {
		args: [],
		description: "Stops and restarts the server. Do not run when the player count is high.",
		perm: Perm.admin,
		handler({outputFail}){
			const now = Date.now();
			const lastRestart = Core.settings.get("lastRestart", "");
			if(lastRestart != ""){
				const numOld = Number(lastRestart);
				if(now - numOld < 600000) fail(`You need to wait at least 10 minutes between restarts.`);
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
		perm: Perm.mod,
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
		perm: Perm.mod,
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
		perm: Perm.admin,
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
		perm: Perm.admin,
		handler({args, sender, outputSuccess, outputFail}){
			if(args.time <= 0 || args.time > 3600) fail(`Time must be a positive number less than 3600.`);
			let timeRemaining = args.time;
			const labelx = sender.unit().x;
			const labely = sender.unit().y;
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
		perm: Perm.admin,
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
		perm: Perm.admin,
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
