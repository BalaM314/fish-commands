import { FishPlayer } from "./players";
import { EventEmitter } from "./utils.js";

export type VoteEventMapping = {
	"success": [forced:boolean];
	"fail": [forced:boolean];
	"vote passed": [votes:number, required:number];
	"vote failed": [votes:number, required:number];
	"player vote": [player:FishPlayer, current:number];
	"player vote change": [player:FishPlayer, previous:number, current:number];
	"player vote removed": [player:FishPlayer, previous:number];
};
export type VoteEvent = keyof VoteEventMapping;
export type VoteEventData<T extends VoteEvent> = VoteEventMapping[T];
export class VoteManager extends EventEmitter<VoteEventMapping> {

	votes = new Map<string, number>();
	timer:TimerTask | null = null;
	active = false;

	constructor(
		public voteTime:number,
		public goal:number = 0.50001,
	){
		super();
		Events.on(EventType.PlayerLeave, ({player}) => {
			//Run once the player has been removed, but resolve the player first in case the connection gets nulled
			const fishP = FishPlayer.get(player);
			Core.app.post(() => this.unvote(fishP));
		});
		Events.on(EventType.GameOverEvent, () => this.resetVote());
	}

	start(player:FishPlayer, value:number){
		this.active = true;
		this.timer = Timer.schedule(() => this._checkVote(false), this.voteTime / 1000);
		this.vote(player, value);
	}

	vote(player:FishPlayer, newVote:number){
		if(!this.active) return this.start(player, newVote);
		const oldVote = this.votes.get(player.uuid);
		this.votes.set(player.uuid, newVote);
		if(oldVote == null) this.fire("player vote", [player, newVote]);
		this.fire("player vote change", [player, oldVote ?? 0, newVote]);
		this._checkVote(false);
	}

	unvote(player:FishPlayer){
		if(!this.active) return;
		const fishP = FishPlayer.resolve(player);
		const vote = this.votes.get(fishP.uuid);
		if(vote){
			this.fire("player vote removed", [player, vote]);
			this._checkVote(false);
		} else {
			Log.err(`Cannot remove nonexistent vote for player with uuid ${fishP.uuid}`);
		}
	}

	/** Does not fire the events used to display messages, please print one before calling this */
	forceVote(force:boolean){
		if(force){
			this.fire("success", [true]);
		} else {
			this.fire("fail", [true]);
		}
	}
	
	resetVote(){
		if(this.timer != null) this.timer.cancel();
		this.votes.clear();
		this.active = false;
	}
	
	getGoal():number {
		//TODO discount AFK players
		return Math.ceil(this.goal * Groups.player.size());
	}

	scoreVotes():number {
		return [...this.votes].reduce((acc, [k, v]) => acc + v, 0);
	}

	_checkVote(end:boolean){
		const votes = this.scoreVotes();
		const required = this.getGoal();
		if(votes >= required){
			this.fire("success", [false]);
			this.fire("vote passed", [votes, required]);
			this.resetVote();
		} else if(end){
			this.fire("fail", [false]);
			this.fire("vote failed", [votes, required]);
			this.resetVote();
		}
	}
}