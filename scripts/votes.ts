//le overhaul
import { FishPlayer } from "./players";

export class VoteManager{
 
	public votes:Map<string,number>
	public goal = 0;
	public timer:TimerTask | null;
	public voting:boolean = false;

	constructor(
		public onSuccess: () => (unknown),// implementation handle vote success
		public onFail: () => (unknown),// implementation handle vote fail
		//I hate that this is inconsistant, but its the best setup 
		public onVote: (player:FishPlayer) => (unknown), // implemenation handle player voting
		public onUnVote: (player:mindustryPlayer) => (unknown), // implementation handle player unvoting
	){
		this.timer = null;
		this.votes = new Map<string,number>();
		this.onSuccess = onSuccess;
		this.onFail = onFail;
		this.onVote = onVote;
		this.onUnVote = onUnVote;
	};

	public start(player:FishPlayer, value:number, voteTime:number, threshold:number){
		this.goal = threshold;
		this.voting = true;
		this.timer = Timer.schedule(() => this.end(), voteTime / 1000);
		this.vote(player,value);
	}

	public end(){ 
		if(!this.checkVote()){
			this.failed();
		}
	}

	public vote(player:FishPlayer, value:number):void{
		if(!this.voting || player == null || player.usid == null) return; //no vote is going on
		this.votes.set(player.uuid,value);
		Log.info(`Player voted, Name : ${player.name},UUID : ${player.uuid}`);
		this.onVote(player);
		this.checkVote();
	}

	//unused unvote talking a proper fish player, useful If we ever add a unvote command
	public unvoteFish(player:FishPlayer):void{
		if(!this.voting || player == null || player.uuid == null) return; 
		if(!this.votes.delete(player.uuid)) Log.err(`Failed to Unvote Player uuid:${player.uuid}`);
		this.onUnVote(player);
		this.checkVote();
	}

	//unvote with a mindustry player, which occurs during a playerleave event.
	//I hate this method with a passion
	public unvoteMindustry(player:mindustryPlayer):void{
		if(!this.voting || player == null) return; 
		if(!this.votes.delete(player.uuid())) Log.err(`Failed to Unvote Player uuid:${player.uuid()}`);
		this.onUnVote(player);
		this.checkVote();
	}

	public forceVote(force:boolean):void{
		if(!this.voting) return;
		if(force) this.succeeded();
		else this.failed()
	}

	private failed(){
		this.resetVote();
		this.onFail()
	}

	private succeeded(){
		this.resetVote();
		this.onSuccess();
	}
	
	public resetVote(){
		if(this.timer !== null) this.timer!.cancel();
		this.votes.clear();
		this.voting = false;
	}
	
	public getGoal():number{
		if(Groups.player.size() >= this.goal){
			return(this.goal);
		}
		return(Groups.player.size());
	}

	public scoreVotes():number{
		let scoredVote:number = 0;
		this.votes.forEach((vote)=>(scoredVote += vote));
		return scoredVote;
	}

	private checkVote():boolean{
		if(this.scoreVotes() >= this.getGoal()){
			this.succeeded();
			return true;
		}
		return false;
	}
}