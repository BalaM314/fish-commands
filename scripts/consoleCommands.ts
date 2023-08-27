import * as api from "./api";
import { consoleCommandList, fail } from "./commands";
import * as config from "./config";
import { maxTime } from "./config";
import * as fjsContext from "./fjsContext";
import { fishState, ipPattern, tileHistory, uuidPattern } from "./globals";
import { FishPlayer } from "./players";
import { Rank, RoleFlag } from "./ranks";
import { formatTime, formatTimeRelative, logAction, serverRestartLoop, setToArray } from "./utils";


export const commands = consoleCommandList({
	setrank: {
		args: ["player:player", "rank:string"],
		description: "Set a player's rank.",
		handler({args, outputSuccess}){
			const ranks = Rank.getByInput(args.rank);
			if(ranks.length == 0) fail(`Unknown rank ${args.rank}`);
			if(ranks.length > 1) fail(`Ambiguous rank ${args.rank}`);
			const rank = ranks[0];

			args.player.setRank(rank);
			logAction(`set rank to ${rank.name} for`, "console", args.player);
			outputSuccess(`Set rank of player "${args.player.name}" to ${rank.color}${rank.name}[]`);
		}
	},
	setflag: {
		args: ["player:player", "role:string", "value:boolean"],
		description: "Set a player's role flags.",
		handler({args, outputSuccess}){
			const flags = RoleFlag.getByInput(args.role);
			if(flags.length == 0) fail(`Unknown role flag ${args.role}`);
			if(flags.length > 1) fail(`Ambiguous role flag ${args.role}`);
			const flag = flags[0];

			args.player.setFlag(flag, args.value);
			logAction(`set roleflag ${flag.name} to ${args.value} for`, "console", args.player);
			outputSuccess(`Set role flag ${flag.color}${flag.name}[] of player "${args.player.name}" to ${args.value}`);
		}
	},
	savePlayers: {
		args: [],
		description: "Runs FishPlayer.save()",
		handler(){
			FishPlayer.saveAll();
		}
	},
	info: {
		args: ["player:string"],
		description: "Find player info(s). Displays all names and ips of a player.",
		handler({args, output}){
			const infoList = setToArray(Vars.netServer.admins.findByName(args.player) as ObjectSet<mindustryPlayerData>);
			if(infoList.length == 0) fail(`No players found.`);
			let outputString:string[] = [""];
			for(const playerInfo of infoList){
				const fishP = FishPlayer.getById(playerInfo.id);
				outputString.push(
`Trace info for player &y${playerInfo.id}&fr / &c"${Strings.stripColors(playerInfo.lastName)}" &lk(${playerInfo.lastName})&fr
	all names used: ${playerInfo.names.map((n:string) => `&c"${n}"&fr`).items.join(', ')}
	all IPs used: ${playerInfo.ips.map((n:string) => (n == playerInfo.lastIP ? '&c' : '&w') + n + '&fr').items.join(", ")}
	joined &c${playerInfo.timesJoined}&fr times, kicked &c${playerInfo.timesKicked}&fr times`
+ (fishP ? `
	USID: &c${fishP.usid}&fr
	Rank: &c${fishP.rank.name}&fr
	Marked: ${fishP.marked() ? `&runtil ${formatTimeRelative(fishP.unmarkTime)}` : fishP.autoflagged ? "&rautoflagged" : "&gfalse"}&fr
	Muted: &c${fishP.muted}&fr`
: "")
				);
			}
			output(outputString.join("\n"));
		}
	},
	infoonline: {
		args: ["player:string"],
		description: "Display information about an online player.",
		handler({args, output}){
			const infoList = args.player == "*" ? FishPlayer.getAllOnline() : FishPlayer.getAllByName(args.player, false);
			if(infoList.length == 0) fail(`Nobody with that name could be found.`);
			let outputString:string[] = [""];
			for(const player of infoList){
				const playerInfo = Vars.netServer.admins.getInfo(player.uuid);
				outputString.push(
`Info for player &c"${player.cleanedName}" &lk(${player.name})&fr
	UUID: &c"${playerInfo.id}"&fr
	USID: &c${player.usid ? `"${player.usid}"` : "unknown"}&fr
	all names used: ${playerInfo.names.map((n:string) => `&c"${n}"&fr`).items.join(', ')}
	all IPs used: ${playerInfo.ips.map((n:string) => (n == playerInfo.lastIP ? '&c' : '&w') + n + '&fr').items.join(", ")}
	joined &c${playerInfo.timesJoined}&fr times, kicked &c${playerInfo.timesKicked}&fr times
	rank: &c${player.rank.name}&fr${(player.marked() ? ", &lris marked&fr" : "") + (player.muted ? ", &lris muted&fr" : "") + (player.hasFlag("member") ? ", &lmis member&fr" : "") + (player.autoflagged ? ", &lris autoflagged&fr" : "")}`
				);
			}
			output(outputString.join("\n"));
		}
	},
	unblacklist: {
		args: ["ip:string"],
		description: "Unblacklists an ip from the DOS blacklist.",
		handler({args, output}){
			const blacklist = Vars.netServer.admins.dosBlacklist as ObjectSet<string>;
			if(blacklist.remove(args.ip)) output(`Removed ${args.ip} from the DOS blacklist.`);
			else fail(`IP address ${args.ip} is not DOS blacklisted.`);
		}
	},
	blacklist: {
		args: [],
		description: "Allows you to view the DOS blacklist.",
		handler({output}){
			const blacklist = Vars.netServer.admins.dosBlacklist;
			if(blacklist.isEmpty()){
				output("The blacklist is empty");
				return;
			}

			let outputString = ["DOS Blacklist:"];
			blacklist.each((ip:string) => {
				(Vars.netServer.admins.findByName(ip) as ObjectSet<mindustryPlayerData>).each(data =>
					outputString.push(`IP: &c${ip}&fr UUID: &c"${data.id}"&fr Last name used: &c"${data.plainLastName()}"&fr`)
				)
			});

			output(outputString.join("\n"));
		}
	},
	whack: {
		args: ["target:string"],
		description: "Whacks (ipbans) a player.",
		handler({args, output, outputFail}){
			if(ipPattern.test(args.target)){
				//target is an ip
				api.ban({ip: args.target});
				const info:mindustryPlayerData = Vars.netServer.admins.findByIP(args.target);
				if(info)
					logAction("whacked", "console", info);
				else
					logAction(`console ip-whacked ${args.target}`);
				if(Vars.netServer.admins.isIPBanned(args.target)){
					output(`IP &c"${args.target}"&fr is already banned. Ban was synced to other servers.`);
				} else {
					Vars.netServer.admins.banPlayerIP(args.target);
					output(`&lrIP &c"${args.target}"&lr was banned. Ban was synced to other servers.`);
				}
			} else if(uuidPattern.test(args.target)){
				const info:mindustryPlayerData = Vars.netServer.admins.getInfoOptional(args.target);
				if(info) logAction("whacked", "console", info);
				else logAction(`console ip-whacked ${args.target}`);
				api.addStopped(args.target, config.maxTime);
				if(Vars.netServer.admins.isIDBanned(args.target)){
					api.ban({uuid: args.target});
					output(`UUID &c"${args.target}"&fr is already banned. Ban was synced to other servers.`);
				} else {
					Vars.netServer.admins.banPlayerID(args.target);
					if(info){
						Vars.netServer.admins.banPlayerIP(info.lastIP);
						api.ban({uuid: args.target, ip: info.lastIP});
						output(`&lrUUID &c"${args.target}" &lrwas banned. IP &c"${info.lastIP}"&lr was banned. Ban was synced to other servers.`);
					} else {
						api.ban({uuid: args.target});
						output(`&lrUUID &c"${args.target}" &lrwas banned. Ban was synced to other servers. Warning: no stored info for this UUID, player may not exist. Unable to determine IP.`);
					}
				}
			} else {
				const player = FishPlayer.getOneMindustryPlayerByName(args.target);
				if(player === "none"){
					outputFail(`Could not find a player name matching &c"${args.target}"`);
				} else if(player === "multiple"){
					outputFail(`Name &c"${args.target}"&fr could refer to more than one player.`);
				} else {
					if(player.admin) fail(`Player &c"${player.name}"&fr is an admin, you probably don't want to ban them.`);
					const ip = player.ip();
					const uuid = player.uuid();
					Vars.netServer.admins.banPlayerID(uuid);
					Vars.netServer.admins.banPlayerIP(ip);
					logAction(`console whacked ${Strings.stripColors(player.name)} (\`${uuid}\`/\`${ip}\`)`);
					api.ban({uuid, ip});
					api.addStopped(player.uuid(), config.maxTime);
					output(`&lrIP &c"${ip}"&lr was banned. UUID &c"${uuid}"&lr was banned. Ban was synced to other servers.`);
				}
			}

			Groups.player.each(player => {
				if(Vars.netServer.admins.isIDBanned(player.uuid())){
					api.addStopped(player.uuid(), config.maxTime);
					player.con.kick(Packets.KickReason.banned);
					Call.sendMessage(`[scarlet] Player [yellow]${player.name} [scarlet] has been whacked.`);
				}
			});
		}

	},
	unwhack: {
		args: ["target:string"],
		description: "Unbans a player.",
		handler({args, output}){
			if(ipPattern.test(args.target)){
				//target is an ip
				output("Checking ban status...");
				const info:mindustryPlayerData = Vars.netServer.admins.findByIP(args.target);
				api.getBanned({ip: args.target}, (banned) => {
					if(banned){
						api.unban({ip: args.target});
						logAction(`console unbanned ip \`${args.target}\``);
						output(`IP &c"${args.target}"&fr has been globally unbanned.`);
					} else {
						output(`IP &c"${args.target}"&fr is not globally banned.`);
					}
					if(Vars.netServer.admins.isIPBanned(args.target)){
						Vars.netServer.admins.unbanPlayerIP(args.target);
						output(`IP &c"${args.target}"&fr has been locally unbanned.`);
					} else {
						output(`IP &c"${args.target}"&fr was not locally banned.`);
					}
				});
			} else if(uuidPattern.test(args.target)){
				output("Checking ban status...");
				const info:mindustryPlayerData = Vars.netServer.admins.findByIP(args.target);
				api.getBanned({uuid: args.target}, (banned) => {
					if(banned){
						api.unban({uuid: args.target});
						logAction(`console unbanned uuid \`${args.target}\``);
						output(`UUID &c"${args.target}"&fr has been globally unbanned.`);
					} else {
						output(`UUID &c"${args.target}"&fr is not globally banned.`);
					}
					if(Vars.netServer.admins.isIDBanned(args.target)){
						Vars.netServer.admins.unbanPlayerID(args.target);
						output(`UUID &c"${args.target}"&fr has been locally unbanned.`);
					} else {
						output(`UUID &c"${args.target}"&fr was not locally banned.`);
					}
				});
			} else {
				fail(`Cannot unban by name; please use the info command to find the IP and UUID of the player you are looking for.`);
			}
		}

	},
	loadfishplayerdata: {
		args: ["areyousure:boolean", "fishplayerdata:string"],
		description: "Overwrites current fish player data.",
		handler({args, output}){
			if(args.areyousure){
				let before = Object.keys(FishPlayer.cachedPlayers).length;
				FishPlayer.loadAll(args.fishplayerdata);
				output(`Loaded fish player data. before:${before}, after:${Object.keys(FishPlayer.cachedPlayers).length}`);
			}
		}
	},
	clearallstoredusids: {
		args: ["areyousure:boolean?", "areyoureallysure:boolean?", "areyoureallyreallysure:boolean?"],
		description: "Removes every stored USID. NOT RECOMMENDED.",
		handler({args, output}){
			if(args.areyousure && args.areyoureallysure && args.areyoureallyreallysure){
				let total = 0;
				for(const [uuid, fishP] of Object.entries(FishPlayer.cachedPlayers)){
					total ++;
					fishP.usid = null;
				}
				FishPlayer.saveAll();
				output(`Removed ${total} stored USIDs.`);
			} else {
				output(`Are you sure?!?!?!?!?!!`);
			}
		}
	},
	resetauth: {
		args: ["player:string"],
		description: `Removes the USID of the player provided, use this if they are getting kicked with the message "Authorization failure!". Specify "last" to use the last player that got kicked.`,
		handler({args, outputSuccess}){
			const player =
				args.player == "last" ? (FishPlayer.lastAuthKicked ?? fail(`Nobody has been kicked for authorization failure since the last restart.`)) :
				FishPlayer.getById(args.player) ?? fail(
					Vars.netServer.admins.getInfoOptional(args.player)
					? `Player ${args.player} has joined the server, but their info was not cached, most likely because they have no rank, so there is no stored USID.`
					: `Unknown player ${args.player}`
				);
			const oldusid = player.usid;
			player.usid = null;
			outputSuccess(`Removed the usid of player ${player.name}/${player.uuid} (was ${oldusid})`);
		}
	},
	update: {
		args: ["branch:string?"],
		description: "Updates the plugin.",
		handler({args, output, outputSuccess, outputFail}){
			const commandsDir = Vars.modDirectory.child("fish-commands");
			if(!commandsDir.exists())
				fail(`Fish commands directory at path ${commandsDir.absolutePath()} does not exist!`);
			if(config.localDebug) fail(`Cannot update in local debug mode.`);
			output("Updating...");
			const gitProcess = new ProcessBuilder("git", "pull", "origin", args.branch ?? "master")
				.directory(commandsDir.file())
				.redirectErrorStream(true)
				.redirectOutput(ProcessBuilder.Redirect.INHERIT)
				.start();
			Timer.schedule(() => {
				gitProcess.waitFor();
				if(gitProcess.exitValue() == 0){
					outputSuccess(`Updated successfully. Restart to apply changes.`);
				} else {
					outputFail(`Update failed!`);
				}
			}, 0);
		}
	},
	restart: {
		args: ["time:number?"],
		description: "Restarts the server.",
		handler({args}){
			if(Vars.state.rules.mode().name() == "pvp"){
				if(args.time === -1){
					Log.info(`&rRestarting in 15 seconds (this will interrupt the current PVP match).&fr`);
					Call.sendMessage(`[accent]---[[[coral]+++[]]---\n[accent]Server restart imminent. [green]We'll be back after 15 seconds.[]\n[accent]---[[[coral]+++[]]---`);
					serverRestartLoop(15);
				} else {
					Call.sendMessage(`[accent]---[[[coral]+++[]]---\n[accent]Server restart queued. The server will restart after the current match is over.[]\n[accent]---[[[coral]+++[]]---`);
					Log.info(`PVP detected, restart will occur at the end of the current match. Run "restart -1" to override, but &rthat would interrupt the current pvp match, and players would lose their teams.&fr`);
					fishState.restarting = true;
				}
			} else {
				Call.sendMessage(`[accent]---[[[coral]+++[]]---\n[accent]Server restart imminent. [green]We'll be back after 15 seconds, and all progress will be saved.[]\n[accent]---[[[coral]+++[]]---`);
				const time = args.time ?? 10;
				if(time < 0 || time > 100) fail(`Invalid time: out of valid range.`);
				Log.info(`Restarting in ${time} seconds...`);
				serverRestartLoop(time);
			}
		}
	},
	rename: {
		args: ["player:player", "newname:string"],
		description: "Changes the name of a player.",
		handler({args, outputFail, outputSuccess}){
			if(args.player.hasPerm("blockTrolling")){
				outputFail(`Operation aborted: Player ${args.player.name} is insufficiently trollable.`);
			} else {
				const oldName = args.player.name;
				args.player.player.name = args.newname;
				outputSuccess(`Renamed ${oldName} to ${args.newname}.`);
			}
		}
	},
	fjs: {
		args: ["js:string"],
		description: "Executes arbitrary javascript code, but has access to fish-commands's variables.",
		handler({args}){
			fjsContext.runJS(args.js);
		}
	},
	checkmem: {
		args: [],
		description: "Checks memory usage of various objects.",
		handler({output}){
			output(
`Memory usage:
Total: ${Math.round(Core.app.getJavaHeap() / (2 ** 10))} KB
Number of cached fish players: ${Object.keys(FishPlayer.cachedPlayers).length}
Length of tilelog entries: ${Math.round(Object.values(tileHistory).reduce((acc, a) => acc + a.length, 0) / (2 ** 10))} KB`
			);
		}
	},
	stopplayer: {
		args: ['player:player', "time:time?", "message:string?"],
		description: 'Stops a player.',
		handler({args, outputSuccess}){
			if(args.player.marked()){
				//overload: overwrite stoptime
				if(!args.time) fail(`Player "${args.player.name}" is already marked.`);
				const previousTime = formatTimeRelative(args.player.unmarkTime, true);
				args.player.updateStopTime(args.time);
				outputSuccess(`Player "${args.player.cleanedName}"'s stop time has been updated to ${formatTime(args.time)} (was ${previousTime}).`);

				return;
			}

			const time = args.time ?? 604800000;
			if(time + Date.now() > maxTime) fail(`Error: time too high.`);
			args.player.stop("console", time, args.message ?? undefined);
			logAction('stopped', "console", args.player, args.message ?? undefined, time);
			Call.sendMessage(`[scarlet]Player "${args.player.name}[scarlet]" has been marked for ${formatTime(time)}${args.message ? ` with reason: [white]${args.message}[]` : ""}.`);
		}
	},
	stopoffline: {
		args: ["uuid:uuid", "time:time?"],
		description: "Stops a player by uuid.",
		handler({args:{uuid, time}, outputSuccess}){
			const stopTime = time ?? (maxTime - Date.now() - 10000);
			const info = Vars.netServer.admins.getInfoOptional(uuid) as mindustryPlayerData;
			if(info == null) fail(`Unknown player ${uuid}`);
			const fishP = FishPlayer.getFromInfo(info);
			fishP.stop("console", stopTime);
			logAction('stopped', "console", info, undefined, stopTime);
			outputSuccess(`Player "${info.lastName}" was marked for ${formatTime(stopTime)}.`);
		}
	}
});
