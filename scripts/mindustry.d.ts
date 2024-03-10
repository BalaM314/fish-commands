//this is fine
//TODO move to `declare global`

declare function floatf<T>(input:T):T;

declare const Call: any;
declare const Log: {
	debug(message:string);
	info(message:string);
	warn(message:string);
	err(message:string);
	err(error:Error);
};
declare const Strings: {
	stripColors(string:string): string;
};
declare const Vars: {
	netServer: {
		admins: Administration;
		clientCommands: CommandHandler;
		kickAll(kickReason:any):void;
		addPacketHandler(name:string, handler:(player:mindustryPlayer, content:string) => unknown):void;
		currentlyKicking: VoteSession | null;
		votesRequired():number;
	}
	mods: {
		getScripts(): Scripts;
	}
	maps: Maps;
	state: {
		rules: {
			mode():Gamemode;
			defaultTeam:Team;
			waveTeam:Team;
			waves:boolean;
		}
		set(state:GameState);
		gameOver:boolean;
		wave:number;
		map: MMap;
		isMenu():boolean;
		wavetime:number;
		enemies:number;
		/** Time in ticks, 60/s */
		tick:number;
	}
	saveExtension: string;
	saveDirectory: Fi;
	modDirectory: Fi;
	content: Content;
	tilesize: 8;
	world: World;
};
declare type CommandHandler = any;
declare const CommandHandler: CommandHandler;
type Content = any;
class World {
	build(x:number, y:number):Building | null;
	tile(x:number, y:number):Tile | null;
	tiles: {
		eachTile(func:(tile:Tile) => unknown):void;
	}
}
class Gamemode {
	static survival:Gamemode;
	static attack:Gamemode;
	static pvp:Gamemode;
	static sandbox:Gamemode;
	static editor:Gamemode;
	name():string;
}
declare type Throwable = any;
declare class Administration {
	findByName(info:string):ObjectSet<PlayerInfo>;
	searchNames(name:string):ObjectSet<PlayerInfo>;
	getInfo(uuid:string):PlayerInfo;
	getInfoOptional(uuid:string):PlayerInfo | null;
	dosBlacklist: ObjectSet<string>;
	findByIP(ip:string):PlayerInfo | null;
	findByIPs(ip:string):Seq<PlayerInfo>;
	isIPBanned(ip:string):boolean;
	isIDBanned(uuid:string):boolean;
	banPlayerIP(ip:string):boolean;
	banPlayerID(uuid:string):boolean;
	banPlayer(uuid:string):boolean;
	unbanPlayerIP(ip:string):boolean;
	unbanPlayerID(uuid:string):boolean;
	adminPlayer(uuid:string, usid:string):boolean;
	unAdminPlayer(uuid:string):boolean;
	blacklistDos(ip:string):void;
	isDosBlacklisted(ip:string):boolean;
	save():void;
	addChatFilter(filter:(player:mindustryPlayer, message:string) => string | null):void;
	addActionFilter(filter:(action:PlayerAction) => boolean):void;
	static ActionType: ActionType;
	static PlayerInfo: typeof PlayerInfo;
}
declare const Events: {
	on(event:EventType, handler:(e:any) => void);
	fire(event:Event);
}
type Event = any;
declare class Tile {
	x:number; y:number;
	build: Building | null;
	breakable():boolean;
	block():Block;
	removeNet():void;
	setNet(block:Block, team:Team, rotation:number):void;
	getLinkedTiles(callback:(t:Tile) => void):void;
}
declare const Menus: {
	registerMenu(listener:MenuListener):number;
}
type MenuListener = (player:Player, option:number) => unknown;
declare const UnitTypes: {
	[index:string]: UnitType;
}
declare const Sounds: {
	[index:string]: Sound;
}
type Sound = any;
declare const Blocks: {
	[index:string]: Block;
}
declare class Block {
	name: string;
	buildType: Building;
	id: number;
	localizedName: string;
}
type Building = any;
declare const Items: Record<string, Item>;
declare class Item {
	
}
declare class Team {
	static derelict:Team;
	static sharded:Team;
	static crux:Team;
	static malis:Team;
	static green:Team;
	static blue:Team;
	static all:Team[];
	static baseTeams:Team[];
	name:string;
	data():TeamData;
	coloredName():string;
	id:number;
}
type TeamData = any;
declare const StatusEffects: {
	[index:string]: StatusEffect;
}
type StatusEffect = any;
declare const Fx: {
	[index:string]: Effect;
}
type Effect = any;
declare const Align: {
	[index:string]: any;
}
declare const Groups: {
	player: EntityGroup<mindustryPlayer>;
	unit: EntityGroup<Unit>;
	fire: EntityGroup<Fire>;
	build: EntityGroup<Building>;
}
type Fire = any;
declare class Vec2 {
	constructor(x:number, y:number);
}
/* mindustry.gen.Player */
declare type mindustryPlayer = any;
declare const Player: mindustryPlayer;
declare class Color {
	static [index:string]: Color;
	constructor();
	constructor(rgba8888:number);
	constructor(r:number, g:number, b:number);
	constructor(r:number, g:number, b:number, a:number);
	constructor(color:Color);
	static valueOf(string:string):Color;
	static HSVtoRGB(hue:number, saturation:number, value:number):Color;
	rand():Color;
}
declare const Core: {
	settings: {
		get(key:string, defaultValue?:any):any;
		getDataDirectory():Fi;
		getInt(key:string, defaultValue?:number):number;
		put(key:string, value:any):void;
		has(key:string):boolean;
		remove(key:string):void;
		manualSave():void;
	}
	app: {
		post(func:() => unknown):void;
		exit():void;
		getJavaHeap():number;
		listeners: any[];
	}
	graphics: {
		getFramesPerSecond():number;
	}
}
declare const Mathf: {
	halfPi: number;
	PI2: number;

	ceil(val:number):number;
	round(val:number, step?:number):number;
	len(x:number, y:number):number;
	atan2(x:number, y:number):number;
}
declare const SaveIO: {
	save(file:Fi):void;
}
declare const Timer: {
	schedule(func:() => unknown, delaySeconds:number, intervalSeconds?:number, repeatCount?:number):TimerTask;
}
declare class TimerTask {
	cancel():void;
}
declare const Time: {
	millis(): number;
}
declare const GameState: {
	State: Record<"playing" | "paused", any>;
}
declare class HttpRequest {
	submit(func:(response:HttpResponse) => void):void;
	error(func:(exception:any) => void):void;
	header(name:string, value:string):HttpRequest;
	timeout: number;
}
declare class HttpResponse {
	getResultAsString():string;
}
declare const Http: {
	post(url:string, content:string):HttpRequest;
	get(url:string):HttpRequest;
	get(url:string, callback:(res:HttpResponse) => unknown, error:(err:any) => unknown):void;
}
type Administration = any;
declare class Seq<T> implements Iterable<T>, ArrayLike<T> {
	items: (T | null)[];
	size: number;
	constructor();
	constructor(capacity:number);
	static with<T>(...items:T[]):Seq<T>;
	static with<T>(items:Iterable<T>):Seq<T>;
	contains(item:T):boolean;
	contains(pred:(item:T) => boolean):boolean;
	count(pred:(item:T) => boolean):number;
	/** @deprecated Use select() or retainAll() */
	filter(pred:(item:T) => boolean):Seq<T>;
	retainAll(pred:(item:T) => boolean):Seq<T>;
	select(pred:(item:T) => boolean):Seq<T>;
	find(pred:(item:T) => boolean):T;
	each(func:(item:T) => unknown);
	isEmpty():boolean;
	map<R>(mapFunc:(item:T) => R):Seq<R>;
	toString(separator:string, stringifier?:(item:T) => string);
	toArray():T[];
	copy():Seq<T>;
	sort(comparator?:(item:T) => number):Seq<T>;
	max(comparator?:(item:T) => number):T;
	random():T | null;
	get(index:number):T | null;
}

declare class ObjectSet<T> {
	size:number;
	select(predicate:(item:T) => boolean):ObjectSet<T>;
	each(func:(item:T) => unknown):void;
	add(item:T):boolean;
	remove(item:T):boolean;
	isEmpty():boolean;
	contains(item:T):boolean;
	get(key:T):T;
	first():T;
}
declare class ObjectIntMap<K> {
	put(key:K, value:number):void;
	get(key:K):number;
	increment(key:K):void;
	clear():void;
	size:number;
	entries(): {
		forEach(func:(item:T) => unknown):void;
		toArray():Seq<ObjectIntMapEntry<K>>;
	};
}
declare class ObjectIntMapEntry<K> {
	key:K;
	value:number;
}
declare class EntityGroup<T> {
	copy(seq:Seq<T>):Seq<T>;
	each(func:(item:T) => unknown):void;
	getByID(id:number):T;
	isEmpty():boolean;
	size():number;
	contains(pred:(item:T) => boolean):boolean;
	find(pred:(item:T) => boolean):T;
	first():T;
	clear():void;
}

declare function importPackage(package:any):void;
declare const Packages: Record<string, any>;
declare const EventType: Record<string, EventType>;
type EventType = any;
interface PlayerAction {
	player:mindustryPlayer;
	type:ActionType;
	tile:Tile | null;
}
type ActionType = any;
declare const ActionType:Record<string, ActionType>;
type Unit = any;
type NetConnection = any;
declare class Command {
	text:string;
	paramText:string;
	description:string;
	params:any[];
}

declare class JavaFile {}
declare class Fi {
	constructor(path:string);
	file(): JavaFile;
	child(path:string): Fi;
	exists(): boolean;
	absolutePath():string;
}

declare class Pattern {
	static matches(regex:string, target:string):boolean;
	static compile(regex:string):Pattern;
	matcher(input:string):Matcher;
}
declare class Matcher {
	replaceAll(replacement:string):string;
	matches():boolean;
	group(index:number):string;
}
declare class Runtime {
	static getRuntime():Runtime;
	exec(command:string, envp:string[] | null, dir:JavaFile):Process;
}
declare class ProcessBuilder {
	constructor(...args:string[]){}
	directory(file?:JavaFile):ProcessBuilder;
	redirectErrorStream(value:boolean):ProcessBuilder;
	redirectOutput(value:any):ProcessBuilder;
	start():Process;

	static Redirect: {
		PIPE: any;
		INHERIT: any;
	}
}
declare class Process {
	waitFor();
	exitValue():number;
}

declare const Packets: {
	KickReason: Record<string, KickReason>;
};
declare class KickReason {
	quiet: boolean;
}

declare class ConstructBlock {
	static ConstructBuild: any;
}
declare const Prop: any;

declare function print(message:string):void;

declare class PlayerInfo {
	/**uuid */
	id: string;
	lastName: string;
	lastIP: string;
	ips: Seq<string>;
	names: Seq<string>;
	adminUsid: string | null;
	timesKicked: number;
	timesJoined: number;
	admin: boolean;
	banned: boolean;
	lastKicked: number;
	plainLastName(): string;
}

declare class UnitType {
	spawn(team:Team, x:number, y:number):Unit;
	create(team:Team):Unit;
	health: number;
	hidden: boolean;
	internal: boolean;
	name: string;
	localizedName: string;
}
declare class MissileUnitType extends UnitType {}
declare class LogicAI {
	controller: Building | null;
}
interface MapTags {
	name:string;
	description?:string;
	author?:string;
	steamid?:string;
	/** JSON rules */
	rules?:string;
	build?:number;
	genfilters?:string;
}
declare class Maps {
	setNextMapOverride(map:MMap);
	all():Seq<MMap>;
	customMaps():Seq<MMap>;
	byName(name:string):MMap | Null;
	reload():void;
	saveMap(baseTags:MapTags):MMap;
}
declare class MMap {
	readonly custom:boolean;
	readonly file:Fi;
	width:number;
	height:number;
	build:number;
	name():string;
	author():string;
	description():string;
	plainName():string;
	plainAuthor():string;
	plainDescription():string;
}

declare class Sort {
	static instance():Sort;
	sort(input:Seq<unknown> | unknown[]);
	sort(input:Seq<unknown> | unknown[], fromIndex:number, toIndex:number);
}
declare class ServerControl {
	static instance: ServerControl;
	handler: CommandHandler;
}

declare class VoteSession {
	private target: mindustryPlayer;
	private task: TimerTask;
	private voted: ObjectIntMap<string>;
	private votes: number;
}
declare const Reflect: {
	get(thing:any, key:string):any;
	set(thing:any, key:string, value:any):void;
}

interface Array<T> {
  filter(predicate: BooleanConstructor, thisArg?: any): (T extends (false | 0 | "" | null | undefined) ? never : T)[];
}
