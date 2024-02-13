import * as api from "./api";
import * as fjsContext from "./fjsContext";
import { Perm, command, commandList, fail } from "./commands";
import { getGamemode, localDebug, maxTime, stopAntiEvadeTime } from "./config";
import { uuidPattern } from "./globals";
import { menu } from './menus';
import { FishPlayer } from "./players";
import { Rank, RoleFlag } from "./ranks";

import {
	colorBadBoolean, escapeStringColorsClient, escapeTextDiscord, formatTime, formatTimeRelative,
	getAntiBotInfo, logAction, parseError, serverRestartLoop, setToArray, untilForever, updateBans
} from "./utils";

const spawnedUnits:Unit[] = [];

export const commands = commandList({
	warn: {
		args: ['player:player', 'message:string?'],
		description: 'Sends the player a warning (menu popup).',
		perm: Perm.mod,
		handler({args, sender, outputSuccess, f, lastUsedSuccessfullySender}){
			if(Date.now() - lastUsedSuccessfullySender < 3000) fail(`This command was run recently and is on cooldown.`);
			if(args.player.hasPerm("blockTrolling")) fail(`Player ${args.player} is insufficiently trollable.`);

			const message = args.message ?? "You have been warned. I suggest you stop what you're doing";
			menu('Warning', message, ['accept'], args.player);
			logAction('warned', sender, args.player, message);
			outputSuccess(f`Warned player ${args.player} for "${message}"`);
		}
	},

	mute: {
		args: ['player:player'],
		description: 'Stops a player from chatting.',
		perm: Perm.mod,
		handler({args, sender, outputSuccess, f}){
			if(args.player.muted) fail(f`Player ${args.player} is already muted.`);
			if(!sender.canModerate(args.player)) fail(`You do not have permission to mute this player.`);
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
		args: ['player:player', 'reason:string?'],
		description: 'Kick a player with optional reason.',
		perm: Perm.mod,
		handler({args, outputSuccess, f, sender}){
			if(!sender.canModerate(args.player)) fail(`You do not have permission to kick this player.`);
			const reason = args.reason ?? 'A staff member did not like your actions.';
			args.player.player.kick(reason);
			logAction('kicked', sender, args.player);
			args.player.setPunishedIP(stopAntiEvadeTime);
			outputSuccess(f`Kicked player ${args.player} for "${reason}"`);
		}
	},

	stop: {
		args: ['player:player', "time:time?", "message:string?"],
		description: 'Stops a player.',
		perm: Perm.mod,
		handler({args, sender, outputSuccess, f}){
			if(args.player.marked()){
				//overload: overwrite stoptime
				if(!args.time) fail(f`Player ${args.player} is already marked.`);
				const previousTime = formatTimeRelative(args.player.unmarkTime, true);
				args.player.updateStopTime(args.time);
				outputSuccess(f`Player ${args.player}'s stop time has been updated to ${formatTime(args.time)} (was ${previousTime}).`);
				logAction("updated stop time of", sender, args.player, args.message ?? undefined, args.time);
				return;
			}

			if(!sender.canModerate(args.player, false)) fail(`You do not have permission to stop this player.`);
			const time = args.time ?? untilForever();
			if(time + Date.now() > maxTime) fail(`Error: time too high.`);
			args.player.stop(sender, time, args.message ?? undefined);
			logAction('stopped', sender, args.player, args.message ?? undefined, time);
			//TODO outputGlobal()
			Call.sendMessage(`[orange]Player "${args.player.name}[orange]" has been marked for ${formatTime(time)}${args.message ? ` with reason: [white]${args.message}[]` : ""}.`);
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
		handler({args:{rank, player}, outputSuccess, f, sender}){
			if(rank.level >= sender.rank.level)
				fail(f`You do not have permission to promote players to rank ${rank}, because your current rank is ${sender.rank}`);
			if(!sender.canModerate(player))
				fail(`You do not have permission to modify the rank of player ${player}`);
			if(rank == Rank.pi && !localDebug) fail(f`Rank ${rank} is immutable.`);
			if(player.immutable() && !localDebug) fail(f`Player ${player} is immutable.`);

			player.setRank(rank);
			logAction(`set rank to ${rank.name} for`, sender, player);
			outputSuccess(f`Set rank of player ${player} to ${rank}`);
		}
	},

	setflag: {
		args: ["player:player", "flag:roleflag", "value:boolean"],
		description: "Set a player's role flags.",
		perm: Perm.mod,
		handler({args:{flag, player, value}, sender, outputSuccess, f}){
			if(!sender.canModerate(player))
				fail(f`You do not have permission to modify the role flags of player ${player}`);
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
		args: ["time:time?", "name:string"],
		description: "Stops an offline player.",
		perm: Perm.mod,
		handler({args, sender, outputFail, outputSuccess, f, admins}){
			const maxPlayers = 60;
			
			function stop(option:PlayerInfo, time:number){
				const fishP = FishPlayer.getFromInfo(option);
				if(sender.canModerate(fishP, true)){
					fishP.stop(sender, time);
					logAction('stopped', sender, option, undefined, time);
					outputSuccess(f`Player ${option} was marked for ${formatTime(time)}.`);
				} else {
					outputFail(`You do not have permission to stop this player.`);
				}
			}
			
			if(uuidPattern.test(args.name)){
				const info:PlayerInfo | null = admins.getInfoOptional(args.name);
				if(info != null) {
					stop(info, args.time ?? untilForever());
				} else {
					outputFail(f`Unknown UUID ${args.name}`);
				}
				return;
			}

			let possiblePlayers:PlayerInfo[] = setToArray(admins.searchNames(args.name));
			if(possiblePlayers.length > maxPlayers){
				let exactPlayers = setToArray(admins.findByName(args.name) as ObjectSet<PlayerInfo>);
				if(exactPlayers.length > 0){
					possiblePlayers = exactPlayers;
				} else {
					fail('Too many players with that name.');
				}
			} else if(possiblePlayers.length == 0){
				fail("No players with that name were found.");
			}
			function score(data:PlayerInfo){
				const fishP = FishPlayer.getById(data.id);
				if(fishP) return fishP.lastJoined;
				return - data.timesJoined;
			}
			possiblePlayers.sort((a, b) => score(b) - score(a));


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
						`${e.by} [yellow]${e.action} ${args.player.name} [white]${formatTimeRelative(e.time)}`
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
		handler({args, outputSuccess, outputFail, f}){
			if(args.wave > 0 && Number.isInteger(args.wave)){
				Vars.state.wave = args.wave;
				outputSuccess(f`Set wave to ${Vars.state.wave}`);
			} else {
				outputFail(`Wave must be a positive integer.`);
			}
		}
	},

	label: {
		args: ["time:number", "message:string"],
		description: "Places a label at your position for a specified amount of time.",
		perm: Perm.mod,
		handler({args, sender, outputSuccess, f}){
			if (args.time <= 0)
                		(0, commands_1.fail)("/label cannot go back in time");
            		if (args.time > 356400)// 99 hours, in seconds
                		(0, commands_1.fail)("this seems a little excessive, even for a mod ");

			let timeRemaining = args.time;
			const labelx = sender.unit().x;
			const labely = sender.unit().y;
			Timer.schedule(function () {
               		 	if (timeRemaining > 0) {
                    			var timeseconds = timeRemaining % 60;
					if(timeseconds < 10){
						timeseconds = "0" + timeseconds
					}
					var timeminutes =  (((timeRemaining - timeRemaining % 60) / 60) % 60);
                    			if(timeminutes < 10){
						timeminutes = "0" + timeminutes
					}
                    			var timehours = (timeRemaining - timeRemaining % 3600) / 3600;
                    			if(timehours < 10){
                        			timehours = "0" + timehours
                   			}
                    			Call.label("".concat(sender.name, "\n\n[white]").concat(args.message, "\n\n[acid]").concat(timehours, ":").concat(timeminutes, ":").concat(timeseconds), 1, labelx, labely);
                    			timeRemaining--;
                		}
            		}, 0, 1, args.time);
		outputSuccess(f`Placed label "${args.message}" for ${args.time} seconds.`);
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

	ban: {
		args: ["uuid:uuid?"],
		description: "Bans a player by UUID and IP.",
		perm: Perm.admin,
		handler({args, sender, outputSuccess, f, admins}){
			if(args.uuid){
				//Overload 1: ban by uuid
				let data:PlayerInfo | null;
				if((data = admins.getInfoOptional(args.uuid)) != null && data.admin){
					fail(`Cannot ban an admin.`);
				}
				const name = data ? `${escapeStringColorsClient(data.lastName)} (${args.uuid}/${data.lastIP})` : args.uuid;
				menu("Confirm", `Are you sure you want to ban ${name}?`, ["Yes", "Cancel"], sender, ({option:confirm}) => {
					if(confirm != "Yes") fail("Cancelled.");
					const uuid = args.uuid!;
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
					updateBans(player => `[scarlet]Player [yellow]${player.name}[scarlet] has been whacked by ${sender.player.name}.`);
				}, false);
				return;
			}
			//Overload 1: ban by menu
			menu(`[scarlet]BAN[]`, "Choose a player to ban.", setToArray(Groups.player), sender, ({option}) => {
				if(option.admin) fail(`Cannot ban an admin.`);
				menu("Confirm", `Are you sure you want to ban ${option.name}?`, ["Yes", "Cancel"], sender, ({option:confirm}) => {
					if(confirm != "Yes") fail("Cancelled.");
					admins.banPlayerIP(option.ip()); //this also bans the UUID
					api.ban({ip: option.ip(), uuid: option.uuid()});
					Log.info(`${option.ip()}/${option.uuid()} was banned.`);
					logAction("banned", sender, option.getInfo());
					outputSuccess(f`Banned player ${option}.`);
					updateBans(player => `[scarlet]Player [yellow]${player.name}[scarlet] has been whacked by ${sender.player.name}.`);
				}, false);
			}, true, opt => opt.name);
		}
	},

	ipban: {
		args: [],
		description: "This command was moved to /ban.",
		perm: Perm.admin,
		handler({}){
			fail(`This command was moved to [scarlet]/ban[]`);
		}
	},

	kill: {
		args: ["player:player"],
		description: "Kills a player's unit.",
		perm: Perm.mod,
		handler({args, sender, outputFail, outputSuccess, f}){
			if(!sender.canModerate(args.player, false))
				fail(`You do not have permission to kill the unit of this player.`);

			const unit = args.player.unit();
			if(unit){
				unit.kill();
				outputSuccess(f`Killed the unit of player ${args.player}.`);
			} else {
				outputFail(f`Player ${args.player} does not have a unit.`)
			}
		}
	},

	respawn: {
		args: ["player:player"],
		description: "Forces a player to respawn.",
		perm: Perm.mod,
		handler({args, sender, outputSuccess, f}){
			if(!sender.canModerate(args.player, false))
				fail(`You do not have permission to respawn this player.`);
			
			args.player.forceRespawn();
			outputSuccess(f`Respawned player ${args.player}.`);
		}
	},

	m: {
		args: ["message:string"],
		description: `Sends a message to muted players only.`,
		perm: Perm.mod,
		handler({sender, args}){
			FishPlayer.messageMuted(sender.player.name, args.message);
		}
	},

	info: {
		args: ["target:player"],
		description: "Displays information about an online player. See also /infos",
		perm: Perm.none,
		handler({sender, args, output, f}){
			const info = args.target.player.info as PlayerInfo;
			output(f`\
[accent]Info for player ${args.target} [gray](${escapeStringColorsClient(args.target.name)}) (#${args.target.player.id.toString()})
	[accent]Rank: ${args.target.rank}
	[accent]Role flags: ${Array.from(args.target.flags).map(f => f.coloredName()).join(" ")}
	[accent]Stopped: ${colorBadBoolean(!args.target.hasPerm("play"))}
	[accent]marked: ${args.target.marked() ? `until ${formatTimeRelative(args.target.unmarkTime)}` : "[green]false"}
	[accent]muted: ${colorBadBoolean(args.target.muted)}
	[accent]autoflagged: ${colorBadBoolean(args.target.autoflagged)}
	[accent]times joined / kicked: ${info.timesJoined}/${info.timesKicked}
	[accent]Names used: [[${info.names.map(escapeStringColorsClient).items.join(", ")}]`
			);
			if(sender.hasPerm("viewUUIDs"))
				output(f`\
	[#FFAAAA]UUID: ${args.target.uuid}
	[#FFAAAA]IP: ${args.target.player.ip()}`
				);
		}
	},

	spawn: {
		args: ["type:unittype", "x:number?", "y:number?", "team:team?"],
		description: "Spawns a unit of specified type at your position. [scarlet]Usage will be logged.[]",
		perm: Perm.admin,
		handler({sender, args, outputSuccess, f}){
			const x = args.x ? (args.x * 8) : sender.player.x;
			const y = args.y ? (args.y * 8) : sender.player.y;
			const team = args.team ?? sender.team();
			const unit = args.type.spawn(team, x, y);
			spawnedUnits.push(unit);
			logAction(`spawned unit ${args.type.name} at ${Math.round(x / 8)}, ${Math.round(y / 8)}`, sender);
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
			outputSuccess(f`Set block at ${args.x}, ${args.y} to ${args.block}`);
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
			logAction(`exterminated ${numKilled} units`, sender);
			outputSuccess(f`Exterminated ${numKilled} units.`);
		}
	},
	js: {
		args: ["javascript:string"],
		description: "Run arbitrary javascript.",
		perm: Perm.runJS,
		handler({args: {javascript}, output, outputFail, sender}){
			
			//Additional validation couldn't hurt...
			const playerInfo_AdminUsid = sender.info().adminUsid;
			if(!playerInfo_AdminUsid || playerInfo_AdminUsid != sender.player.usid() || sender.usid != sender.player.usid()){
				api.sendModerationMessage(
`# !!!!! /js authentication failed !!!!!
Server: ${getGamemode()} Player: ${escapeTextDiscord(sender.cleanedName)}/\`${sender.uuid}\`
<@!709904412033810533>`
				);
				fail(`Authentication failure`);
			}

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
		handler({args: {javascript}, output, outputFail, sender}){
			
			//Additional validation couldn't hurt...
			const playerInfo_AdminUsid = sender.info().adminUsid;
			if(!playerInfo_AdminUsid || playerInfo_AdminUsid != sender.player.usid() || sender.usid != sender.player.usid()){
				api.sendModerationMessage(
`# !!!!! /js authentication failed !!!!!
Server: ${getGamemode()} Player: ${escapeTextDiscord(sender.cleanedName)}/\`${sender.uuid}\`
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
			outputSuccess(`Set chat strictness for player ${player} to "${value}".`);
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
				const emanate = UnitTypes.emanate.spawn(sender.team(), sender.player.x, sender.player.y);
				sender.player.unit(emanate);
				unitMapping[sender.uuid] = emanate;
				logAction("spawned an emanate", sender);
				outputSuccess("Spawned an emanate.");
			}
		};
	}),
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

});
