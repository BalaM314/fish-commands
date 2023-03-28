import { FishPlayer } from "./players";
import { Rank } from "./ranks";
import { FishConsoleCommandsList } from "./types";


export const commands:FishConsoleCommandsList = {
	setrank: {
		args: ["player:exactPlayer", "rank:string"],
		description: "Set a player's rank.",
		handler({args, outputFail, outputSuccess}){
			const rank = Rank.getByName(args.rank);
			if(rank == null){
				outputFail(`Unknown rank ${args.rank}`);
				return;
			}

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
	}
};