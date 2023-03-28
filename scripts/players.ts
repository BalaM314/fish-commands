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
  constructor({
    name, muted = false, member = false, stopped = false,
    highlight = null, history = [], rainbow = null, rank = "player"
  }:Partial<FishPlayerData>, player:mindustryPlayer | null){
    this.name = name ?? player.name ?? "Unnamed player [ERROR]";
    this.muted = muted;
    this.member = member;
    this.stopped = stopped;
    this.highlight = highlight;
    this.history = history;
    this.player = player;
    this.rainbow = rainbow;
    this.cleanedName = Strings.stripColors(this.name);
    this.rank = Rank.getByName(rank) ?? Rank.player;
  }
  static read(fishPlayerData:string, player:mindustryPlayer | null){
    return new this(JSON.parse(fishPlayerData), player);
  }
  static createFromPlayer(player:mindustryPlayer){
    return new this({
      name: player.name,
      muted: false,
      member: false,
      stopped: false,
      highlight: null,
      history: [],
    }, player);
  }
  static createFromInfo(playerInfo:mindustryPlayerData){
    return new this({
      name: playerInfo.lastName,
      muted: false,
      member: false,
      stopped: false,
      highlight: null,
      history: []
    }, null);
  }
  static getFromInfo(playerInfo:mindustryPlayerData){
    return this.cachedPlayers[playerInfo.id] ?? this.createFromInfo(playerInfo);
  }
  static get(player:mindustryPlayer){
    return this.cachedPlayers[player.uuid()] ?? this.createFromPlayer(player);
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
  static getAllByName(name:string):FishPlayer[] {
    let players:FishPlayer[] = [];
    //Groups.player doesn't support filter
    Groups.player.each((p:mindustryPlayer) => {
      const fishP = FishPlayer.get(p);
      if(fishP.cleanedName.includes(name)) players.push(fishP);
    });
    return players;
  }
  static onPlayerJoin(player:mindustryPlayer){
    let fishPlayer:FishPlayer;
    if(this.cachedPlayers[player.uuid()]){
      fishPlayer = this.cachedPlayers[player.uuid()];
      fishPlayer.updateSavedInfoFromPlayer(player);
    } else {
      fishPlayer = this.createFromPlayer(player);
    }
    fishPlayer.checkName();
    fishPlayer.updateName();
    api.getStopped(player.uuid(), (stopped) => {
      if(fishPlayer.stopped && !stopped) fishPlayer.free("api");
      if(stopped) fishPlayer.stop("api");
    });
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
      if(player.player && !player.player.con.hasDisconnected) func(player);
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
    });
  }
  /**Must be called at player join, before updateName(). */
  updateSavedInfoFromPlayer(player:mindustryPlayer){
    this.player = player;
    this.name = player.name;
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
    this.player.sendMessage("[scarlet]Oopsy Whoopsie! You've been stopped, and marked as a griefer.");
    if(by instanceof FishPlayer){
      this.addHistoryEntry({
        action: 'stopped',
        by: by.name,
        time: Date.now(),
      });
      api.addStopped(this.player.uuid());
    }
    FishPlayer.saveAll();
  }
  stopUnit(){
    if(isCoreUnitType(this.player.unit().type)){
      this.player.unit().type = UnitTypes.stell;
      this.player.unit().apply(StatusEffects.disarmed, Number.MAX_SAFE_INTEGER);
    } else {
      this.forceRespawn();
      //This will cause FishPlayer.onRespawn to run, calling this function again, but then the player will be in a core unit, which can be safely stell'd
    }
  }
  forceRespawn(){
    this.player.clearUnit();
    this.player.checkSpawn();
  }
  free(by:FishPlayer | "api"){
    if(!this.stopped) return;
    this.stopped = false;
    this.updateName();
    this.forceRespawn();
    if(by instanceof FishPlayer){
      this.player.sendMessage('[yellow]Looks like someone had mercy on you.');
      this.addHistoryEntry({
        action: 'freed',
        by: by.name,
        time: Date.now(),
      });
      api.free(this.player.uuid());
    }
    FishPlayer.saveAll();
  }
  checkName(){
    for(const bannedName of config.bannedNames){
      if(this.name.toLowerCase().includes(bannedName)) {
        this.player.kick(
`[scarlet]"${this.name}[scarlet]" is not an allowed name.

If you are unable to change it, please download Mindustry from Steam or itch.io.`
        );
      }
    }
  }
  static saveAll(){
    //Temporary implementation
    let jsonString = `{`;
    for(const [uuid, player] of Object.entries(this.cachedPlayers)){
      if((player.rank != Rank.player) || player.member)
        jsonString += `"${uuid}":${player.write()}`;
    }
    jsonString += `}`;
    Core.settings.put('fish', jsonString);
    Core.settings.manualSave();
  }
  static loadAll(){
    //Temporary implementation
    const jsonString = Core.settings.get('fish', '');
    if(jsonString == "") return;

    for(let [key, value] of Object.entries(JSON.parse(jsonString))){
      this.cachedPlayers[key] = new this(value as Partial<FishPlayerData>, null);
    }
  }
}
