import { FishPlayer } from "./players";
import { Rank } from "./ranks";
import { FishConsoleCommandsList, mindustryPlayerData } from "./types";
import { setToArray } from "./utils";
import { fail } from "./commands";


export const commands:FishConsoleCommandsList = {
	setrank: {
		args: ["player:exactPlayer", "rank:string"],
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
	infoOnline: {
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
		description:"Unblacklists an ip from the dosBlacklist",
		handler({args, output}){
			const ip=args.ip
			const blacklist=Vars.netServer.admins.dosBlacklist
            if(blacklist.remove(ip)) {output("Removed "+ip+" from the dosblacklist")}
			else {fail("That ip doesn't exist or isn't in the blacklist")}
		}
	},
	blacklist:{
		args:[],
		description:"Allows you to view the dosBlacklist",
		handler({output}){
			let outputString:string[]=[""]
			const blacklist=Vars.netServer.admins.dosBlacklist
            if(blacklist.isEmpty()) output("The blacklist is empty")
            blacklist.each((ip: string)=>{
                const findings=Vars.netServer.admins.findByName(ip).first()//we don't care about any other infos because woehiansoahikl
                outputString.push("IP: "+ip+" UUID: "+findings.id+" LAST NAME USED: "+findings.plainLastName())
            })
			output(outputString.join("\n"))
		}
	}
};
