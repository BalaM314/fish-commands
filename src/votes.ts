/*
Copyright © BalaM314, 2024. All Rights Reserved.
This file contains the voting system.
Some contributions: @author Jurorno9
*/

import { FishPlayer } from "./players";
import { crash } from './funcs';
import { EventEmitter } from './funcs';
import { Rank } from "./ranks";
import { getPriority } from "os";

/** Event data for each voting event. */
export type VoteEventMapping = {
	"success": [forced:boolean] ;
	"fail": [forced:boolean];
	"vote passed": [votes:number, required:number, canidates:Seq<Player>];
	"vote failed": [votes:number, required:number, canidates:Seq<Player>];
	"player vote": [player:FishPlayer, current:number];
	"player vote change": [player:FishPlayer, previous:number, current:number, canidates:Seq<Player>];
	"player vote removed": [player:FishPlayer, previous:number, canidates:Seq<Player>];
};
export type VoteEvent = keyof VoteEventMapping;
export type VoteEventData<T extends VoteEvent> = VoteEventMapping[T];

/** Manages a vote. */
export class VoteManager<SessionData extends {}> extends EventEmitter<VoteEventMapping> {

	/** The ongoing voting session, if there is one. */
	session: {
		data: SessionData;
		votes: Map<string, number>;
		timer: TimerTask;
	} | null = null;

	constructor(
		public voteTime:number,
		public goal:number = 0.50001,
		public team: Team | undefined = undefined,
		public canidates:Seq<Player> = new Seq<Player>()
	){
		super();
		Events.on(EventType.PlayerLeave, ({player}) => {
			//Run once the player has been removed, but resolve the player first in case the connection gets nulled
			const fishP = FishPlayer.get(player);
			Core.app.post(() => this.unvote(fishP));
		});
		Events.on(EventType.GameOverEvent, () => this.resetVote());
	}

	start(player:FishPlayer, newVote:number, data:SessionData){
		if(data === null) crash(`Cannot start vote: data not provided`);
		this.session = {
			timer: Timer.schedule(() => this._checkVote(false), this.voteTime / 1000),
			votes: new Map(),
			data,
		};
		this.vote(player, newVote, data);
	}

	vote(player:FishPlayer, newVote:number, data:SessionData | null){
		if(!this.session) return this.start(player, newVote, data!);
		const oldVote = this.session.votes.get(player.uuid);
		this.session.votes.set(player.uuid, newVote);
		if(oldVote == null) this.fire("player vote", [player, newVote]);
		this._getCanidates();
		this.fire("player vote change", [player, oldVote ?? 0, newVote, this.canidates]);
		this._checkVote(false);
	}

	unvote(player:FishPlayer){
		if(!this.session) return;
		const fishP = FishPlayer.resolve(player);
		const vote = this.session.votes.get(fishP.uuid);
		if(vote){
			this.session.votes.delete(fishP.uuid);
			this._getCanidates();
			this.fire("player vote removed", [player, vote, this.canidates]);
			this._checkVote(false);
		}
	}

	/** Does not fire the events used to display messages, please print one before calling this */
	forceVote(force:boolean){
		if(force){
			this.fire("success", [true]);
		} else {
			this.fire("fail", [true]);
		}
		this.resetVote();
	}
	
	resetVote(){
		if(this.session == null) return;
		this.session.timer.cancel();
		this.session = null;
	}
	
	requiredVotes():number {
		return Math.max(Math.ceil(this.goal * this._getCanidates().size), 1);
	}

	currentVotes():number {
		return this.session ? [...this.session.votes].reduce((acc, [k, v]) => acc + v, 0) : 0;
	}

	_getCanidates():Seq<Player>{
		this.canidates.clear()
		Groups.player.each((p) => {return(!this.team || (p.team() == this.team && (!FishPlayer.get(p).afk() || FishPlayer.get(p).ranksAtLeast(Rank.admin))))}, (p) => {this.canidates.add(p);});
		return this.canidates;
	}
	_checkVote(end:boolean){
		const votes = this.currentVotes();
		const required = this.requiredVotes();
		if(votes >= required){
			this.fire("success", [false]);
			this.fire("vote passed", [votes, required, this.canidates]);
			this.resetVote();
		} else if(end){
			this.fire("fail", [false]);
			this.fire("vote failed", [votes, required, this.canidates]);
			this.resetVote();
		}
	}
}