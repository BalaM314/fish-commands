//le overhaul
import { FishPlayer } from "./players";

export class VoteManager{
 
	public votes:Map<FishPlayer,number>
	public goal = 0;
	public timer:TimerTask | null;
	public voting:boolean = false;

	constructor(
		public onSuccess: () => (unknown),// implementation handle vote success
		public onFail: () => (unknown),// implementation handle vote fail
		public onVote: (player:FishPlayer) => (unknown), // implemenation handle player voting
		public onUnVote: (player:FishPlayer) => (unknown), // implementation handle player unvoting
	){
		this.timer = null;
		this.votes = new Map<FishPlayer,number>();
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
		if(!this.voting) return; //no vote is going on
		this.votes.set(player,value);
		this.onVote(player);
		this.checkVote();
	}
	
	public unvote(player:FishPlayer):void{
		if(!this.voting) return; // still no vote
		this.votes.delete(player);
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