import * as api from "./api";
import { consoleCommandList, fail } from "./commands";
import * as config from "./config";
import { Mode, maxTime } from "./config";
import * as fjsContext from "./fjsContext";
import { fishState, ipPattern, tileHistory, uuidPattern } from "./globals";
import { FishPlayer } from "./players";
import { Rank } from "./ranks";
import { colorNumber, formatTime, formatTimeRelative, formatTimestamp, getAntiBotInfo, logAction, serverRestartLoop, setToArray, updateBans } from "./utils";


export const commands = consoleCommandList({
	setrank: {
		args: ["player:player", "rank:rank"],
		description: "Set a player's rank.",
		handler({args, outputSuccess, f}){
			if(args.rank == Rank.pi && !config.localDebug) fail(f`Rank ${args.rank} is immutable.`);
			if(args.player.immutable() && !config.localDebug) fail(f`Player ${args.player} is immutable.`);

			args.player.setRank(args.rank);
			logAction(`set rank to ${args.rank.name} for`, "console", args.player);
			outputSuccess(f`Set rank of player ${args.player} to ${args.rank}`);
		}
	},
	admin: {
		args: ["nothing:string?"],
		description: "Use the setrank command instead.",
		handler(){
			fail(`Use the "setrank" command instead. Hint: "setrank player admin"`);
		}
	},
	setflag: {
		args: ["player:player", "flag:roleflag", "value:boolean"],
		description: "Set a player's role flags.",
		handler({args, outputSuccess, f}){

			args.player.setFlag(args.flag, args.value);
			logAction(`set roleflag ${args.flag.name} to ${args.value} for`, "console", args.player);
			outputSuccess(f`Set role flag ${args.flag} of player ${args.player} to ${args.value}`);
		}
	},
	savePlayers: {
		args: [],
		description: "Runs FishPlayer.save()",
		handler({outputSuccess}){
			FishPlayer.saveAll();
			outputSuccess(`Successfully wrote fish player data.`);
		}
	},
	info: {
		args: ["player:string"],
		description: "Find player info(s). Displays all names and ips of a player.",
		handler({args, output, admins}){
			const infoList = setToArray(admins.findByName(args.player) as ObjectSet<PlayerInfo>);
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
		handler({args, output, admins}){
			const infoList = args.player == "*" ? FishPlayer.getAllOnline() : FishPlayer.getAllByName(args.player, false);
			if(infoList.length == 0) fail(`Nobody with that name could be found.`);
			let outputString:string[] = [""];
			for(const player of infoList){
				const playerInfo = admins.getInfo(player.uuid);
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
		handler({args, output, admins}){
			const blacklist = admins.dosBlacklist as ObjectSet<string>;
			if(blacklist.remove(args.ip)) output(`Removed ${args.ip} from the DOS blacklist.`);
			else fail(`IP address ${args.ip} is not DOS blacklisted.`);
		}
	},
	blacklist: {
		args: ["rich:boolean?"],
		description: "Allows you to view the DOS blacklist.",
		handler({args, output, admins}){
			const blacklist = admins.dosBlacklist;
			if(blacklist.isEmpty()) fail("The blacklist is empty");
			
			if(args.rich){
				let outputString = ["DOS Blacklist:"];
				blacklist.each((ip:string) => {
					const info = admins.findByIP(ip);
					if(info){
						outputString.push(`IP: &c${ip}&fr UUID: &c"${info.id}"&fr Last name used: &c"${info.plainLastName()}"&fr`);
					}
				});
	
				output(outputString.join("\n"));
				output(`${blacklist.size} blacklisted IPs`);
			} else {
				output(blacklist.toString());
				output(`${blacklist.size} blacklisted IPs`);
			}

		}
	},
	whack: {
		args: ["target:string"],
		description: "Whacks (ipbans) a player.",
		handler({args, output, outputFail, admins}){
			if(ipPattern.test(args.target)){
				//target is an ip
				api.ban({ip: args.target});
				const info = admins.findByIP(args.target);
				if(info) logAction("whacked", "console", info);
				else logAction(`console ip-whacked ${args.target}`);

				if(admins.isIPBanned(args.target)){
					output(`IP &c"${args.target}"&fr is already banned. Ban was synced to other servers.`);
				} else {
					admins.banPlayerIP(args.target);
					output(`&lrIP &c"${args.target}"&lr was banned. Ban was synced to other servers.`);
				}
			} else if(uuidPattern.test(args.target)){
				const info = admins.getInfoOptional(args.target);
				if(info) logAction("whacked", "console", info);
				else logAction(`console ip-whacked ${args.target}`);

				api.addStopped(args.target, config.maxTime);
				if(admins.isIDBanned(args.target)){
					api.ban({uuid: args.target});
					output(`UUID &c"${args.target}"&fr is already banned. Ban was synced to other servers.`);
				} else {
					admins.banPlayerID(args.target);
					if(info){
						admins.banPlayerIP(info.lastIP);
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
					admins.banPlayerID(uuid);
					admins.banPlayerIP(ip);
					logAction(`console whacked ${Strings.stripColors(player.name)} (\`${uuid}\`/\`${ip}\`)`);
					api.ban({uuid, ip});
					api.addStopped(player.uuid(), config.maxTime);
					output(`&lrIP &c"${ip}"&lr was banned. UUID &c"${uuid}"&lr was banned. Ban was synced to other servers.`);
				}
			}

			updateBans(player => `[scarlet]Player [yellow]${player.name}[scarlet] has been whacked.`);
		}

	},
	unwhack: {
		args: ["target:string"],
		description: "Unbans a player.",
		handler({args, output, admins}){
			if(ipPattern.test(args.target)){
				//target is an ip
				if(FishPlayer.removePunishedIP(args.target)){
					output(`Removed IP &c"${args.target}"&fr from the anti-evasion list.`);
				}
				output("Checking ban status...");
				api.getBanned({ip: args.target}, (banned) => {
					if(banned){
						api.unban({ip: args.target});
						logAction(`console unbanned ip \`${args.target}\``);
						output(`IP &c"${args.target}"&fr has been globally unbanned.`);
					} else {
						output(`IP &c"${args.target}"&fr is not globally banned.`);
					}
					if(admins.isIPBanned(args.target)){
						admins.unbanPlayerIP(args.target);
						output(`IP &c"${args.target}"&fr has been locally unbanned.`);
					} else {
						output(`IP &c"${args.target}"&fr was not locally banned.`);
					}
				});
			} else if(uuidPattern.test(args.target)){
				if(FishPlayer.removePunishedUUID(args.target)){
					output(`Removed UUID &c"${args.target}"&fr from the anti-evasion list.`);
				}
				output("Checking ban status...");
				const info = admins.findByIP(args.target);
				api.getBanned({uuid: args.target}, (banned) => {
					if(banned){
						api.unban({uuid: args.target});
						logAction(`console unbanned uuid \`${args.target}\``);
						output(`UUID &c"${args.target}"&fr has been globally unbanned.`);
					} else {
						output(`UUID &c"${args.target}"&fr is not globally banned.`);
					}
					if(admins.isIDBanned(args.target)){
						admins.unbanPlayerID(args.target);
						output(`UUID &c"${args.target}"&fr has been locally unbanned.`);
					} else {
						output(`UUID &c"${args.target}"&fr was not locally banned.`);
					}
					if(info){
						output(`You may also want to consider unbanning the IP "${info.lastIP}".`);
					}
				});
			} else {
				fail(`Cannot unban by name; please use the info command to find the IP and UUID of the player you are looking for.`);
			}
		}

	},
	ban: {
		args: ["any:string"],
		description: "Please use the whack command instead.",
		handler(){
			fail(`Use the whack command instead.`);
		}
	},
	unban: {
		args: ["any:string"],
		description: "Please use the unwhack command instead.",
		handler(){
			fail(`Use the unwhack command instead.`);
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
		handler({args, outputSuccess, admins}){
			const player =
				args.player == "last" ? (FishPlayer.lastAuthKicked ?? fail(`Nobody has been kicked for authorization failure since the last restart.`)) :
				FishPlayer.getById(args.player) ?? fail(
					admins.getInfoOptional(args.player)
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
			if(Mode.pvp()){
				if(Groups.player.isEmpty()){
					Log.info(`Restarting immediately as no players are online.`);
					serverRestartLoop(0);
				} else if(args.time === -1){
					Log.info(`&rRestarting in 15 seconds (this will interrupt the current PVP match).&fr`);
					Call.sendMessage(`[accent]---[[[coral]+++[]]---\n[accent]Server restart imminent. [green]We'll be back after 15 seconds.[]\n[accent]---[[[coral]+++[]]---`);
					serverRestartLoop(15);
				} else {
					Call.sendMessage(`[accent]---[[[coral]+++[]]---\n[accent]Server restart queued. The server will restart after the current match is over.[]\n[accent]---[[[coral]+++[]]---`);
					Log.info(`PVP detected, restart will occur at the end of the current match. Run "restart -1" to override, but &rthat would interrupt the current pvp match, and players would lose their teams.&fr`);
					fishState.restartQueued = true;
				}
			} else {
				Call.sendMessage(`[accent]---[[[coral]+++[]]---\n[accent]Server restart imminent. [green]We'll be back with 15 seconds of downtime, and all progress will be saved.[]\n[accent]---[[[coral]+++[]]---`);
				const time = args.time ?? 60;
				if(time < 0 || time > 100) fail(`Invalid time: out of valid range.`);
				Log.info(`Restarting in ${time} seconds...`);
				serverRestartLoop(time);
			}
		}
	},
	rename: {
		args: ["player:player", "newname:string"],
		description: "Changes the name of a player.",
		handler({args, f, outputSuccess}){
			if(args.player.hasPerm("blockTrolling")) fail(f`Operation aborted: Player ${args.player} is insufficiently trollable.`);
			const oldName = args.player.name;
			args.player.player!.name = args.player.prefixedName = args.newname;
			args.player.shouldUpdateName = false;
			outputSuccess(`Renamed ${oldName} to ${args.newname}.`);
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
Number of cached fish players: ${Object.keys(FishPlayer.cachedPlayers).length} (has data: ${Object.values(FishPlayer.cachedPlayers).filter(p => p.hasData()).length})
Fish player data string length: ${FishPlayer.getFishPlayersString.length} (${Core.settings.getInt("fish-subkeys")} subkeys)
Length of tilelog entries: ${Math.round(Object.values(tileHistory).reduce((acc, a) => acc + a.length, 0) / (2 ** 10))} KB`
			);
		}
	},
	stopplayer: {
		args: ['player:player', "time:time?", "message:string?"],
		description: 'Stops a player.',
		handler({args, f, outputSuccess}){
			if(args.player.marked()){
				//overload: overwrite stoptime
				if(!args.time) fail(f`Player ${args.player} is already marked.`);
				const previousTime = formatTime(args.player.unmarkTime - Date.now());
				args.player.updateStopTime(args.time);
				outputSuccess(f`Player ${args.player}'s stop time has been updated to ${formatTime(args.time)} (was ${previousTime}).`);

				return;
			}

			const time = args.time ?? 604800000;
			if(time + Date.now() > maxTime) fail(`Error: time too high.`);
			args.player.stop("console", time, args.message ?? undefined);
			logAction('stopped', "console", args.player, args.message ?? undefined, time);
			Call.sendMessage(`[scarlet]Player "${args.player.prefixedName}[scarlet]" has been marked for ${formatTime(time)}${args.message ? ` with reason: [white]${args.message}[]` : ""}.`);
		}
	},
	stopoffline: {
		args: ["uuid:uuid", "time:time?"],
		description: "Stops a player by uuid.",
		handler({args:{uuid, time}, outputSuccess, admins}){
			const stopTime = time ?? (maxTime - Date.now() - 10000);
			const info = admins.getInfoOptional(uuid) as PlayerInfo;
			if(info == null) fail(`Unknown player ${uuid}`);
			const fishP = FishPlayer.getFromInfo(info);
			fishP.stop("console", stopTime);
			logAction('stopped', "console", info, undefined, stopTime);
			outputSuccess(`Player "${info.lastName}" was marked for ${formatTime(stopTime)}.`);
		}
	},
	checkstats: {
		args: [],
		description: "Views statistics related to in-development features.",
		handler({output, admins}){
			const data = Seq.with(...Object.values(FishPlayer.stats.heuristics.blocksBroken));
			Sort.instance().sort(data);
			const zeroes = data.count(i => i == 0);
			output(
`Blocks broken heuristic:
Tripped: ${FishPlayer.stats.heuristics.numTripped}/${FishPlayer.stats.heuristics.total}
Marked within 20 minutes: ${FishPlayer.stats.heuristics.trippedCorrect}/${FishPlayer.stats.heuristics.numTripped}
${zeroes}/${data.size} (${Mathf.round(zeroes / data.size, 0.0001)}) of players broke 0 blocks
List of all players that tripped:
${Object.entries(FishPlayer.stats.heuristics.tripped).map(([uuid, tripped]) =>
	`${admins.getInfoOptional(uuid)?.plainLastName()} &k(${uuid})&fr: ${tripped}`
).join("\n")}
Raw data for blocks tripped: ${data.toString(" ", i => i.toString())}`
			);
		}
	},
	clearfire: {
		args: [],
		description: "Clears all the fires.",
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
	status: {
		args: [],
		description: "Displays server status.",
		handler({output}){
			if(Vars.state.isMenu()) fail(`Status: Server closed.`);
			const uptime = Packages.java.lang.management.ManagementFactory.getRuntimeMXBean().getUptime();
			let numStaff = 0;
			FishPlayer.forEachPlayer(p => {
				if(p.ranksAtLeast("mod")) numStaff ++;
			});
			output(`
Status:
Playing on map &fi${Vars.state.map.plainName()}&fr for ${formatTime(1000 * Vars.state.tick / 60)}
${Vars.state.rules.waves ? `Wave &c${Vars.state.wave}&fr, &c${Math.ceil(Vars.state.wavetime / 60)}&fr seconds until next wave.\n` : ""}\
&c${Groups.unit.size()}&fr units, &c${Vars.state.enemies}&fr enemies, &c${Groups.build.size()}&fr buildings
TPS: ${colorNumber(Core.graphics.getFramesPerSecond(), f => f > 58 ? "&g" : f > 30 ? "&y" : f > 10 ? "&r" : "&br&w", "server")}, \
Memory: &c${Math.round(Core.app.getJavaHeap() / 1048576)}&fr MB
Server uptime: ${formatTime(uptime)} (since ${formatTimestamp(Date.now() - uptime)})
${[
	fishState.restartQueued ? "&by&lwRestart queued&fr" : "",
	fishState.restartLoopTask ? "&by&lwRestarting now&fr" : "",
	FishPlayer.antiBotMode() ? "&br&wANTIBOT ACTIVE!&fr" + getAntiBotInfo("server") : "",
].filter(l => l.length > 0).join("\n")}\

${colorNumber(Groups.player.size(), n => n > 0 ? "&c" : "&lr", "server")} players online, ${colorNumber(numStaff, n => n > 0 ? "&c" : "&lr", "server")} staff members.
${FishPlayer.mapPlayers(p =>
	`\t${p.rank.shortPrefix} &c${p.uuid}&fr &c${p.name}&fr`
).join("\n") || "&lrNo players connected.&fr"}
`
			);
		}
	},
	tmux: {
		args: ["attach:string"],
		description: "Oopsie",
		handler(){
			fail(`You are already in the Mindustry server console. Please regain situational awareness before running any further commands.`);
		}
	},
	BEGIN: {
		args: ["transaction:string"],
		description: "Oopsie",
		handler({args}){
			if(args.transaction == "TRANSACTION") fail(`Not possible :( please download and run locally, and make a backup`)
			else fail(`Command not found. Did you mean "BEGIN TRANSACTION"?`);
		}
	},
	prune: {
		args: ["confirm:boolean?"],
		description: "Prunes fish player data",
		handler({args, admins, outputSuccess, outputFail}){
			const playersToPrune = Object.values(FishPlayer.cachedPlayers)
				.filter(player => {
					if(player.hasData()) return false;
					const data = admins.getInfoOptional(player.uuid);
					return (
						!data ||
						data.timesJoined == 1 ||
						(data.timesJoined < 10 &&
							(Date.now() - player.lastJoined) > (30 * 86400 * 1000)
						)
					);
				});
			if(args.confirm){
				outputSuccess("Creating backup...");
				const backupScript = Core.settings.getDataDirectory().child("backup.sh");
				if(!backupScript.exists()) fail(`./backup.sh does not exist! aborting`);
				const backupProcess = new ProcessBuilder(backupScript.absolutePath())
					.directory(Core.settings.getDataDirectory().file())
					.redirectErrorStream(true)
					.redirectOutput(ProcessBuilder.Redirect.INHERIT)
					.start();
				Threads.daemon(() => { //dont block main thread
					backupProcess.waitFor();
					if(backupProcess.exitValue() == 0){
						outputSuccess(`Successfully created a backup.`);
						Core.app.post(() => { //back to main thread, modifying fish player
							playersToPrune.forEach(u => {delete FishPlayer.cachedPlayers[u.uuid]});
							outputSuccess(`Pruned ${playersToPrune.length} players.`);
						});
					} else {
						outputFail(`Backup failed!`);
					}
				});
			} else {
				outputSuccess(`Pruning would remove fish data for ${playersToPrune.length} players with no data and (1 join or inactive with <10 joins). (Mindustry data will remain.)\nRun "prune y" to prune data.`);
			}
		}
	},
	backup: {
		args: [],
		description: "Creates a backup of the settings.bin file.",
		handler({output, outputFail, outputSuccess}){
			output("Creating backup...");
			const backupScript = Core.settings.getDataDirectory().child("backup.sh");
			if(!backupScript.exists()) fail(`./backup.sh does not exist! aborting`);
			const backupProcess = new ProcessBuilder(backupScript.absolutePath())
				.directory(Core.settings.getDataDirectory().file())
				.redirectErrorStream(true)
				.redirectOutput(ProcessBuilder.Redirect.INHERIT)
				.start();
			Threads.daemon(() => {
				backupProcess.waitFor();
				if(backupProcess.exitValue() == 0) outputSuccess(`Successfully created a backup.`);
				else outputFail(`Backup failed!`);
			});
		}
	},
	loadmap: {
		args: ["filename:string", "map:string"],
		description: "Downloads a map from URL.",
		handler({args:{filename, map}, output, outputFail, outputSuccess}){
			if(!/^https?:\/\//i.test(map)) fail(`Argument must be a URL starting with https:// or http://`);
			if(!/\.msav$/.test(filename)) fail(`Filename must end with .msav`);
			if(Strings.sanitizeFilename(filename) != filename) fail(`Filename contains special characters, please use "${Strings.sanitizeFilename(filename)}" instead`);
			filename = filename.toLowerCase();
			const file = Vars.customMapDirectory.child(filename);
			if(file.exists()) output(`File ${filename} will be overwritten`);
			output(`Downloading map...`);
			Http.get(map, res => {
				output(`Writing file...`);
				file.writeBytes(res.getResult());
				output(`Loading map...`);
				Vars.maps.reload();
				outputSuccess(`Successfully loaded the map. Please check for duplicates.`);
			}, () => outputFail(`Download failed`));
		},
	},
});
