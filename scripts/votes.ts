//le overhaul
import { FishPlayer } from "./players";

export class VoteManager {
 
	votes = new Map<string, number>();
	goal = 0;
	timer:TimerTask | null = null;
	active = false;

	constructor(
		public onSuccess: () => unknown,
		public onFail: () => unknown,
		//I hate that this is inconsistant, but its the best setup 
		public onVote: (player:FishPlayer) => unknown,
		public onUnVote: (player:mindustryPlayer) => unknown, //TODO:PR change param to FishPlayer
	){} //TODO:PR use builder pattern to clarify call site

	start(player:FishPlayer, value:number, voteTime:number, threshold:number){
		this.goal = threshold; //TODO:PR shouldn't this be a constant instance property?
		this.active = true;
		this.timer = Timer.schedule(() => this.end(), voteTime / 1000);
		this.vote(player, value);
	}

	end(){ 
		if(!this.checkVote()){
			this.failed();
		}
	}

	vote(player:FishPlayer, value:number){
		if(!this.active || player == null || player.usid == null) return; //no vote is going on
		this.votes.set(player.uuid, value);
		Log.info(`Player voted, Name : ${player.name},UUID : ${player.uuid}`);
		this.onVote(player);
		this.checkVote();
	}

	//unused unvote taking a fish player, useful if we ever add an unvote command
	unvoteFish(player:FishPlayer){
		if(!this.active || player == null || player.uuid == null) return; 
		if(!this.votes.delete(player.uuid)) Log.err(`Failed to Unvote Player uuid:${player.uuid}`);
		this.onUnVote(player);
		this.checkVote();
	}

	//unvote with a mindustry player, which occurs during a playerleave event.
	//I hate this method with a passion
	unvoteMindustry(player:mindustryPlayer){
		if(!this.active || player == null) return; 
		if(!this.votes.delete(player.uuid())) Log.err(`Failed to Unvote Player uuid:${player.uuid()}`);
		this.onUnVote(player);
		this.checkVote();
	}

	forceVote(force:boolean){
		if(!this.active) return;
		if(force) this.succeeded();
		else this.failed()
	}

	failed(){
		this.resetVote(); //TODO:PR wrong order
		this.onFail()
	}

	succeeded(){
		this.resetVote(); //TODO:PR wrong order
		this.onSuccess();
	}
	
	resetVote(){
		if(this.timer != null) this.timer.cancel();
		this.votes.clear();
		this.active = false;
	}
	
	getGoal():number {
		return Math.min(this.goal, Groups.player.size());
	}

	scoreVotes():number {
		return [...this.votes].reduce((acc, [k, v]) => acc + v, 0);
	}

	private checkVote():boolean {
		if(this.scoreVotes() >= this.getGoal()){ //TODO:PR bad logic
			this.succeeded();
			return true;
		}
		return false;
	}
}