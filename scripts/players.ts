import type { FishPlayerData, mindustryPlayerData, PlayerHistoryEntry } from "./types";
import * as config from "./config";
import * as api from "./api";
import { isCoreUnitType, StringIO } from "./utils";
import { Rank } from "./ranks";


export class FishPlayer {
	static cachedPlayers:Record<string, FishPlayer> = {};
	static readonly maxHistoryLength = 5;
	static readonly saveVersion = 1;
	
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
	uuid: string;
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
		uuid, name, muted = false, member = false, stopped = false,
		highlight = null, history = [], rainbow = null, rank = "player", usid
	}:Partial<FishPlayerData>, player:mindustryPlayer | null){
		this.uuid = uuid ?? player?.uuid() ?? (() => {throw new Error(`Attempted to create FishPlayer with no UUID`)})();
		this.name = name ?? player?.name ?? "Unnamed player [ERROR]";
		this.muted = muted;
		this.member = member;
		this.stopped = stopped;
		this.highlight = highlight;
		this.history = history;
		this.player = player;
		this.rainbow = rainbow;
		this.cleanedName = Strings.stripColors(this.name);
		this.rank = Rank.getByName(rank) ?? Rank.new;
		this.usid = usid ?? player?.usid() ?? null;
	}

	//#region getplayer
	//Contains methods used to get FishPlayer instances.
	static createFromPlayer(player:mindustryPlayer){
		return new this({}, player);
	}
	static createFromInfo(playerInfo:mindustryPlayerData){
		return new this({
			uuid: playerInfo.id,
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
	/**Returns the FishPlayer representing the first online player matching a given name. */
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
	
	/**Returns the FishPlayers representing all online players matching a given name. */
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
	static getOneByString(str:string):FishPlayer | "none" | "multiple" {
		const players = this.getAllOnline();
		let matchingPlayers:FishPlayer[];

		const filters:((p:FishPlayer) => boolean)[] = [
			p => p.uuid === str,
			p => p.player.id.toString() === str,
			p => p.name === str,
			p => p.cleanedName === str,
			p => p.cleanedName.toLowerCase() === str.toLowerCase(),
			p => p.name.includes(str),
			p => p.cleanedName.includes(str),
			p => p.cleanedName.toLowerCase().includes(str.toLowerCase()),
		];

		for(const filter of filters){
			matchingPlayers = players.filter(filter);
			if(matchingPlayers.length == 1) return matchingPlayers[0];
			else if(matchingPlayers.length > 1) return "multiple";
		}
		return "none";
	}
	//This method exists only because there is no easy way to turn an entitygroup into an array
	static getAllOnline(){
		let players:FishPlayer[] = [];
		Groups.player.each((p:mindustryPlayer) => players.push(FishPlayer.get(p)));
		return players;
	}
	//#endregion

	//#region eventhandling
	//Contains methods that handle an event and must be called by other code (usually through Events.on).
	/**Must be run on PlayerJoinEvent. */
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
	/**Must be run on UnitChangeEvent. */
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
	private static onRespawn(player:mindustryPlayer){
		const fishP = this.get(player);
		if(fishP?.stopped) fishP.stopUnit();
	}
	static forEachPlayer(func:(player:FishPlayer) => unknown){
		for(const [uuid, player] of Object.entries(this.cachedPlayers)){
			if(player.connected()) func(player);
		}
	}
	/**Must be called at player join, before updateName(). */
	updateSavedInfoFromPlayer(player:mindustryPlayer){
		this.player = player;
		this.name = player.name;
		this.usid ??= player.usid();
		this.cleanedName = Strings.stripColors(player.name);
	}

	/**Updates the mindustry player's name, using the prefixes of the current rank and  */
	updateName(){
		if(!this.connected()) return;//No player, no need to update
		let prefix = '';
		if(this.stopped) prefix += config.STOPPED_PREFIX;
		if(this.muted) prefix += config.MUTED_PREFIX;
		if(this.afk) prefix += config.AFK_PREFIX;
		if(this.member) prefix += config.MEMBER_PREFIX;

		prefix += this.rank.prefix;
		this.player.name = prefix + " " + this.name;
	}
	updateAdminStatus(){
		if(this.ranksAtLeast(Rank.admin)){
			Vars.netServer.admins.adminPlayer(this.uuid, this.player.usid());
			this.player.admin = true;
		} else {
			Vars.netServer.admins.unAdminPlayer(this.uuid);
			this.player.admin = false;
		}
	}
	validate(){
		return this.checkName() && this.checkUsid();
	}
	/**Checks if this player's name is allowed. */
	checkName(){
		for(const bannedName of config.bannedNames){
			if(this.name.toLowerCase().includes(bannedName.toLowerCase())){
				this.player.kick(
`[scarlet]"${this.name}[scarlet]" is not an allowed name.

If you are unable to change it, please download Mindustry from Steam or itch.io.`
				);
				return false;
			}
		}
		return true;
	}
	/**Checks if this player's USID is correct. */
	checkUsid(){
		if(this.usid != null && this.player.usid() != this.usid){
			Log.err(`&rUSID mismatch for player &c"${this.cleanedName}"&r: stored usid is &c${this.usid}&r, but they tried to connect with usid &c${this.player.usid()}&r`);
			if(this.ranksAtLeast(Rank.trusted)){
				this.player.kick(`Authorization failure!`);
			}
			return false;
		}
		return true;
	}
	displayTrail(){
		if(this.trail) Call.effect(Fx[this.trail.type], this.player.x, this.player.y, 0, this.trail.color);
	}
	//#endregion

	//#region I/O
	static readLegacy(fishPlayerData:string, player:mindustryPlayer | null){
		return new this(JSON.parse(fishPlayerData), player);
	}
	static read(version:number, fishPlayerData:StringIO, player:mindustryPlayer | null){
		switch(version){
			case 0:
				return new this({
					uuid: fishPlayerData.readString(2) ?? (() => {throw new Error("Failed to deserialize FishPlayer: UUID was null.")})(),
					name: fishPlayerData.readString(2) ?? "Unnamed player [ERROR]",
					muted: fishPlayerData.readBool(),
					member: fishPlayerData.readBool(),
					stopped: fishPlayerData.readBool(),
					highlight: fishPlayerData.readString(3),
					history: fishPlayerData.readArray(str => ({
						action: str.readString(2) ?? "null",
						by: str.readString(2) ?? "null",
						time: str.readNumber(15)
					})),
					rainbow: ((n:number) => n == 0 ? null : {speed: n})(fishPlayerData.readNumber(2)),
					rank: fishPlayerData.readString(2) ?? "",
					usid: fishPlayerData.readString(3)
				}, player);
			case 1:
				return new this({
					uuid: fishPlayerData.readString(2) ?? (() => {throw new Error("Failed to deserialize FishPlayer: UUID was null.")})(),
					name: fishPlayerData.readString(2) ?? "Unnamed player [ERROR]",
					muted: fishPlayerData.readBool(),
					member: fishPlayerData.readBool(),
					stopped: fishPlayerData.readBool(),
					highlight: fishPlayerData.readString(2),
					history: fishPlayerData.readArray(str => ({
						action: str.readString(2) ?? "null",
						by: str.readString(2) ?? "null",
						time: str.readNumber(15)
					})),
					rainbow: (n => n == 0 ? null : {speed: n})(fishPlayerData.readNumber(2)),
					rank: fishPlayerData.readString(2) ?? "",
					usid: fishPlayerData.readString(2)
				}, player);
			default: throw new Error(`Unknown save version ${version}`);
		}
	}
	write(out:StringIO){
		out.writeString(this.uuid, 2);
		out.writeString(this.name, 2);
		out.writeBool(this.muted);
		out.writeBool(this.member);
		out.writeBool(this.stopped);
		out.writeString(this.highlight, 2);
		out.writeArray(this.history, (i, str) => {
			str.writeString(i.action, 2);
			str.writeString(i.by, 2);
			str.writeNumber(i.time, 15);
		});
		out.writeNumber(this.rainbow?.speed ?? 0, 2);
		out.writeString(this.rank.name, 2);
		out.writeString(this.usid, 2);
	}
	writeLegacy():string {
		const obj:any = {};
		obj.name = this.name;
		if(this.muted != false) obj.muted = this.muted;
		if(this.member != false) obj.member = this.member;
		if(this.stopped != false) obj.stopped = this.stopped;
		if(this.highlight != null) obj.highlight = this.highlight;
		obj.history = this.history;
		if(this.rainbow != null) obj.rainbow = this.rainbow;
		if(this.rank != Rank.new) obj.rank = this.rank.name;
		obj.usid = this.usid;
		return JSON.stringify(obj);
	}
	/**Saves cached FishPlayers to JSON in Core.settings. */
	static saveAll(){
		// this.saveAllLegacy();
		let out = new StringIO();
		out.writeNumber(this.saveVersion, 2);
		out.writeArray(Object.entries(this.cachedPlayers), ([uuid, player]) => {
			if(player.shouldCache()){
				player.write(out);
			}
		});
		Core.settings.put('fish', out.string);
		Core.settings.manualSave();
	}
	shouldCache(){
		return (this.rank != Rank.new && this.rank != Rank.player) || this.muted || this.member;
	}
	static saveAllLegacy(){
		let playerDatas:string[] = [];
		for(const [uuid, player] of Object.entries(this.cachedPlayers)){
			if(player.shouldCache())
				playerDatas.push(`"${uuid}":${player.writeLegacy()}`);
		}
		Core.settings.put('fish', '{' + playerDatas.join(",") + '}');
		Core.settings.manualSave();
	}
	/**Loads cached FishPlayers from JSON in Core.settings. */
	static loadAll(){
		const string = Core.settings.get('fish', '');
		if(string == "") return; //If it's empty, don't try to load anything
		if(string.startsWith("{")) return this.loadAllLegacy(string);
		const out = new StringIO(string);
		const version = out.readNumber(2);
		out.readArray(str => FishPlayer.read(version, str, null))
			.forEach(p => this.cachedPlayers[p.uuid] = p);
		out.expectEOF();
	}
	static loadAllLegacy(jsonString:string){
		for(let [key, value] of Object.entries(JSON.parse(jsonString))){
			if(value instanceof Object){
				let rank = "player";
				if("mod" in value && value.mod) rank = "mod";
				if("admin" in value && value.admin) rank = "admin";
				this.cachedPlayers[key] = new this({
					rank,
					uuid: key,
					...value
				}, null);
			}
		}
	}
	//#endregion
	
	//#region util
	connected(){
		return this.player && !this.con.hasDisconnected;
	}
	/**
	 * @returns whether a player can perform a moderation action on another player.
	 * @param strict If false, then the action is also allowed on players of same rank.
	 */
	canModerate(player:FishPlayer, strict:boolean = true){
		if(strict)
			return this.rank.level > player.rank.level || player == this;
		else
			return this.rank.level >= player.rank.level || player == this;
	}
	ranksAtLeast(rank:Rank){
		return this.rank.level >= rank.level;
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
		return this.player?.sendMessage(message);
	}

	setRank(rank:Rank){
		this.rank = rank;
		this.updateName();
		this.updateAdminStatus();
		FishPlayer.saveAll();
	}
	forceRespawn(){
		this.player.clearUnit();
		this.player.checkSpawn();
	}
	//#endregion

	//#region moderation
	/**Records a moderation action taken on a player. */
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
			api.addStopped(this.uuid);
		}
		FishPlayer.saveAll();
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
			api.free(this.uuid);
		}
		FishPlayer.saveAll();
	}
	mute(by:FishPlayer | "api"){
		if(this.muted) return;
		this.muted = true;
		this.updateName();
		this.sendMessage(`[yellow] Hey! You have been muted. You can still use /msg to send a message to someone.`);
		if(by instanceof FishPlayer){
			this.addHistoryEntry({
				action: 'muted',
				by: by.name,
				time: Date.now(),
			});
		}
		FishPlayer.saveAll();
	}
	unmute(by:FishPlayer | "api"){
		if(!this.muted) return;
		this.muted = false;
		this.updateName();
		this.sendMessage(`[green]You have been unmuted.`);
		if(by instanceof FishPlayer){
			this.addHistoryEntry({
				action: 'unmuted',
				by: by.name,
				time: Date.now(),
			});
		}
		FishPlayer.saveAll();
	}

	stopUnit(){
		if(this.connected() && this.unit()){
			if(isCoreUnitType(this.unit().type)){
				this.unit().type = UnitTypes.stell;
				this.unit().apply(StatusEffects.disarmed, Number.MAX_SAFE_INTEGER);
			} else {
				this.forceRespawn();
				//This will cause FishPlayer.onRespawn to run, calling this function again, but then the player will be in a core unit, which can be safely stell'd
			}
		}
	}
	//#endregion

}
