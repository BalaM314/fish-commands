/*
Copyright © BalaM314, 2024. All Rights Reserved.
Unfinished.
*/

import { StringIO } from './funcs';



class FMap {
	runs:FinishedMapRun[] = [];
	static maps:Record<string, FMap> = {};
	constructor(
		public map: MMap
	){}
	static read(data:string):FMap {
		return StringIO.read(data, str => new FMap(null!)); //TODO
	}
	write(){

	}
}

type FinishedMapRun = {
	mapName:string;
	winTeam:Team;
	success:boolean; //winTeam == Vars.state.rules.defaultTeam
	startTime:number;
	endTime:number;
	duration:number;
	maxPlayerCount:number;
}

class PartialMapRun {
	startTime:number = Date.now();
	maxPlayerCount:number = 0;
	/** In milliseconds */
	duration(){
		return Date.now() - this.startTime;
	}
	update(){
		this.maxPlayerCount = Math.max(this.maxPlayerCount, Groups.player.size());
	}
	finish({winTeam}:{
		winTeam: Team;
	}):FinishedMapRun {
		return {
			mapName: Vars.state.map.plainName(),
			winTeam,
			success: winTeam == Vars.state.rules.defaultTeam,
			startTime: this.startTime,
			endTime: Date.now(),
			duration: Date.now() - this.startTime,
			maxPlayerCount: this.maxPlayerCount
		};
	}
	//Used for continuing through a restart
	write():string {
		return `${Date.now() - this.startTime}/${this.maxPlayerCount}`;
	}
	static read(data:string):PartialMapRun {
		const [duration, maxPlayerCount] = data.split("/").map(Number);
		if(isNaN(duration) || isNaN(maxPlayerCount)){
			Log.err(`_FINDTAG_ failed to load map run stats data: ${data}`);
		}
		const out = new PartialMapRun();
		out.startTime = Date.now() - duration; //subtract the time when the server was off
		out.maxPlayerCount = maxPlayerCount;
		return out;
	}
}
