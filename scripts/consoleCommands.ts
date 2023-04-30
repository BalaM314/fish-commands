import { FishPlayer } from "./players";
import { Rank } from "./ranks";
import { FishConsoleCommandsList, FlaggedIPData, mindustryPlayerData } from "./types";
import { setToArray, StringBuilder } from "./utils";
import { fail } from "./commands";
import { addStopped } from "./api";
import * as fjsContext from "./fjsContext";


export const commands:FishConsoleCommandsList = {
	setrank: {
		args: ["player:player", "rank:string"],
		description: "Set a player's rank.",
		handler({args, outputSuccess}){
			const rank = Rank.getByName(args.rank);
			if(rank == null) fail(`Unknown rank ${args.rank}`);

			args.player.setRank(rank);
			outputSuccess(`Set rank of player "${args.player.name}" to ${rank.name}`);
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
	rank: &c${player.rank.name}&fr${(player.stopped ? ", &lris stopped&fr" : "") + (player.muted ? ", &lris muted&fr" : "") + (player.member ? ", &lmis member&fr" : "")}`
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
					addStopped(player.uuid());
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
			if(args.player.ranksAtLeast(Rank.pi)){
				outputFail(`Operation aborted: Player ${args.player.name} is insufficiently trollable.`);
			} else {
				const oldName = args.player.name;
				args.player.player.name = args.newname;
				outputSuccess(`Renamed ${oldName} to ${args.newname}.`);
			}
		}
	},
	checkantivpn: {
		args: [],
		description: "Outputs VPN flag rate statistics.",
		handler({output}){
			output(
`&lgAntiVPN statistics&fr
Flag rate: &c${FishPlayer.stats.numIpsFlagged}&fr / &c${FishPlayer.stats.numIpsChecked}&fr
${FishPlayer.stats.numIpsErrored} errors
List of flagged unmoderated ips:
${Object.entries(FishPlayer.checkedIps).filter<[string, FlaggedIPData]>((e:[string, FlaggedIPData | false]):e is [string, FlaggedIPData] => e[1] !== false && !e[1].moderated).map(([ip, data]) =>
	`&c${ip}&fr: name &c"${data.name}"&fr, uuid &c"${data.uuid}"&fr`
).join("\n") || "none"}
List of flagged moderated ips:
${Object.entries(FishPlayer.checkedIps).filter<[string, FlaggedIPData]>((e:[string, FlaggedIPData | false]):e is [string, FlaggedIPData] => e[1] !== false && e[1].moderated).map(([ip, data]) =>
	`&c${ip}&fr: name &c"${data.name}"&fr, uuid &c"${data.uuid}"&fr`
).join("\n") || "none"}`
			);
		}
	},
	fjs: {
		args: ["js:string"],
		description: "Executes arbitrary javascript code, but has access to fish-commands's variables.",
		handler({args}){
			fjsContext.runJS(args.js);
		}
	}
};
