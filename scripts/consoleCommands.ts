import { FishPlayer } from "./players";
import { Rank } from "./ranks";
import { FishConsoleCommandsList, mindustryPlayerData } from "./types";
import { setToArray, StringBuilder } from "./utils";
import { fail } from "./commands";


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
	}
};
