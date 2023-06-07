import * as api from "./api";
import { Perm, PermType } from "./commands";
import * as config from "./config";
import { menu } from "./menus";
import { Rank, RoleFlag } from "./ranks";
import type { FishPlayerData, PlayerHistoryEntry } from "./types";
import { StringIO, formatTimeRelative, isCoreUnitType, logAction, matchFilter } from "./utils";


export class FishPlayer {
	static cachedPlayers:Record<string, FishPlayer> = {};
	static readonly maxHistoryLength = 5;
	static readonly saveVersion = 4;

	//Static transients
	static stats = {
		numIpsChecked: 0,
		numIpsFlagged: 0,
		numIpsErrored: 0,
	};
	
	//Transients
	player:mindustryPlayer | null = null;
	pet:string = "";
	watch:boolean = false;
	activeMenu: {
		cancelOptionId: number;
		callback?: (sender:FishPlayer, option:number) => void;
	} = {cancelOptionId: -1};
	tileId = false;
	tilelog:null | "once" | "persist" = null;
	trail: {
		type: string;
		color: Color;
	} | null = null;
	cleanedName:string;
	/** Used to freeze players when votekicking. */
	frozen:boolean = false;

	//Stored data
	uuid: string;
	name: string;
	muted: boolean;
	autoflagged: boolean;
	unmarkTime: number;
	rank: Rank;
	flags: Set<RoleFlag>;
	highlight: string | null;
	rainbow: {
		speed: number;
	} | null;
	history: PlayerHistoryEntry[];
	usid: string | null;

	constructor({
		uuid, name, muted = false, autoflagged = false, unmarkTime: unmarked = -1,
		highlight = null, history = [], rainbow = null, rank = "player", flags = [], usid,
		//deprecated
		member, stopped,
	}:Partial<FishPlayerData>, player:mindustryPlayer | null){
		this.uuid = uuid ?? player?.uuid() ?? (() => {throw new Error(`Attempted to create FishPlayer with no UUID`)})();
		this.name = name ?? player?.name ?? "Unnamed player [ERROR]";
		this.muted = muted;
		this.unmarkTime = unmarked;
		if(stopped) this.unmarkTime = Date.now() + 2592000; //30 days
		this.autoflagged = autoflagged;
		this.highlight = highlight;
		this.history = history;
		this.player = player;
		this.rainbow = rainbow;
		this.cleanedName = Strings.stripColors(this.name);
		this.rank = Rank.getByName(rank) ?? Rank.new;
		this.flags = new Set(flags.map(RoleFlag.getByName).filter((f):f is RoleFlag => f != null));
		if(member) this.flags.add(RoleFlag.member);
		if(rank == "developer"){
			this.rank = Rank.admin;
			this.flags.add(RoleFlag.developer);
		}
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
		if(name == "") return null;
		const realPlayer = Groups.player.find(p => {
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
		if(name == "") return [];
		return Groups.player.copy(new Seq()).filter(p => {
			const fishP = FishPlayer.get(p);
			return fishP.cleanedName.includes(name) || (!strict && fishP.cleanedName.toLowerCase().includes(name));
		}).items;
	}
	static getOneByString(str:string):FishPlayer | "none" | "multiple" {
		if(str == "") return "none";
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
	static getOneMindustryPlayerByName(str:string):mindustryPlayer | "none" | "multiple" {
		if(str == "") return "none";
		const players = Groups.player.copy(new Seq()).items;
		let matchingPlayers:mindustryPlayer[];

		const filters:((p:mindustryPlayer) => boolean)[] = [
			p => p.name === str,
			p => Strings.stripColors(p.name) === str,
			p => Strings.stripColors(p.name).toLowerCase() === str.toLowerCase(),
			p => p.name.includes(str),
			p => Strings.stripColors(p.name).includes(str),
			p => Strings.stripColors(p.name).toLowerCase().includes(str.toLowerCase()),
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
		Groups.player.each((p:mindustryPlayer) => {
			const fishP = FishPlayer.get(p);
			if(fishP.connected()) players.push(fishP);
		});
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
			api.getStopped(player.uuid(), (unmarked) => {
				fishPlayer.unmarkTime = unmarked;
				fishPlayer.sendWelcomeMessage();
				fishPlayer.updateName();
			});
			fishPlayer.checkVPN();
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
		if(fishP.stelled()) fishP.stopUnit();
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
		this.flags.forEach(f => {
			if(!f.peristent) this.flags.delete(f);
		});
		this.cleanedName = Strings.stripColors(player.name);
	}

	/**Updates the mindustry player's name, using the prefixes of the current rank and role flags. */
	updateName(){
		if(!this.connected()) return;//No player, no need to update
		let prefix = '';
		if(this.marked()) prefix += config.MARKED_PREFIX;
		else if(this.autoflagged) prefix += "[yellow]\u26A0[scarlet]Flagged[yellow]\u26A0[white]";
		if(this.muted) prefix += config.MUTED_PREFIX;
		for(const flag of this.flags){
			prefix += flag.prefix;
		}
		prefix += this.rank.prefix;
		if(prefix != "")
			this.player.name = prefix + " " + this.name;
		else
			this.player.name = this.name;
	}
	updateAdminStatus(){
		if(this.hasPerm("admin")){
			Vars.netServer.admins.adminPlayer(this.uuid, this.player.usid());
			this.player.admin = true;
		} else {
			Vars.netServer.admins.unAdminPlayer(this.uuid);
			this.player.admin = false;
		}
	}
	checkVPN(){
		const ip = this.player.ip();
		const info:mindustryPlayerData = this.player.getInfo();
		api.isVpn(ip, isVpn => {if(isVpn){
			Log.warn(`IP ${ip} was flagged as VPN. Flag rate: ${FishPlayer.stats.numIpsFlagged}/${FishPlayer.stats.numIpsChecked} (${100 * FishPlayer.stats.numIpsFlagged / FishPlayer.stats.numIpsChecked}%)`);
			if(info.timesJoined <= 1){
				this.autoflagged = true;
				this.stopUnit();
				this.updateName();
				logAction("autoflagged", "AntiVPN", this);
				api.sendStaffMessage(`Autoflagged player ${this.name} for suspected vpn!`, "AntiVPN");
				FishPlayer.messageStaff(`[yellow]WARNING:[scarlet] player [cyan]"${this.name}[cyan]"[yellow] is new (${info.timesJoined - 1} joins) and using a vpn. They have been automatically stopped and muted. Unless there is an ongoing griefer raid, they are most likely innocent. Free them with /free.`);
				Log.warn(`Player ${this.name} (${this.uuid}) was autoflagged.`);
				menu("[gold]Welcome to Fish Network!", `[gold]Hi there! You have been automatically [scarlet]stopped and muted[] because we've found something to be a [pink]bit sus[]. You can still talk to staff and request to be freed. [#7289da]Join our Discord[] to request a staff member come online if none are on.`, ["Close", "Discord"], this, ({option, sender}) => {
					if(option == "Discord"){
						Call.openURI(sender.con, 'https://discord.gg/VpzcYSQ33Y');
					}
				}, false);
				this.sendMessage(`[gold]Welcome to Fish Network!\n[gold]Hi there! You have been automatically [scarlet]stopped and muted[] because we've found something to be a [pink]bit sus[]. You can still talk to staff and request to be freed. [#7289da]Join our Discord[] to request a staff member come online if none are on.`);
			} else if(info.timesJoined < 5){
				FishPlayer.messageStaff(`[yellow]WARNING:[scarlet] player [cyan]"${this.name}[cyan]"[yellow] is new (${info.timesJoined - 1} joins) and using a vpn.`);
			}
		}}, err => {
			Log.err(`Error while checking for VPN status of ip ${ip}!`);
			Log.err(err);
		});
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
		if(matchFilter(this.name)){
			this.player.kick(
`[scarlet]"${this.name}[scarlet]" is not an allowed name.

If you are unable to change it, please download Mindustry from Steam or itch.io.`
			);
		}
		return true;
	}
	/**Checks if this player's USID is correct. */
	checkUsid(){
		if(this.usid != null && this.usid != "" && this.player.usid() != this.usid){
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
	sendWelcomeMessage(){
		if(this.marked()) this.sendMessage(
`[gold]Hello there! You are currently [scarlet]marked as a griefer[]. You cannot do anything in-game while marked.
To appeal, [#7289da]join our discord[] with [#7289da]/discord[], or ask a ${Rank.mod.color}staff member[] in-game.
Your mark will expire automatically ${this.unmarkTime == config.maxTime ? "in [red]never[]" : `[green]${formatTimeRelative(this.unmarkTime)}[]`}.
We apologize for the inconvenience.`
		); else if(this.muted) this.sendMessage(
`[gold]Hello there! You are currently [red]muted[]. You can still play normally, but cannot send chat messages to other non-staff players while muted.
To appeal, [#7289da]join our discord[] with [#7289da]/discord[], or ask a ${Rank.mod.color}staff member[] in-game.
We apologize for the inconvenience.`
		); else if(this.autoflagged) this.sendMessage(
`[gold]Hello there! You are currently [red]flagged as suspicious[]. You cannot do anything in-game.
To appeal, [#7289da]join our discord[] with [#7289da]/discord[], or ask a ${Rank.mod.color}staff member[] in-game.
We apologize for the inconvenience.`
		); else this.sendMessage(
`[gold]Welcome![]`
		);
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
			case 2:
				return new this({
					uuid: fishPlayerData.readString(2) ?? (() => {throw new Error("Failed to deserialize FishPlayer: UUID was null.")})(),
					name: fishPlayerData.readString(2) ?? "Unnamed player [ERROR]",
					muted: fishPlayerData.readBool(),
					stopped: fishPlayerData.readBool(),
					highlight: fishPlayerData.readString(2),
					history: fishPlayerData.readArray(str => ({
						action: str.readString(2) ?? "null",
						by: str.readString(2) ?? "null",
						time: str.readNumber(15)
					})),
					rainbow: (n => n == 0 ? null : {speed: n})(fishPlayerData.readNumber(2)),
					rank: fishPlayerData.readString(2) ?? "",
					flags: fishPlayerData.readArray(str => str.readString(2), 2).filter((s):s is string => s != null),
					usid: fishPlayerData.readString(2)
				}, player);
			case 3:
				//Extremely cursed due to a catastrophic error
				let dataPart1 = {
					uuid: fishPlayerData.readString(2) ?? (() => {throw new Error("Failed to deserialize FishPlayer: UUID was null.")})(),
					name: fishPlayerData.readString(2) ?? "Unnamed player [ERROR]",
					muted: fishPlayerData.readBool(),
					autoflagged: fishPlayerData.readBool()
				};
				let unmarkTime;
				try {
					unmarkTime = fishPlayerData.readNumber(13)
				} catch(err){
					Log.warn(`Invalid stored unmark time: (${(<Error>err).message.split(": ")[1]}) Attempting repair...`);
					fishPlayerData.offset -= 13;
					const chars = fishPlayerData.read(24);
					if(chars !== dataPart1.uuid) throw new Error(`Unable to repair data: next 24 chars ${chars} were not equal to uuid ${dataPart1.uuid}`);
					Log.warn(`Repaired stored data for ${chars}.`);
					unmarkTime = -1; //the data is lost, set as default
				}
				return new this({
					...dataPart1,
					unmarkTime,
					highlight: fishPlayerData.readString(2),
					history: fishPlayerData.readArray(str => ({
						action: str.readString(2) ?? "null",
						by: str.readString(2) ?? "null",
						time: str.readNumber(15)
					})),
					rainbow: (n => n == 0 ? null : {speed: n})(fishPlayerData.readNumber(2)),
					rank: fishPlayerData.readString(2) ?? "",
					flags: fishPlayerData.readArray(str => str.readString(2), 2).filter((s):s is string => s != null),
					usid: fishPlayerData.readString(2)
				}, player);
			case 4:
				return new this({
					uuid: fishPlayerData.readString(2) ?? (() => {throw new Error("Failed to deserialize FishPlayer: UUID was null.")})(),
					name: fishPlayerData.readString(2) ?? "Unnamed player [ERROR]",
					muted: fishPlayerData.readBool(),
					autoflagged: fishPlayerData.readBool(),
					unmarkTime: fishPlayerData.readNumber(13),
					highlight: fishPlayerData.readString(2),
					history: fishPlayerData.readArray(str => ({
						action: str.readString(2) ?? "null",
						by: str.readString(2) ?? "null",
						time: str.readNumber(15)
					})),
					rainbow: (n => n == 0 ? null : {speed: n})(fishPlayerData.readNumber(2)),
					rank: fishPlayerData.readString(2) ?? "",
					flags: fishPlayerData.readArray(str => str.readString(2), 2).filter((s):s is string => s != null),
					usid: fishPlayerData.readString(2)
				}, player);
			default: throw new Error(`Unknown save version ${version}`);
		}
	}
	write(out:StringIO){
		if(typeof this.unmarkTime === "string") this.unmarkTime = 0;
		out.writeString(this.uuid, 2);
		out.writeString(this.name, 2, true);
		out.writeBool(this.muted);
		out.writeBool(this.autoflagged);
		out.writeNumber(this.unmarkTime, 13);// this will stop working in 2286!
		out.writeString(this.highlight, 2, true);
		out.writeArray(this.history, (i, str) => {
			str.writeString(i.action, 2);
			str.writeString(i.by.slice(0, 98), 2, true);
			str.writeNumber(i.time, 15);
		});
		out.writeNumber(this.rainbow?.speed ?? 0, 2);
		out.writeString(this.rank.name, 2);
		out.writeArray(Array.from(this.flags).filter(f => f.peristent), (f, str) => str.writeString(f.name, 2), 2);
		out.writeString(this.usid, 2);
	}
	/**Saves cached FishPlayers to JSON in Core.settings. */
	static saveAll(){
		let out = new StringIO();
		out.writeNumber(this.saveVersion, 2);
		out.writeArray(
			Object.entries(this.cachedPlayers)
				.filter(([uuid, fishP]) => fishP.shouldCache()),
			([uuid, player]) => player.write(out)
		);
		Core.settings.put('fish', out.string);
		Core.settings.manualSave();
	}
	shouldCache(){
		return (this.rank != Rank.new && this.rank != Rank.player) || this.muted || (this.flags.size > 0);
	}
	/**Loads cached FishPlayers from JSON in Core.settings. */
	static loadAll(string = Core.settings.get('fish', '')){
		try {
			if(string == "") return; //If it's empty, don't try to load anything
			if(string.startsWith("{")) return this.loadAllLegacy(string);
			const out = new StringIO(string);
			const version = out.readNumber(2);
			out.readArray(str => FishPlayer.read(version, str, null))
				.forEach(p => this.cachedPlayers[p.uuid] = p);
			out.expectEOF();
		} catch(err){
			Log.err(`[CRITICAL] FAILED TO LOAD CACHED FISH PLAYER DATA`);
			Log.err(err as any);
			Log.err("=============================");
			Log.err(string);
			Log.err("=============================");
		}
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
	hasPerm(perm:PermType){
		return Perm[perm].check(this);
	}
	unit():Unit {
		return this.player.unit();
	}
	team():Team {
		return this.player.team();
	}
	get con():NetConnection {
		return this.player?.con;
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
	setFlag(flag_:RoleFlag | string, value:boolean){
		const flag = flag_ instanceof RoleFlag ? flag_ : RoleFlag.getByName(flag_);
		if(flag){
			if(value){
				this.flags.add(flag);
			} else {
				this.flags.delete(flag);
			}
			this.updateName();
		}
	}
	hasFlag(flagName:string){
		const flag = RoleFlag.getByName(flagName);
		if(flag) return this.flags.has(flag);
		else return false;
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

	marked():boolean {
		return this.unmarkTime > Date.now();
	}
	stelled():boolean {
		return this.marked() || this.autoflagged;
	}
	stop(by:FishPlayer | "api" | "vpn", time:number){
		this.unmarkTime = Date.now() + time;
		if(by instanceof FishPlayer){
			this.addHistoryEntry({
				action: 'stopped',
				by: by.name,
				time: Date.now(),
			});
			api.addStopped(this.uuid, this.unmarkTime);
		} else if(by === "vpn"){
			this.addHistoryEntry({
				action: 'stopped',
				by,
				time: Date.now(),
			});
		}
		if(!this.connected()) return;
		this.stopUnit();
		this.updateName();
		this.sendMessage("[scarlet]Oopsy Whoopsie! You've been stopped, and marked as a griefer.");
		FishPlayer.saveAll();

		//Set unmark timer
		let oldUnmarkTime = this.unmarkTime;
		Timer.schedule(() => {
			//Use of this is safe because arrow functions do not create a new this context
			if(this.unmarkTime === oldUnmarkTime){
				//Only run the code if the unmark time hasn't changed
				this.forceRespawn();
				this.updateName();
				this.sendMessage("[yellow]Your mark has automatically expired.");
			}
		}, time / 1000);
	}
	free(by:FishPlayer | "api"){
		if(!this.marked()) return;

		this.autoflagged = false; //Might as well set autoflagged to false
		this.unmarkTime = -1;
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
	freeze(){
		this.frozen = true;
		this.sendMessage("You have been temporarily frozen.");
	}
	unfreeze(){
		this.frozen = false;
	}
	mute(by:FishPlayer | "api" | "vpn"){
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
		} else if(by === "vpn"){
			this.addHistoryEntry({
				action: 'muted',
				by: by,
				time: Date.now(),
			});
		}
		FishPlayer.saveAll();
	}
	unmute(by:FishPlayer | "api" | "vpn"){
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
				this.unit().health = UnitTypes.stell.health;
				this.unit().apply(StatusEffects.disarmed, Number.MAX_SAFE_INTEGER);
			} else {
				this.forceRespawn();
				//This will cause FishPlayer.onRespawn to run, calling this function again, but then the player will be in a core unit, which can be safely stell'd
			}
		}
	}

	/**
	 * Sends a message to staff only.
	 * @returns if the message was received by anyone.
	 */
	static messageStaff(senderName:string, message:string):boolean;
	static messageStaff(senderName:string):boolean;
	static messageStaff(arg1:string, arg2?:string):boolean {
		const message = arg2 ? `[gray]<[cyan]staff[gray]>[white]${arg1}[green]: [cyan]${arg2}` : arg1;
		let messageReceived = false;
		Groups.player.each(pl => {
			const fishP = FishPlayer.get(pl);
			if(fishP.ranksAtLeast(Rank.mod)){
				pl.sendMessage(message);
				messageReceived = true;
			}
		});
		return messageReceived;
	}
	/**
	 * Sends a message to muted players only.
	 * @returns if the message was received by anyone.
	 */
	static messageMuted(senderName:string, message:string):boolean;
	static messageMuted(senderName:string):boolean;
	static messageMuted(arg1:string, arg2?:string):boolean {
		const message = arg2 ? `[gray]<[red]muted[gray]>[white]${arg1}[coral]: [lightgray]${arg2}` : arg1;
		let messageReceived = false;
		Groups.player.each(pl => {
			const fishP = FishPlayer.get(pl);
			if(fishP.hasPerm("seeMutedMessages")){
				pl.sendMessage(message);
				messageReceived = true;
			}
		});
		return messageReceived;
	}

	//#endregion

}

