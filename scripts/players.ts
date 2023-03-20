import type { FishPlayerData, mindustryPlayer, mindustryPlayerData, PlayerHistoryEntry } from "./types";

const config = require('config');
const stopped = require('stopped');
const utils = require('utils');

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
  } | undefined = undefined;

  //Stored data
  name: string;
	muted: boolean;
	mod: boolean;
	admin: boolean;
	member: boolean;
	stopped: boolean;
	/*rank: Rank*/
	highlight: string | null;
  rainbow: {
    speed: number;
  } | null;
	history: PlayerHistoryEntry[];
  constructor({
    name, muted = false, mod = false,
    admin = false, member = false, stopped = false,
    highlight = null, history = [], rainbow = null
  }:Partial<FishPlayerData>, player:mindustryPlayer | null){
    this.name = name ?? player.name ?? "Unnamed player [ERROR]";
    this.muted = muted;
    this.mod = mod;
    this.admin = admin;
    this.member = member;
    this.stopped = stopped;
    this.highlight = highlight;
    this.history = history;
    this.player = player;
    this.rainbow = rainbow;
  }
  static read(fishPlayerData:string, player:mindustryPlayer | null){
    return new this(JSON.parse(fishPlayerData), player);
  }
  static createFromPlayer(player:mindustryPlayer){
    return new this({
      name: player.name,
      muted: false,
      mod: false,
      admin: false,
      member: false,
      stopped: false,
      highlight: null,
      history: []
    }, player);
  }
  static createFromInfo(playerInfo:mindustryPlayerData){
    return new this({
      name: playerInfo.lastName,
      muted: false,
      mod: false,
      admin: false,
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
  static getByName(name:string):FishPlayer {
    const realPlayer = Groups.player.find((p:mindustryPlayer) => {
      return p.name === name ||
        p.name.includes(name) ||
        p.name.toLowerCase().includes(name.toLowerCase()) ||
        Strings.stripColors(p.name).toLowerCase() === name.toLowerCase() ||
        Strings.stripColors(p.name).toLowerCase().includes(name.toLowerCase()) ||
        false;
    });
    return this.get(realPlayer);
  };
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
  }
  write():string {
    return JSON.stringify({
      name: this.name,
      muted: this.muted,
      mod: this.mod,
      admin: this.admin,
      member: this.member,
      stopped: this.stopped,
      highlight: this.highlight,
      history: this.history
    });
  }
  /**Must be called at player join, before updateName(). */
  updateSavedInfoFromPlayer(player:mindustryPlayer){
    this.player = player;
    this.name = player.name;
    //this.cleanedName = Strings.stripColors(player.name);
  }
  updateName(){
    if(this.player == null) return;//No player, no need to update
    let prefix = '';
    if (this.stopped) {
      prefix += config.STOPPED_PREFIX;
    }
    if (this.muted) {
      prefix += config.MUTED_PREFIX;
    }
    if (this.afk) {
      prefix += config.AFK_PREFIX;
    }
    if (this.member) {
      prefix += config.MEMBER_PREFIX;
    }

    if (this.admin) {
      prefix += config.ADMIN_PREFIX;
    } else if (this.mod) {
      prefix += config.MOD_PREFIX;
    }
    this.player!.name = prefix + this.name;
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
    this.player.unit().type = UnitTypes.stell;
    this.updateName();
    this.player.sendMessage("[scarlet]Oopsy Whoopsie! You've been stopped, and marked as a griefer.");
    if(typeof by == "object"){
      this.addHistoryEntry({
        action: 'stopped',
        by: by.name,
        time: Date.now(),
      });
      stopped.addStopped(this.player.uuid());
    }
    FishPlayer.saveAll();
  }
  free(by:FishPlayer | "api"){
    if(!this.stopped) return;
    this.stopped = false;
    this.player.unit().type = UnitTypes.alpha;
    this.updateName();
    this.player.sendMessage('[yellow]Looks like someone had mercy on you.');
    if(typeof by == "object"){
      this.addHistoryEntry({
        action: 'freed',
        by: by.name,
        time: Date.now(),
      });
      stopped.free(this.player.uuid());
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
      if(player.admin || player.mod || player.member)
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

// Load saved players
Events.on(ServerLoadEvent, (e) => {
  FishPlayer.loadAll();
});