/*
Copyright © BalaM314, 2024. All Rights Reserved.
This file contains the in-game chat commands that can be run by trusted staff.
*/

import * as api from "./api";
import { Perm, Req, command, commandList, fail } from "./commands";
import { Gamemode, Mode, rules, stopAntiEvadeTime } from "./config";
import { maxTime } from "./globals";
import { updateMaps } from "./files";
import * as fjsContext from "./fjsContext";
import { fishState, ipPattern, uuidPattern } from "./globals";
import { menu } from './menus';
import { FishPlayer } from "./players";
import { Rank } from "./ranks";
import { addToTileHistory, colorBadBoolean, formatTime, formatTimeRelative, getAntiBotInfo, logAction, match, serverRestartLoop, untilForever, updateBans } from "./utils";
import { parseError } from './funcs';
import { escapeStringColorsClient } from './funcs';
import { escapeTextDiscord } from './funcs';
import { crash } from './funcs';
import { setToArray } from './funcs';

const spawnedUnits:Unit[] = [];

export const commands = commandList({
	warn: {
		args: ['player:player', 'message:string?'],
		description: 'Sends the player a warning (menu popup).',
		perm: Perm.warn,
		requirements: [Req.cooldown(3000)],
		handler({args, sender, outputSuccess, f}){
			if(args.player.hasPerm("blockTrolling")) fail(`Player ${args.player} is insufficiently trollable.`);

			const message = args.message ?? "You have been warned. I suggest you stop what you're doing";
			menu('Warning', message, ["[green]Accept"], args.player);
			logAction('warned', sender, args.player, message);
			outputSuccess(f`Warned player ${args.player} for "${message}"`);
		}
	},

	mute: {
		args: ['player:player'],
		description: 'Stops a player from chatting.',
		perm: Perm.mod,
		requirements: [Req.moderate("player")],
		handler({args, sender, outputSuccess, f}){
			if(args.player.muted) fail(f`Player ${args.player} is already muted.`);
			args.player.mute(sender);
			logAction('muted', sender, args.player);
			outputSuccess(f`Muted player ${args.player}.`);
		}
	},

	unmute: {
		args: ['player:player'],
		description: 'Unmutes a player',
		perm: Perm.mod,
		handler({args, sender, outputSuccess, f}){
			if(!args.player.muted && args.player.autoflagged) fail(f`Player ${args.player} is not muted, but they are autoflagged. You probably want to free them with /free.`);
			if(!args.player.muted) fail(f`Player ${args.player} is not muted.`);
			args.player.unmute(sender);
			logAction('unmuted', sender, args.player);
			outputSuccess(f`Unmuted player ${args.player}.`);
		}
	},

	kick: {
		args: ["player:player", "duration:time?", "reason:string?"],
		description: 'Kick a player with optional reason.',
		perm: Perm.mod,
		requirements: [Req.moderate("player")],
		handler({args, outputSuccess, f, sender}){
			if(!sender.hasPerm("admin") && args.duration && args.duration > 3600_000 * 6) fail(`Maximum kick duration is 6 hours.`);
			const reason = args.reason ?? "A staff member did not like your actions.";
			const duration = args.duration ?? 60_000;
			args.player.kick(reason, duration);
			logAction("kicked", sender, args.player, args.reason ?? undefined, duration);
			if(duration > 60_000) args.player.setPunishedIP(stopAntiEvadeTime);
			outputSuccess(f`Kicked player ${args.player} for ${formatTime(duration)} with reason "${reason}"`);
		}
	},

	stop: {
		args: ['player:player', "time:time?", "message:string?"],
		description: 'Stops a player.',
		perm: Perm.mod,
		requirements: [Req.moderate("player", true)],
		handler({args, sender, outputSuccess, f}){
			if(args.player.marked()){
				//overload: overwrite stoptime
				if(!args.time) fail(f`Player ${args.player} is already marked.`);
				const previousTime = formatTimeRelative(args.player.unmarkTime, true);
				args.player.updateStopTime(args.time);
				outputSuccess(f`Player ${args.player}'s stop time has been updated to ${formatTime(args.time)} (was ${previousTime}).`);
				logAction("updated stop time of", sender, args.player, args.message ?? undefined, args.time);
			} else {
				const time = args.time ?? untilForever();
				if(time + Date.now() > maxTime) fail(`Error: time too high.`);
				args.player.stop(sender, time, args.message ?? undefined);
				logAction('stopped', sender, args.player, args.message ?? undefined, time);
				//TODO outputGlobal()
				Call.sendMessage(`[orange]Player "${args.player.prefixedName}[orange]" has been marked for ${formatTime(time)}${args.message ? ` with reason: [white]${args.message}[]` : ""}.`);
			}

		}
	},

	free: {
		args: ['player:player'],
		description: 'Frees a player.',
		perm: Perm.mod,
		handler({args, sender, outputSuccess, outputFail, f}){
			if(args.player.marked()){
				args.player.free(sender);
				logAction('freed', sender, args.player);
				outputSuccess(f`Player ${args.player} has been unmarked.`);
			} else if(args.player.autoflagged){
				args.player.autoflagged = false;
				args.player.sendMessage("[yellow]You have been freed! Enjoy!");
				args.player.updateName();
				args.player.forceRespawn();
				outputSuccess(f`Player ${args.player} has been unflagged.`);
			} else {
				outputFail(f`Player ${args.player} is not marked or autoflagged.`);
			}
		}
	},

	setrank: {
		args: ["player:player", "rank:rank"],
		description: "Set a player's rank.",
		perm: Perm.mod,
		requirements: [Req.moderate("player")],
		handler({args:{rank, player}, outputSuccess, f, sender}){
			if(rank.level >= sender.rank.level)
				fail(f`You do not have permission to promote players to rank ${rank}, because your current rank is ${sender.rank}`);
			if(rank == Rank.pi && !Mode.localDebug) fail(f`Rank ${rank} is immutable.`);
			if(player.immutable() && !Mode.localDebug) fail(f`Player ${player} is immutable.`);

			player.setRank(rank);
			logAction(`set rank to ${rank.name} for`, sender, player);
			outputSuccess(f`Set rank of player ${player} to ${rank}`);
		}
	},

	setflag: {
		args: ["player:player", "flag:roleflag", "value:boolean"],
		description: "Set a player's role flags.",
		perm: Perm.mod,
		requirements: [Req.moderate("player")],
		handler({args:{flag, player, value}, sender, outputSuccess, f}){
			if(!sender.hasPerm("admin") && !flag.assignableByModerators)
				fail(f`You do not have permission to change the value of role flag ${flag}`);

			player.setFlag(flag, value);
			logAction(`set roleflag ${flag.name} to ${value} for`, sender, player);
			outputSuccess(f`Set role flag ${flag} of player ${player} to ${value}`);
		}
	},

	murder: {
		args: [],
		description: 'Kills all ohno units',
		perm: Perm.mod,
		customUnauthorizedMessage: `[yellow]You're a [scarlet]monster[].`,
		handler({output, f, allCommands}){
			const Ohnos = allCommands["ohno"].data! as any; //this is not ideal... TODO commit omega shenanigans
			const numOhnos = Ohnos.amount();
			Ohnos.killAll();
			output(f`[orange]You massacred ${numOhnos} helpless ohno crawlers.`);
		}
	},

	stop_offline: {
		args: ["time:time?", "name:string?"],
		description: "Stops an offline player.",
		perm: Perm.mod,
		handler({args, sender, outputFail, outputSuccess, f, admins}){
			const maxPlayers = 60;
			
			function stop(option:PlayerInfo, time:number){
				const fishP = FishPlayer.getFromInfo(option);
				if(sender.canModerate(fishP, true)){
					logAction(fishP.marked() ? time == 1000 ? "freed" : "updated stop time of" : "stopped", sender, option, undefined, time);
					fishP.stop(sender, time);
					outputSuccess(f`Player ${option} was marked for ${formatTime(time)}.`);
				} else {
					outputFail(`You do not have permission to stop this player.`);
				}
			}
			
			if(args.name && uuidPattern.test(args.name)){
				const info:PlayerInfo | null = admins.getInfoOptional(args.name);
				if(info != null) {
					stop(info, args.time ?? untilForever());
				} else {
					outputFail(f`Unknown UUID ${args.name}`);
				}
				return;
			}

			let possiblePlayers:PlayerInfo[];
			if(args.name) {
				possiblePlayers = setToArray(admins.searchNames(args.name));
				if(possiblePlayers.length > maxPlayers){
					let exactPlayers = setToArray(admins.findByName(args.name) as ObjectSet<PlayerInfo>);
					if(exactPlayers.length > 0){
						possiblePlayers = exactPlayers;
					} else {
						fail("Too many players with that name.");
					}
				} else if(possiblePlayers.length == 0){
					fail("No players with that name were found.");
				}
				const score = (data:PlayerInfo) => {
					const fishP = FishPlayer.getById(data.id);
					if(fishP) return fishP.lastJoined;
					return - data.timesJoined;
				}
				possiblePlayers.sort((a, b) => score(b) - score(a));
			} else {
				possiblePlayers = FishPlayer.recentLeaves.map(p => p.info());
			}


			menu("Stop", "Choose a player to mark", possiblePlayers, sender, ({option: optionPlayer, sender}) => {
				if(args.time == null){
					menu("Stop", "Select stop time", ["2 days", "7 days", "30 days", "forever"], sender, ({option: optionTime, sender}) => {
						const time =
							optionTime == "2 days" ? 172800000 :
							optionTime == "7 days" ? 604800000 :
							optionTime == "30 days" ? 2592000000 :
							(maxTime - Date.now() - 10000);
						stop(optionPlayer, time);
					}, false);
				} else {
					stop(optionPlayer, args.time);
				}
			}, true, p => p.lastName);
		}
	},

	restart: {
		args: [],
		description: "Stops and restarts the server. Do not run when the player count is high.",
		perm: Perm.admin,
		handler(){
			serverRestartLoop(30);
		}
	},

	history: {
		args: ["player:player"],
		description: "Shows moderation history for a player.",
		perm: Perm.mod,
		handler({args, output, f}){
			if(args.player.history && args.player.history.length > 0){
				output(
					`[yellow]_______________Player history_______________\n\n` +
					(args.player as FishPlayer).history.map(e =>
						`${e.by} [yellow]${e.action} ${args.player.prefixedName} [white]${formatTimeRelative(e.time)}`
					).join("\n")
				);
			} else {
				output(f`[yellow]No history was found for player ${args.player}.`);
			}
		}
	},

	save: {
		args: [],
		description: "Saves the game state.",
		perm: Perm.mod,
		handler({outputSuccess}){
			FishPlayer.saveAll();
			const file = Vars.saveDirectory.child(`1.${Vars.saveExtension}`);
			SaveIO.save(file);
			outputSuccess("Game saved.");
		}
	},

	wave: {
		args: ["wave:number"],
		description: "Sets the wave number.",
		perm: Perm.admin,
		handler({args, outputSuccess, f}){
			if(args.wave < 0) fail(`Wave must be positive.`);
			if(!Number.isSafeInteger(args.wave)) fail(`Wave must be an integer.`);
			Vars.state.wave = args.wave;
			outputSuccess(f`Set wave to ${Vars.state.wave}`);
		}
	},

	label: {
		args: ["time:time", "message:string"],
		description: "Places a label at your position for a specified amount of time.",
		perm: Perm.mod,
		handler({args, sender, outputSuccess, f}){
			if(args.time > 36000_000) fail(`Time must be less than 10 hours.`);
			let timeRemaining = args.time / 1000;
			const labelx = sender.unit().x;
			const labely = sender.unit().y;
			fishState.labels.push(Timer.schedule(() => {
				if(timeRemaining > 0){
					let timeseconds = timeRemaining % 60;
					let timeminutes = (timeRemaining - timeseconds) / 60;
					Call.label(
`${sender.name}

[white]${args.message}

[acid]${timeminutes.toString().padStart(2, "0")}:${timeseconds.toString().padStart(2, "0")}`,
						1, labelx, labely
					);
					timeRemaining --;
				}
			}, 0, 1, args.time));
			outputSuccess(f`Placed label "${args.message}" for ${timeRemaining} seconds.`);
		}
	},

	clearlabels: {
		args: [],
		description: "Removes all labels.",
		perm: Perm.mod,
		handler({outputSuccess}){
			fishState.labels.forEach(l => l.cancel());
			outputSuccess(`Removed all labels.`);
		}
	},

	member: {
		args: ["value:boolean", "player:player"],
		description: "Sets a player's member status.",
		perm: Perm.admin,
		handler({args, outputSuccess, f}){
			args.player.setFlag("member", args.value);
			outputSuccess(f`Set membership status of player ${args.player} to ${args.value}.`);
		}
	},
	remind: {
		args: ["rule:number", "target:player?"],
		description: "Remind players in chat of a specific rule.",
		perm: Perm.mod,
		handler({args, outputSuccess, f}){
			const rule = rules[args.rule - 1] ?? fail(`The rule you requested does not exist.`);
			if(args.target){
				args.target.sendMessage(`A staff member wants to remind you of the following rule:\n` + rule);
				outputSuccess(f`Reminded ${args.target} of rule ${args.rule}`);
			} else {
				Call.sendMessage(`A staff member wants to remind everyone of the following rule:\n` + rule);
			}
		},
	},

	ban: {
		args: ["uuid_or_ip:string?"],
		description: "Bans a player by UUID and IP.",
		perm: Perm.admin,
		handler({args, sender, outputSuccess, f, admins}){
			if(args.uuid_or_ip && uuidPattern.test(args.uuid_or_ip)){
				//Overload 1: ban by uuid
				const uuid = args.uuid_or_ip;
				let data:PlayerInfo | null;
				if((data = admins.getInfoOptional(uuid)) != null && data.admin) fail(`Cannot ban an admin.`);
				const name = data ? `${escapeStringColorsClient(data.lastName)} (${uuid}/${data.lastIP})` : uuid;
				menu("Confirm", `Are you sure you want to ban ${name}?`, ["[red]Yes", "[green]Cancel"], sender, ({option:confirm}) => {
					if(confirm != "[red]Yes") fail("Cancelled.");
					admins.banPlayerID(uuid);
					if(data){
						const ip = data.lastIP;
						admins.banPlayerIP(ip);
						api.ban({ip, uuid});
						Log.info(`${uuid}/${ip} was banned.`);
						logAction("banned", sender, data);
						outputSuccess(f`Banned player ${escapeStringColorsClient(data.lastName)} (${uuid}/${ip})`);
						//TODO add way to specify whether to activate or escape color tags
					} else {
						api.ban({uuid});
						Log.info(`${uuid} was banned.`);
						logAction("banned", sender, uuid);
						outputSuccess(f`Banned player ${uuid}. [yellow]Unable to determine IP.[]`);
					}
					updateBans(player => `[scarlet]Player [yellow]${player.name}[scarlet] has been whacked by ${sender.prefixedName}.`);
				}, false);
				return;
			} else if(args.uuid_or_ip && ipPattern.test(args.uuid_or_ip)){
				//Overload 2: ban by uuid
				const ip = args.uuid_or_ip;
				menu("Confirm", `Are you sure you want to ban IP ${ip}?`, ["[red]Yes", "[green]Cancel"], sender, ({option:confirm}) => {
					if(confirm != "[red]Yes") fail("Cancelled.");

					api.ban({ip});
					const info = admins.findByIP(ip);
					if(info) logAction("banned", sender, info);
					else logAction(`banned ${ip}`, sender);

					const alreadyBanned = admins.banPlayerIP(ip);
					if(alreadyBanned){
						outputSuccess(f`IP ${ip} is already banned. Ban was synced to other servers.`);
					} else {
						outputSuccess(f`IP ${ip} has been banned. Ban was synced to other servers.`);
					}
					
					updateBans(player => `[scarlet]Player [yellow]${player.name}[scarlet] has been whacked by ${sender.prefixedName}.`);
				}, false);
				return;
			}
			//Overload 3: ban by menu
			menu(`[scarlet]BAN[]`, "Choose a player to ban.", setToArray(Groups.player), sender, ({option}) => {
				if(option.admin) fail(`Cannot ban an admin.`);
				menu("Confirm", `Are you sure you want to ban ${option.name}?`, ["[red]Yes", "[green]Cancel"], sender, ({option:confirm}) => {
					if(confirm != "[red]Yes") fail("Cancelled.");
					admins.banPlayerIP(option.ip()); //this also bans the UUID
					api.ban({ip: option.ip(), uuid: option.uuid()});
					Log.info(`${option.ip()}/${option.uuid()} was banned.`);
					logAction("banned", sender, option.getInfo());
					outputSuccess(f`Banned player ${option}.`);
					updateBans(player => `[scarlet]Player [yellow]${player.name}[scarlet] has been whacked by ${sender.prefixedName}.`);
				}, false);
			}, true, opt => opt.name);
		}
	},

	kill: {
		args: ["player:player"],
		description: "Kills a player's unit.",
		perm: Perm.admin,
		requirements: [Req.moderate("player", true)],
		handler({args, outputFail, outputSuccess, f}){

			const unit = args.player.unit();
			if(unit){
				unit.kill();
				outputSuccess(f`Killed the unit of player ${args.player}.`);
			} else {
				outputFail(f`Player ${args.player} does not have a unit.`)
			}
		}
	},
	killunits: {
		args: ["team:team?", "unit:unittype?"],
		description: "Kills all units, optionally specifying a team and unit type.",
		perm: Perm.massKill,
		handler({args:{team, unit}, sender, outputSuccess, outputFail, f}){
			if(team){
				menu(
					`Confirm`,
					`This will kill [scarlet]every ${unit ? unit.localizedName : "unit"}[] on the team ${team.coloredName()}.`,
					["[orange]Kill units[]", "[green]Cancel[]"],
					sender,
					({option}) => {
						if(option == "[orange]Kill units[]"){
							if(unit){
								let i = 0;
								team.data().units.each(u => u.type == unit, u => {
									u.kill();
									i ++;
								});
								outputSuccess(f`Killed ${i} units on ${team}.`);
							} else {
								const before = team.data().units.size;
								team.data().units.each(u => u.kill());
								outputSuccess(f`Killed ${before} units on ${team}.`);
							}
						} else outputFail(`Cancelled.`);
					}, false
				);
			} else {
				menu(
					`Confirm`,
					`This will kill [scarlet]every single ${unit ? unit.localizedName : "unit"}[].`,
					["[orange]Kill all units[]", "[green]Cancel[]"],
					sender,
					({option}) => {
						if(option == "[orange]Kill all units[]"){
							if(unit){
								let i = 0;
								Groups.unit.each(u => u.type == unit, u => {
									u.kill();
									i ++;
								});
								outputSuccess(f`Killed ${i} units.`);
							} else {
								const before = Groups.unit.size();
								Groups.unit.each(u => u.kill());
								outputSuccess(f`Killed ${before} units.`);
							}
						} else outputFail(`Cancelled.`);
					}, false
				);
			}
		}
	},
	killbuildings: {
		args: ["team:team?"],
		description: "Kills all buildings (except cores), optionally specifying a team.",
		perm: Perm.massKill,
		handler({args:{team}, sender, outputSuccess, outputFail, f}){
			if(team){
				menu(
					`Confirm`,
					`This will kill [scarlet]every building[] on the team ${team.coloredName()}, except cores.`,
					["[orange]Kill buildings[]", "[green]Cancel[]"],
					sender,
					({option}) => {
						if(option == "[orange]Kill buildings[]"){
							const count = team.data().buildings.size;
							team.data().buildings.each(b => !(b.block instanceof CoreBlock), b => b.tile.remove());
							outputSuccess(f`Killed ${count} buildings on ${team}`);
						} else outputFail(`Cancelled.`);
					}, false
				);
			} else {
				menu(
					`Confirm`,
					`This will kill [scarlet]every building[] except cores.`,
					["[orange]Kill buildings[]", "[green]Cancel[]"],
					sender,
					({option}) => {
						if(option == "[orange]Kill buildings[]"){
							const count = Groups.build.size();
							Groups.build.each(b => !(b.block instanceof CoreBlock), b => b.tile.remove());
							outputSuccess(f`Killed ${count} buildings.`);
						} else outputFail(`Cancelled.`);
					}, false
				);
			}
		}
	},

	respawn: {
		args: ["player:player"],
		description: "Forces a player to respawn.",
		perm: Perm.mod,
		requirements: [Req.moderate("player", true, "mod", true)],
		handler({args, outputSuccess, f}){
			
			args.player.forceRespawn();
			outputSuccess(f`Respawned player ${args.player}.`);
		}
	},

	m: {
		args: ["message:string"],
		description: `Sends a message to muted players only.`,
		perm: Perm.mod,
		handler({sender, args}){
			FishPlayer.messageMuted(sender.prefixedName, args.message);
		}
	},

	info: {
		args: ["target:player", "showColors:boolean?"],
		description: "Displays information about an online player.",
		perm: Perm.none,
		handler({sender, args, output, f}){
			const info = args.target.info();
			const names = args.showColors
				? info.names.map(escapeStringColorsClient).toString(", ")
				: [...new Set(info.names.map(n => Strings.stripColors(n)).toArray())].join(", ");
			output(f`\
[accent]Info for player ${args.target} [gray](${escapeStringColorsClient(args.target.name)}) (#${args.target.player!.id.toString()})
	[accent]Rank: ${args.target.rank}
	[accent]Role flags: ${Array.from(args.target.flags).map(f => f.coloredName()).join(" ")}
	[accent]Stopped: ${colorBadBoolean(!args.target.hasPerm("play"))}
	[accent]marked: ${args.target.marked() ? `until ${formatTimeRelative(args.target.unmarkTime)}` : "[green]false"}
	[accent]muted: ${colorBadBoolean(args.target.muted)}
	[accent]autoflagged: ${colorBadBoolean(args.target.autoflagged)}
	[accent]times joined / kicked: ${info.timesJoined}/${info.timesKicked}
	[accent]First joined: ${formatTimeRelative(args.target.firstJoined)}
	[accent]Names used: [[${names}]`
			);
			if(sender.hasPerm("viewUUIDs"))
				output(f`\
	[#FFAAAA]UUID: ${args.target.uuid}
	[#FFAAAA]IP: ${args.target.ip()}`
				);
		}
	},

	spawn: {
		args: ["type:unittype", "x:number?", "y:number?", "team:team?"],
		description: "Spawns a unit of specified type at your position. [scarlet]Usage will be logged.[]",
		perm: Perm.admin,
		handler({sender, args, outputSuccess, f}){
			const x = args.x ? (args.x * 8) : sender.player!.x;
			const y = args.y ? (args.y * 8) : sender.player!.y;
			const team = args.team ?? sender.team();
			const unit = args.type.spawn(team, x, y);
			spawnedUnits.push(unit);
			if(!Gamemode.sandbox()) logAction(`spawned unit ${args.type.name} at ${Math.round(x / 8)}, ${Math.round(y / 8)}`, sender);
			outputSuccess(f`Spawned unit ${args.type} at (${Math.round(x / 8)}, ${Math.round(y / 8)})`);
		}
	},
	setblock: {
		args: ["x:number", "y:number", "block:block", "team:team?", "rotation:number?"],
		description: "Sets the block at a location.",
		perm: Perm.admin,
		handler({args, sender, outputSuccess, f}){
			const team = args.team ?? sender.team();
			const tile = Vars.world.tile(args.x, args.y);
			if(args.rotation != null && (args.rotation < 0 || args.rotation > 3)) fail(f`Invalid rotation ${args.rotation}`)
			if(tile == null)
				fail(f`Position (${args.x}, ${args.y}) is out of bounds.`);
			tile.setNet(args.block, team, args.rotation ?? 0);
			addToTileHistory({
				pos: `${args.x},${args.y}`,
				uuid: sender.uuid,
				action: `setblocked`,
				type: args.block.localizedName
			});
			if(!Gamemode.sandbox()) logAction(`set block to ${args.block.localizedName} at ${args.x},${args.y}`, sender);
			outputSuccess(f`Set block at ${args.x}, ${args.y} to ${args.block}`);
		}
	},
	setblockr: {
		args: ["block:block?", "team:team?", "rotation:number?"],
		description: "Sets the block at tapped locations, repeatedly.",
		perm: Perm.admin,
		tapped({args, sender, f, x, y, outputSuccess}){
			if(!args.block) crash(`uh oh`);
			const team = args.team ?? sender.team();
			const tile = Vars.world.tile(x, y);
			if(args.rotation != null && (args.rotation < 0 || args.rotation > 3)) fail(f`Invalid rotation ${args.rotation}`)
			if(tile == null)
				fail(f`Position (${x}, ${y}) is out of bounds.`);
			tile.setNet(args.block, team, args.rotation ?? 0);
			addToTileHistory({
				pos: `${x},${y}`,
				uuid: sender.uuid,
				action: `setblocked`,
				type: args.block.localizedName
			});
			if(!Gamemode.sandbox()) logAction(`set block to ${args.block.localizedName} at ${x},${y}`, sender);
			outputSuccess(f`Set block at ${x}, ${y} to ${args.block}`);
		},
		handler({args, outputSuccess, handleTaps, currentTapMode, f}){
			if(args.block){
				handleTaps("on");
				if(currentTapMode == "off"){
					outputSuccess("setblockr enabled.\n[scarlet]Be careful, you have the midas touch now![] Turn it off by running /setblockr again.");
				} else {
					outputSuccess(f`Changed setblockr's block to ${args.block}`);
				}
			} else {
				if(currentTapMode == "off"){
					fail(`Please specify the block to place.`);
				} else {
					handleTaps("off");
					outputSuccess("setblockr disabled.");
				}
			}
		}
	},
	exterminate: {
		args: [],
		description: "Removes all spawned units.",
		perm: Perm.admin,
		handler({sender, outputSuccess, f}){
			let numKilled = 0;
			spawnedUnits.forEach(u => {
				if(u.isAdded() && !u.dead){
					u.kill();
					numKilled ++;
				}
			});
			if(!Gamemode.sandbox()) logAction(`exterminated ${numKilled} units`, sender);
			outputSuccess(f`Exterminated ${numKilled} units.`);
		}
	},
	js: {
		args: ["javascript:string"],
		description: "Run arbitrary javascript.",
		perm: Perm.runJS,
		customUnauthorizedMessage: "[scarlet]You are not in the jsers file. This incident will be reported.[]",
		handler({args: {javascript}, output, outputFail, sender}){
			
			//Additional validation couldn't hurt...
			const playerInfo_AdminUsid = sender.info().adminUsid;
			if(!playerInfo_AdminUsid || playerInfo_AdminUsid != sender.player!.usid() || sender.usid != sender.player!.usid()){
				api.sendModerationMessage(
`# !!!!! /js authentication failed !!!!!
Server: ${Gamemode.name()} Player: ${escapeTextDiscord(sender.cleanedName)}/\`${sender.uuid}\`
<@!709904412033810533>`
				);
				fail(`Authentication failure`);
			}

			if(javascript == "Timer.instance().clear()") fail(`Are you really sure you want to do that? If so, prepend "void" to your command.`);

			try {
				const scripts = Vars.mods.getScripts();
				const out = scripts.context.evaluateString(scripts.scope, javascript, "fish-js-console.js", 1);
				if(out instanceof Array){
					output("[cyan]Array: [[[]" + out.join(", ") + "[cyan]]");
				} else if(out === undefined){
					output("[blue]undefined[]");
				} else if(out === null){
					output("[blue]null[]");
				} else if(out instanceof Error){
					outputFail(parseError(out));
				} else if(typeof out == "number"){
					output(`[blue]${out}[]`);
				} else {
					output(out);
				}
			} catch(err){
				outputFail(parseError(err));
			}
		}
	},
	fjs: {
		args: ["javascript:string"],
		description: "Run arbitrary javascript in the fish-commands context.",
		perm: Perm.runJS,
		customUnauthorizedMessage: "[scarlet]You are not in the jsers file. This incident will be reported.[]",
		handler({args: {javascript}, output, outputFail, sender}){
			
			//Additional validation couldn't hurt...
			const playerInfo_AdminUsid = sender.info().adminUsid;
			if(!playerInfo_AdminUsid || playerInfo_AdminUsid != sender.player!.usid() || sender.usid != sender.player!.usid()){
				api.sendModerationMessage(
`# !!!!! /js authentication failed !!!!!
Server: ${Gamemode.name()} Player: ${escapeTextDiscord(sender.cleanedName)}/\`${sender.uuid}\`
<@!709904412033810533>`
				);
				fail(`Authentication failure`);
			}

			fjsContext.runJS(javascript, output, outputFail);
		}
	},
	antibot: {
		args: ["state:boolean?"],
		description: "Checks anti bot stats, or force enables anti bot mode, MAKE SURE TO TURN IT OFF",
		perm: Perm.admin,
		handler({args, outputSuccess, output}){
			if(args.state !== null){
				FishPlayer.antiBotModeOverride = args.state;
				outputSuccess(`Set antibot mode override to ${colorBadBoolean(args.state)}.`);
				if(args.state) output(`[scarlet]MAKE SURE TO TURN IT OFF!!!`);
			} else {
				output(
`[acid]Antibot status:
[acid]Enabled: ${colorBadBoolean(FishPlayer.antiBotMode())}
${getAntiBotInfo("client")}`
				);
			}
		}
	},
	chatstrictness: {
		args: ["player:player", "value:string"],
		description: "Sets chat strictness for a player.",
		perm: Perm.mod,
		handler({args:{player, value}, sender, outputSuccess, f}){
			if(!sender.canModerate(player, true)) fail(`You do not have permission to set the chat strictness level of this player.`);
			if(!(value == "chat" || value == "strict")) fail(`Invalid chat strictness level: valid levels are "chat", "strict"`);
			player.chatStrictness = value;
			logAction(`set chat strictness to ${value} for`, sender, player);
			outputSuccess(f`Set chat strictness for player ${player} to "${value}".`);
		}
	},
	emanate: command(() => {
		const unitMapping:Record<string, Unit> = {};
		Timer.schedule(() => {
			for(const [uuid, unit] of Object.entries(unitMapping)){
				const fishP = FishPlayer.getById(uuid);
				if(!fishP || !fishP.connected() || (unit.getPlayer() != fishP.player)){
					delete unitMapping[uuid];
					unit?.kill();
				}
			}
		}, 1, 0.5);
		return {
			args: [],
			description: "Puts you in an emanate.",
			perm: Perm.admin,
			data: {unitMapping},
			handler({sender, outputSuccess}){
				if(!sender.connected() || !sender.unit().added || sender.unit().dead) fail("You cannot spawn an emanate because you are dead.");
				const emanate = UnitTypes.emanate.spawn(sender.team(), sender.player!.x, sender.player!.y);
				sender.player!.unit(emanate);
				unitMapping[sender.uuid] = emanate;
				if(!Gamemode.sandbox()) logAction("spawned an emanate", sender);
				outputSuccess("Spawned an emanate.");
			}
		};
	}),
	updatemaps: {
		args: [],
		description: 'Attempt to fetch and update all map files',
		perm: Perm.trusted,
		requirements: [Req.cooldownGlobal(300_000)],
		handler({output, outputSuccess, outputFail}){
			output(`Updating maps... (this may take a while)`);
			updateMaps()
				.then((changed) => {
					Log.info("Maps updated.");
					if(changed){
						outputSuccess(`Map update completed.`);
						Call.sendMessage(`[orange]Maps have been updated. Run [white]/maps[] to view available maps.`);
					} else {
						outputSuccess(`Map update completed; already up to date.`);
					}
				})
				.catch((message) => {
					outputFail(`Map update failed: ${message}`);
					Log.err(`Map updates failed: ${message}`);
				});
		}
	},
	clearfire: {
		args: [],
		description: "Clears all the fires.",
		perm: Perm.admin,
		handler({output, outputSuccess}){
			output(`Removing fires...`);
			let totalRemoved = 0;
			Call.sendMessage("[scarlet][[Fire Department]:[yellow] Fires were reported. Trucks are en-route. Removing all fires shortly.");
			Timer.schedule(() => {
				totalRemoved += Groups.fire.size();
				Groups.fire.each(f => f.remove());
				Groups.fire.clear();
			}, 2, 0.1, 40);
			Timer.schedule(() => {
				outputSuccess(`Removed ${totalRemoved} fires.`);
				Call.sendMessage(`[scarlet][[Fire Department]:[yellow] We've extinguished ${totalRemoved} fires.`);
			}, 6.1);
		}
	},
	search: {
		args: ["input:string"],
		description: "Searches playerinfo by name, IP, or UUID.",
		perm: Perm.admin,
		handler({args:{input}, admins, output, f, sender}){
			if(uuidPattern.test(input)){
				const fishP = FishPlayer.getById(input);
				const info = admins.getInfoOptional(input);
				if(fishP == null && info == null) fail(f`No stored data matched uuid ${input}.`);
				else if(fishP == null && info) output(f`[accent]\
Found player info (but no fish player data) for uuid ${input}
Last name used: "${info.plainLastName()}" [gray](${escapeStringColorsClient(info.lastName)})[] [[${info.names.map(escapeStringColorsClient).items.join(", ")}]
IPs used: ${info.ips.map(i => `[blue]${i}[]`).toString(", ")}`
				);
				else if(fishP && info) output(f`[accent]\
Found fish player data for uuid ${input}
Last name used: "${fishP.name}" [gray](${escapeStringColorsClient(info.lastName)})[] [[${info.names.map(escapeStringColorsClient).items.join(", ")}]
IPs used: ${info.ips.map(i => `[blue]${i}[]`).toString(", ")}`
				);
				else fail(f`Super weird edge case: found fish player data but no player info for uuid ${input}.`);
			} else if(ipPattern.test(input)){
				const matches = admins.findByIPs(input);
				if(matches.isEmpty()) fail(f`No stored data matched IP ${input}`);
				output(f`[accent]Found ${matches.size} match${matches.size == 1 ? "" : "es"} for search "${input}".`);
				matches.each(info => output(f`[accent]\
Player with uuid ${info.id}
Last name used: "${info.plainLastName()}" [gray](${escapeStringColorsClient(info.lastName)})[] [[${info.names.map(escapeStringColorsClient).items.join(", ")}]
IPs used: ${info.ips.map(i => `[blue]${i}[]`).toString(", ")}`
				));
			} else {
				const matches = Vars.netServer.admins.searchNames(input);
				if(matches.isEmpty()) fail(f`No stored data matched name ${input}`);
				output(f`[accent]Found ${matches.size} match${matches.size == 1 ? "" : "es"} for search "${input}".`);
				const displayMatches = () => {
					matches.each(info => output(f`[accent]\
Player with uuid ${info.id}
Last name used: "${info.plainLastName()}" [gray](${escapeStringColorsClient(info.lastName)})[] [[${info.names.map(escapeStringColorsClient).items.join(", ")}]
IPs used: ${info.ips.map(i => `[blue]${i}[]`).toString(", ")}`
					));
				};
				if(matches.size > 20) menu("Confirm", `Are you sure you want to view all ${matches.size} matches?`, ["Yes"], sender, displayMatches);
				else displayMatches();
			}
		}
	},
	peace: {
		args: ["peace:boolean"],
		description: "Toggles peaceful mode for sandbox.",
		perm: Perm.mod,
		handler({args}){
			if(args.peace){
				fishState.peacefulMode = true;
				Groups.player.each(p => {
					if(p.team() != Vars.state.rules.defaultTeam){
						p.team(Vars.state.rules.defaultTeam);
					}
				});
				Call.sendMessage(`[[Sandbox] [green]Enabled peaceful mode.`);
			} else {
				fishState.peacefulMode = false;
				Call.sendMessage(`[[Sandbox] [red]Disabled peaceful mode.`);
			}
		},
	},
	effects: {
		args: ["mode:string", "player:player?", "duration:time?"],
		description: "Applies effects to a player's unit.",
		perm: Perm.admin,
		handler({args, sender, f, outputSuccess}){
			if(args.player?.hasPerm("blockTrolling"))
				fail(`Player ${args.player} is insufficiently trollable.`);
			if(args.player && !sender.canModerate(args.player, false))
				fail(`You do not have permission to perform moderation actions on this player.`);
			const target = args.player ?? sender;
			const unit = target.unit();
			if(!unit || unit.dead) fail(f`${target}'s unit is dead.`);
			const ticks = (args.duration ?? 1e12) / 1000 * 60;
			if(args.mode === "clear"){
				unit.clearStatuses();
				return;
			}
			const modes = {
				fast: [StatusEffects.fast],
				fast2: [StatusEffects.fast, StatusEffects.overdrive, StatusEffects.overclock],
				boss: [StatusEffects.boss],
				health: [StatusEffects.boss, StatusEffects.shielded],
				slow: [StatusEffects.slow],
				slow2: [
					StatusEffects.slow,
					StatusEffects.freezing,
					StatusEffects.wet,
					StatusEffects.muddy,
					StatusEffects.sapped,
					StatusEffects.sporeSlowed,
					StatusEffects.electrified,
					StatusEffects.tarred,
				],
				freeze: [StatusEffects.unmoving],
				disarm: [StatusEffects.disarmed],
				invincible: [StatusEffects.invincible],
				boost: [
					StatusEffects.fast,
					StatusEffects.overdrive,
					StatusEffects.overclock,
					StatusEffects.boss,
					StatusEffects.shielded,
				],
				damage: [
					StatusEffects.burning,
					StatusEffects.freezing,
					StatusEffects.wet,
					StatusEffects.muddy,
					StatusEffects.melting,
					StatusEffects.sapped,
					StatusEffects.tarred,
					StatusEffects.shocked,
					StatusEffects.blasted,
					StatusEffects.corroded,
					StatusEffects.sporeSlowed,
					StatusEffects.electrified,
					StatusEffects.fast,
				],
			};
			const effects = match(args.mode, modes, null) ?? fail(`Invalid mode. Supported modes: ${Object.keys(modes).join(", ")}`);
			for(const effect of effects){
				unit.apply(effect, ticks);
			}
			outputSuccess(`Applied effects.`);
			if(!Gamemode.sandbox()) logAction(`applied ${args.mode} effects`, sender, target);
		}
	},
	items: {
		args: ["team:team", "item:item", "amount:number"],
		description: "Gives items to a team.",
		perm: Perm.admin,
		handler({args:{team, item, amount}, sender, outputSuccess, f}){
			const core = team.data().cores.firstOpt() ?? fail(f`Team ${team} has no cores.`);
			core.items.add(item, amount);
			outputSuccess(f`Gave ${amount} ${item} to ${team}.`);
			if(!Gamemode.sandbox()) logAction(`gave items to ${team.name}`, sender);
		}
	}
});
