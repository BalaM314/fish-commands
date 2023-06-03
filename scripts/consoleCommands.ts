import { FishPlayer } from "./players";
import { Rank, RoleFlag } from "./ranks";
import { FishConsoleCommandsList, FlaggedIPData, mindustryPlayerData } from "./types";
import { logAction, setToArray, StringBuilder } from "./utils";
import { fail } from "./commands";
import { addStopped } from "./api";
import * as fjsContext from "./fjsContext";
import { tileHistory } from "./globals";
import * as config from "./config";


export const commands:FishConsoleCommandsList = {
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
			const flags = RoleFlag.getByInput(args.rank);
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
			if(infoList.length == 0) fail(`Nobody with that name could be found.`);
			let outputString:string[] = [""];
			for(const playerInfo of infoList){
				const fishP = FishPlayer.getById(playerInfo.id);
				outputString.push(
`Trace info for player &y${playerInfo.id}&fr / &c"${Strings.stripColors(playerInfo.lastName)}" &lk(${playerInfo.lastName})&fr
	all names used: ${playerInfo.names.map((n:string) => `&c"${n}"&fr`).items.join(', ')}
	all IPs used: ${playerInfo.ips.map((n:string) => (n == playerInfo.lastIP ? '&c' : '&w') + n + '&fr').items.join(", ")}
	joined &c${playerInfo.timesJoined}&fr times, kicked &c${playerInfo.timesKicked}&fr times
	USID: &c${fishP?.usid ? `"${fishP.usid}"` : "unknown"}&fr`
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
			if(Pattern.matches("^\\d{1,3}\\.\\d{1,3}\\.\\d{1,3}\\.\\d{1,3}$", args.target)){
				//target is an ip
				if(Vars.netServer.admins.isIPBanned(args.target)){
					outputFail(`IP &c"${args.target}"&fr is already banned.`);
				} else {
					Vars.netServer.admins.banPlayerIP(args.target);
					output(`&lrIP &c"${args.target}" &lrwas banned.`);
				}
			} else if(Pattern.matches("[a-zA-Z0-9+/]{22}==", args.target)){
				if(Vars.netServer.admins.isIDBanned(args.target)){
					outputFail(`UUID &c"${args.target}"&fr is already banned.`);
				} else {
					const ip:string | null = Groups.player.find((p:mindustryPlayer) => args.target === p.uuid())?.ip();
					Vars.netServer.admins.banPlayerID(args.target);
					if(ip){
						Vars.netServer.admins.banPlayerIP(ip);
						output(`&lrUUID &c"${args.target}" &lrwas banned. IP &c"${ip}"&lr was banned.`);
					} else {
						output(`&lrUUID &c"${args.target}" &lrwas banned. Unable to determine ip!.`);
					}
				}
			} else {
				const player = FishPlayer.getOneMindustryPlayerByName(args.target);
				if(player === "none"){
					outputFail(`Could not find a player name matching &c"${args.target}"`);
				} else if(player === "multiple"){
					outputFail(`Name &c"${args.target}"&fr could refer to more than one player.`);
				} else {
					const ip = player.ip();
					const uuid = player.uuid();
					Vars.netServer.admins.banPlayerID(uuid);
					Vars.netServer.admins.banPlayerIP(ip);
					output(`&lrIP &c"${ip}"&lr was banned. UUID &c"${uuid}"&lr was banned.`);
				}
			}

			Groups.player.each((player:mindustryPlayer) => {
				if(Vars.netServer.admins.isIDBanned(player.uuid())){
					addStopped(player.uuid(), 999999999999);
					player.con.kick(Packets.KickReason.banned);
					Call.sendMessage(`[scarlet] Player [yellow]${player.name} [scarlet] has been whacked.`);
				}
			});
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
	clearstoredusids: {
		args: ["areyousure:boolean?", "areyoureallysure:boolean?", "areyoureallyreallysure:boolean?"],
		description: "Removes every stored USID.",
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
	update: {
		args: ["branch:string?"],
		description: "Updates the plugin.",
		handler({args, output, outputSuccess, outputFail}){
			const commandsDir = Vars.modDirectory.child("fish-commands");
			if(!commandsDir.exists()){
				fail(`Fish commands directory at path ${commandsDir.absolutePath()} does not exist!`);
			}
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
		args: ["areyousure:boolean?"],
		description: "Restarts the server.",
		handler({args, output}){
			if(!args.areyousure) fail(`Are you sure?!!?!!11!!1`);
			output(`Restarting...`);

			Core.settings.manualSave();
			FishPlayer.saveAll();
			const file = Vars.saveDirectory.child('1' + '.' + Vars.saveExtension);
			Vars.netServer.kickAll(Packets.KickReason.serverRestarting);
			Core.app.post(() => {
				SaveIO.save(file);
				Core.app.exit();
			});
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
	}
};
