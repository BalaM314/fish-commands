import type { FishPlayerData, mindustryPlayerData, PlayerHistoryEntry } from "./types";
import * as config from "./config";
import * as api from "./api";
import { isCoreUnitType } from "./utils";
import { Rank } from "./ranks";

type OnlineFishPlayer = FishPlayer & {player: mindustryPlayer};

export class FishPlayer {
	static cachedPlayers:Record<string, FishPlayer> = {};
	static readonly maxHistoryLength = 5;
	
	//Transients
	player:mindustryPlayer | null = null;
	pet:string = "";
	watch:boolean = false;
	activeMenu: {
		cancelOptionId: number;
		callback?: (sender:FishPlayer, option:number) => void;
	} = {cancelOptionId: -1};
	afk:boolean = false;
	tileId = false;
	tilelog = false;
	trail: {
		type: string;
		color: Color;
	} | null = null;
	cleanedName:string;

	//Stored data
	name: string;
	muted: boolean;
	member: boolean;
	stopped: boolean;
	rank: Rank;
	highlight: string | null;
	rainbow: {
		speed: number;
	} | null;
	history: PlayerHistoryEntry[];
	usid: string | null;
	constructor({
		name, muted = false, member = false, stopped = false,
		highlight = null, history = [], rainbow = null, rank = "player", usid
	}:Partial<FishPlayerData>, player:mindustryPlayer | null){
		this.name = name ?? player?.name ?? "Unnamed player [ERROR]";
		this.muted = muted;
		this.member = member;
		this.stopped = stopped;
		this.highlight = highlight;
		this.history = history;
		this.player = player;
		this.rainbow = rainbow;
		this.cleanedName = Strings.stripColors(this.name);
		this.rank = Rank.getByName(rank) ?? Rank.player;
		this.usid = usid ?? player?.usid() ?? null;
	}
	static read(fishPlayerData:string, player:mindustryPlayer | null){
		return new this(JSON.parse(fishPlayerData), player);
	}
	static createFromPlayer(player:mindustryPlayer){
		return new this({
			name: player.name
		}, player);
	}
	static createFromInfo(playerInfo:mindustryPlayerData){
		return new this({
			name: playerInfo.lastName,
			usid: playerInfo.adminUsid ?? null
		}, null);
	}
	static getFromInfo(playerInfo:mindustryPlayerData){
		return this.cachedPlayers[playerInfo.id] ??= this.createFromInfo(playerInfo);
	}
	static get(player:mindustryPlayer){
		return this.cachedPlayers[player.uuid()] ??= this.createFromPlayer(player);
	}
	static getById(id:string):FishPlayer | null {
		return this.cachedPlayers[id] ?? null;
	}
	static getByName(name:string):FishPlayer | null {
		const realPlayer = Groups.player.find((p:mindustryPlayer) => {
			return p.name === name ||
				p.name.includes(name) ||
				p.name.toLowerCase().includes(name.toLowerCase()) ||
				Strings.stripColors(p.name).toLowerCase() === name.toLowerCase() ||
				Strings.stripColors(p.name).toLowerCase().includes(name.toLowerCase()) ||
				false;
		});
		return realPlayer ? this.get(realPlayer) : null;
	};
	static getAllByName(name:string, strict = true):FishPlayer[] {
		let players:FishPlayer[] = [];
		//Groups.player doesn't support filter
		Groups.player.each((p:mindustryPlayer) => {
			const fishP = FishPlayer.get(p);
			if(fishP.cleanedName.includes(name)) players.push(fishP);
			else if(!strict && fishP.cleanedName.toLowerCase().includes(name)) players.push(fishP);
		});
		return players;
	}
	//This method exists only because there is no easy way to turn an entitygroup into an array
	static getAllOnline(){
		let players:FishPlayer[] = [];
		Groups.player.each((p:mindustryPlayer) => players.push(FishPlayer.get(p)));
		return players;
	}
	static onPlayerJoin(player:mindustryPlayer){
		let fishPlayer = this.cachedPlayers[player.uuid()] ??= this.createFromPlayer(player);
		fishPlayer.updateSavedInfoFromPlayer(player);
		if(fishPlayer.validate()){
			fishPlayer.updateName();
			fishPlayer.updateAdminStatus();
			api.getStopped(player.uuid(), (stopped) => {
				if(fishPlayer.stopped && !stopped) fishPlayer.free("api");
				if(stopped) fishPlayer.stop("api");
			});
		}
	}
	
	static onUnitChange(player:mindustryPlayer, unit:Unit){
		//if(unit.spawnedByCore)
		/**
		 * unit.spawnedByCore is not set correctly in UnitChangeEvent.
		 * This is because the function that fires it(unit.controller(player);)
		 * does not seem to run any code, but it actually runs player.unit(unit)
		 * which fires the event.
		 * This bug should be fixed after v142.
		 */
		if(isCoreUnitType(unit.type))
			this.onRespawn(player);
	}
	static onRespawn(player:mindustryPlayer){
		const fishP = this.get(player);
		if(fishP?.stopped) fishP.stopUnit();
	}
	static forEachPlayer(func:(player:FishPlayer) => unknown){
		for(const [uuid, player] of Object.entries(this.cachedPlayers)){
			if(player.connected()) func(player);
		}
	}
	write():string {
		return JSON.stringify({
			name: this.name,
			muted: this.muted,
			member: this.member,
			stopped: this.stopped,
			highlight: this.highlight,
			history: this.history,
			rainbow: this.rainbow,
			rank: this.rank.name,
			usid: this.usid,
		});
	}
	connected(){
		return this.player && !this.con.hasDisconnected;
	}
	setRank(rank:Rank){
		this.rank = rank;
		this.updateName();
		this.updateAdminStatus();
		FishPlayer.saveAll();
	}
	canModerate(player:FishPlayer, strict:boolean = true){
		if(strict)
			return this.rank.level > player.rank.level || player == this;
		else
			return this.rank.level >= player.rank.level || player == this;
	}
	ranksAtLeast(rank:Rank){
		return this.rank.level >= rank.level;
	}
	/**Must be called at player join, before updateName(). */
	updateSavedInfoFromPlayer(player:mindustryPlayer){
		this.player = player;
		this.name = player.name;
		this.usid ??= player.usid();
		this.cleanedName = Strings.stripColors(player.name);
	}
	updateName(){
		if(this.player == null) return;//No player, no need to update
		let prefix = '';
		if(this.stopped) prefix += config.STOPPED_PREFIX;
		if(this.muted) prefix += config.MUTED_PREFIX;
		if(this.afk) prefix += config.AFK_PREFIX;
		if(this.member) prefix += config.MEMBER_PREFIX;

		prefix += this.rank.prefix;
		this.player.name = prefix + this.name;
	}
	updateAdminStatus(){
		Log.info(`Updating admin status of player ${this.name}`);
		Log.info(`Rank: ${this.rank.name}, is admin: ${this.ranksAtLeast(Rank.admin)}`);
		if(this.ranksAtLeast(Rank.admin)){
			Vars.netServer.admins.adminPlayer(this.uuid(), this.player.usid());
			this.player.admin = true;
		} else {
			Vars.netServer.admins.unAdminPlayer(this.uuid());
			this.player.admin = false;
		}
	}
	/**
	 * Record moderation actions taken on a player.
	 * @param id uuid of the player
	 * @param entry description of action taken
	 */
	addHistoryEntry(entry:PlayerHistoryEntry){
		if(this.history.length > FishPlayer.maxHistoryLength){
			this.history.shift();
		}
		this.history.push(entry);
	}
	static addPlayerHistory(id:string, entry:PlayerHistoryEntry){
		this.getById(id)?.addHistoryEntry(entry);
	}
	stop(by:FishPlayer | "api"){
		this.stopped = true;
		this.stopUnit();
		this.updateName();
		this.sendMessage("[scarlet]Oopsy Whoopsie! You've been stopped, and marked as a griefer.");
		if(by instanceof FishPlayer){
			this.addHistoryEntry({
				action: 'stopped',
				by: by.name,
				time: Date.now(),
			});
			api.addStopped(this.uuid());
		}
		FishPlayer.saveAll();
	}
	stopUnit(){
		if(isCoreUnitType(this.unit().type)){
			this.unit().type = UnitTypes.stell;
			this.unit().apply(StatusEffects.disarmed, Number.MAX_SAFE_INTEGER);
		} else {
			this.forceRespawn();
			//This will cause FishPlayer.onRespawn to run, calling this function again, but then the player will be in a core unit, which can be safely stell'd
		}
	}
	forceRespawn(){
		this.player.clearUnit();
		this.player.checkSpawn();
	}
	uuid():string {
		return this.player.uuid();
	}
	unit():Unit {
		return this.player.unit();
	}
	team():Team {
		return this.player.team();
	}
	get con():NetConnection {
		return this.player.con;
	}
	sendMessage(message:string){
		return this.player.sendMessage(message);
	}
	free(by:FishPlayer | "api"){
		if(!this.stopped) return;
		this.stopped = false;
		this.updateName();
		this.forceRespawn();
		if(by instanceof FishPlayer){
			this.sendMessage('[yellow]Looks like someone had mercy on you.');
			this.addHistoryEntry({
				action: 'freed',
				by: by.name,
				time: Date.now(),
			});
			api.free(this.uuid());
		}
		FishPlayer.saveAll();
	}
	validate(){
		return this.checkName() && this.checkUsid();
	}
	checkName(){
		for(const bannedName of config.bannedNames){
			if(this.name.toLowerCase().includes(bannedName)){
				this.player.kick(
`[scarlet]"${this.name}[scarlet]" is not an allowed name.

If you are unable to change it, please download Mindustry from Steam or itch.io.`
				);
				return false;
			}
		}
		return true;
	}
	checkUsid(){
		if(this.usid != null && this.player.usid() != this.usid){
			Log.err(`&rUSID mismatch for player &c"${this.cleanedName}"&r: stored usid is &c${this.usid}&r, but they tried to connect with usid &c${this.player.usid()}&r, kicking`);
			if(this.ranksAtLeast(Rank.trusted)){
				this.player.kick(`Authorization failure!`);
			}
			return false;
		}
		return true;
	}
	static saveAll(){
		//Temporary implementation
		let playerDatas:string[] = [];
		for(const [uuid, player] of Object.entries(this.cachedPlayers)){
			if((player.rank != Rank.player) || player.member)
				playerDatas.push(`"${uuid}":${player.write()}`);
		}
		Core.settings.put('fish', '{' + playerDatas.join(",") + '}');
		Core.settings.manualSave();
	}
	static loadAll(){
		//Temporary implementation
		const jsonString = Core.settings.get('fish', '');
		if(jsonString == "") return;

		for(let [key, value] of Object.entries(JSON.parse(jsonString))){
			if(value instanceof Object){
				let rank = "player";
				if("mod" in value) rank = "mod";
				if("admin" in value) rank = "admin";
				this.cachedPlayers[key] = new this({
					rank,
					...value as Partial<FishPlayerData>
				}, null);
			}
		}
	}
}
