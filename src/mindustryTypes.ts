
/*
Copyright © BalaM314, 2024. All Rights Reserved.
This file contains TypeScript type definitions for Mindustry's code.
Mindustry is written in Java, which has strong types.
Mindustry supports loading Javascript, which does not have types.
Javascript will have access to Mindustry's functions, which have types.
We are writing Typescript, which does have types. We are able to call Mindustry's functions, but because those are written in Java we cannot directly use those types.
This file contains some of those type definitions, ported over from the Java definitions.
*/
//this is fine

declare global {

/** Helper function to produce an arc.func.Floatf from a rhino function. */
function floatf<T>(input:T):T;

const Call: any;
const Log: {
	debug(message:string):void;
	info(message:string):void;
	warn(message:string):void;
	err(message:string):void;
	err(error:unknown):void;
};
const Strings: {
	stripColors(string:string):string;
	sanitizeFilename(name:string):string;
};
const NetServer: {
	kickDuration: number;
};
const Vars: {
	logic: {
		skipWave():void;
	}
	netServer: {
		admins: Administration;
		clientCommands: CommandHandler;
		kickAll(kickReason:any):void;
		addPacketHandler(name:string, handler:(player:mindustryPlayer, content:string) => unknown):void;
		currentlyKicking: VoteSession | null;
		votesRequired():number;
	}
	net: {
		send(object:any, reliable:boolean):void;
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
			waitEnemies:boolean;
			env:number;
		}
		set(state:State):void;
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
	customMapDirectory: Fi;
	content: Content;
	tilesize: 8;
	world: World;
};
class State {
	static paused: State;
	static playing: State;
	static menu: State;
}
type Scripts = any;
type CommandHandler = any;
const CommandHandler: CommandHandler;
type Content = {
	items(): Seq<Item>;
	units(): Seq<UnitType>;
	blocks(): Seq<Block>;
};
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
	valid(map:MMap):boolean;
}
type Throwable = any;
class Administration {
	dosBlacklist: ObjectSet<string>;
	kickedIPs: ObjectMap<string, number>;
	subnetBans: Seq<string>;
	findByName(info:string):ObjectSet<PlayerInfo>;
	searchNames(name:string):ObjectSet<PlayerInfo>;
	getInfo(uuid:string):PlayerInfo;
	getInfoOptional(uuid:string):PlayerInfo | null;
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
const Events: {
	on(event:EventType, handler:(e:any) => void):void;
	fire(event:MEvent):void;
}
type MEvent = any;
class Tile {
	x:number; y:number;
	build: Building | null;
	breakable():boolean;
	block():Block;
	removeNet():void;
	setNet(block:Block, team:Team, rotation:number):void;
	getLinkedTiles(callback:(t:Tile) => void):void;
}
const Menus: {
	registerMenu(listener:BuiltinMenuListener):number;
}
type BuiltinMenuListener = (player:mindustryPlayer, option:number) => unknown;
const UnitTypes: {
	[index:string]: UnitType;
}
const Sounds: {
	[index:string]: Sound;
}
type Sound = any;
const Blocks: {
	[index:string]: Block;
}
class Block {
	name: string;
	buildType: Building;
	id: number;
	localizedName: string;
}
type Building = any;
const Items: Record<string, Item>;
class Item {
	name: string;
}
class Team {
	static derelict:Team;
	static sharded:Team;
	static crux:Team;
	static malis:Team;
	static green:Team;
	static blue:Team;
	static all:Team[];
	static baseTeams:Team[];
	name:string;
	active():boolean;
	data():TeamData;
	coloredName():string;
	id:number;
	static get(index:number):Team;
	cores(): Seq<Building>;
	coloredName():string;
}
type TeamData = {
	units: Seq<Unit>;
	buildings: Seq<Building>;
	cores: Seq<Building>;
	countType(type:UnitType):number;
};
const Units: {
	getCap(team:Team):number;
};
const StatusEffects: {
	[index:string]: StatusEffect;
}
type StatusEffect = any;
const Fx: {
	[index:string]: Effect;
}
type Effect = any;
const Align: {
	[index:string]: any;
}
const Groups: {
	player: EntityGroup<mindustryPlayer>;
	unit: EntityGroup<Unit>;
	fire: EntityGroup<Fire>;
	build: EntityGroup<Building>;
}
type Fire = any;
class Vec2 {
	constructor(x:number, y:number);
	set(v:Vec2):Vec2;
	set(x:number, y:number):Vec2;
}
/* mindustry.gen.Player */
class Player {
	id:number;
	name:string;
	admin:boolean;
	x:number; y:number;
	con:NetConnection;
	mouseX:number; mouseY:number;
	shooting:boolean;
	ip():string;
	kick(kickReason?:KickReason | string, duration?:number):void;
	uuid():string;
	usid():string;
	sendMessage(message:string):void;
	unit():Unit;
	unit(unit:Unit):void;
	team():Team;
	team(team:Team):void;
	dead():boolean;
	clearUnit():void;
	checkSpawn():void;
	getInfo():PlayerInfo;
}
type mindustryPlayer = Player;
class Color {
	constructor();
	constructor(rgba8888:number);
	constructor(r:number, g:number, b:number);
	constructor(r:number, g:number, b:number, a:number);
	constructor(color:Color);
	static white: Color; static lightGray: Color; static gray: Color; static darkGray: Color; static black: Color; static clear: Color; static blue: Color; static navy: Color; static royal: Color; static slate: Color; static sky: Color; static cyan: Color; static teal: Color; static green: Color; static acid: Color; static lime: Color; static forest: Color; static olive: Color; static yellow: Color; static gold: Color; static goldenrod: Color; static orange: Color; static brown: Color; static tan: Color; static brick: Color; static red: Color; static scarlet: Color; static crimson: Color; static coral: Color; static salmon: Color; static pink: Color; static magenta: Color; static purple: Color; static violet: Color; static maroon: Color;
	static valueOf(string:string):Color;
	static valueOf(color:Color, hex:string):Color;
	static HSVtoRGB(hue:number, saturation:number, value:number):Color;
	rand():Color;
}
const Core: {
	settings: {
		get<T = unknown>(key:string, defaultValue?:T):T;
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
		getDeltaTime():number;
	}
}
const Mathf: {
	halfPi: number;
	PI2: number;

	ceil(val:number):number;
	round(val:number, step?:number):number;
	len(x:number, y:number):number;
	atan2(x:number, y:number):number;
}
const SaveIO: {
	save(file:Fi):void;
}
const Timer: {
	schedule(func:() => unknown, delaySeconds:number, intervalSeconds?:number, repeatCount?:number):TimerTask;
}
class TimerTask {
	cancel():void;
}
const Time: {
	millis(): number;
	setDeltaProvider(provider: () => number):void;
}
const GameState: {
	State: Record<"playing" | "paused", any>;
}
class HttpRequest {
	submit(func:(response:HttpResponse) => void):void;
	error(func:(exception:any) => void):void;
	header(name:string, value:string):HttpRequest;
	timeout: number;
}
class HttpResponse {
	getResultAsString():string;
	getResultAsStream():InputStream
	getResult():number[];
}
class InputStream {
	close():void;
	transferTo(outputsteam:OutputStream):number;

}
class OutputStream {
	close():void;
}
const Http: {
	post(url:string, content:string):HttpRequest;
	get(url:string):HttpRequest;
	get(url:string, callback:(res:HttpResponse) => unknown, error:(err:any) => unknown):void;
}
class Seq<T> {
	items: (T | null)[];
	size: number;
	constructor();
	constructor(capacity:number);
	static with<T>(...items:T[]):Seq<T>;
	static with<T>(items:Iterable<T>):Seq<T>;
	add(item:T):this;
	contains(item:T):boolean;
	contains(pred:(item:T) => boolean):boolean;
	count(pred:(item:T) => boolean):number;
	/** @deprecated Use select() or retainAll() */
	filter(pred:(item:T) => boolean):Seq<T>;
	retainAll(pred:(item:T) => boolean):Seq<T>;
	/** @returns whether an item was removed */
	remove(pred:(item:T) => boolean):boolean;
	/** @returns whether any item was removed */
	removeAll(pred:(item:T) => boolean):boolean;
	select(pred:(item:T) => boolean):Seq<T>;
	find(pred:(item:T) => boolean):T;
	each(func:(item:T) => unknown):void;
	each(pred:(item:T) => boolean, func:(item:T) => unknown):void;
	isEmpty():boolean;
	map<R>(mapFunc:(item:T) => R):Seq<R>;
	toString(separator?:string, stringifier?:(item:T) => string):string;
	toArray():T[];
	copy():Seq<T>;
	sort(comparator?:(item:T) => number):Seq<T>;
	max(comparator?:(item:T) => number):T;
	random():T | null;
	get(index:number):T;
	first():T;
	firstOpt():T | null;
	clear():void;
}

class ObjectSet<T> {
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
class ObjectMap<K, V> {
	put(key:K, value:V):void;
	get(key:K):V;
	remove(key:K):V | null;
	clear():void;
	size:number;
	entries(): unknown;
}
class ObjectIntMap<K> {
	put(key:K, value:number):void;
	get(key:K):number;
	increment(key:K):void;
	clear():void;
	size:number;
	entries(): {
		toArray():Seq<ObjectIntMapEntry<K>>;
	};
}
class ObjectIntMapEntry<K> {
	key:K;
	value:number;
}
class EntityGroup<T> {
	add(type:T):void
	copy(seq:Seq<T>):Seq<T>;
	each(func:(item:T) => unknown):void;
	each(predicate:(item:T) => boolean, func:(item:T) => unknown):void;
	getByID(id:number):T;
	isEmpty():boolean;
	size():number;
	contains(pred:(item:T) => boolean):boolean;
	find(pred:(item:T) => boolean):T;
	first():T;
	index(index:number):T;
	clear():void;
	//iterator():Iterator<T>
}

function importPackage(package:any):void;
const Packages: Record<string, any>;
const EventType: Record<string, EventType>;
type EventType = any;
interface PlayerAction {
	player:mindustryPlayer;
	type:ActionType;
	tile:Tile | null;
}
type ActionType = any;
const ActionType:Record<string, ActionType>;
type Unit = any;
type NetConnection = any;
class Command {
	text:string;
	paramText:string;
	description:string;
	params:any[];
}

/** java.io.File */
class JavaFile {
	path: string;
}
class Fi {
	constructor(path:string);
	file(): JavaFile;
	child(path:string): Fi;
	exists(): boolean;
	absolutePath():string;
	writeBytes(bytes:number[], append?:boolean):void;
	static tempFile(prefix:string):Fi;
	delete():boolean;
	length():number;
	lastModified():number;
	write():OutputStream;
	list():Fi[];
	name():string;
	readBytes():number[];
}

class Pattern {
	static matches(regex:string, target:string):boolean;
	static compile(regex:string):Pattern;
	matcher(input:string):Matcher;
}
class Matcher {
	replaceAll(replacement:string):string;
	matches():boolean;
	group(index:number):string;
}
class Runtime {
	static getRuntime():Runtime;
	exec(command:string, envp:string[] | null, dir:JavaFile):Process;
}
class ProcessBuilder {
	constructor(...args:string[]);
	directory(file?:JavaFile):ProcessBuilder;
	redirectErrorStream(value:boolean):ProcessBuilder;
	redirectOutput(value:any):ProcessBuilder;
	start():Process;

	static Redirect: {
		PIPE: any;
		INHERIT: any;
	}
}
class Process {
	waitFor():void;
	exitValue():number;
}

const Packets: {
	KickReason: Record<"kick" | "clientOutdated" | "serverOutdated" | "banned" | "gameover" | "recentKick" | "nameInUse" | "idInUse" | "nameEmpty" | "customClient" | "serverClose" | "vote" | "typeMismatch" | "whitelist" | "playerLimit" | "serverRestarting", KickReason>;
};
type KickReason = { quiet: boolean };

class ConstructBlock {
	static ConstructBuild: any;
}
class CoreBlock {

}
const Prop: any;

function print(message:string):void;

class PlayerInfo {
	/** uuid */
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

class UnitType {
	spawn(team:Team, x:number, y:number):Unit;
	create(team:Team):Unit;
	supportsEnv(env:number):boolean;
	health: number;
	hidden: boolean;
	internal: boolean;
	name: string;
	localizedName: string;
}
class MissileUnitType extends UnitType {}
class LogicAI {
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
class Maps {
	setNextMapOverride(map:MMap):void;
	all():Seq<MMap>;
	customMaps():Seq<MMap>;
	byName(name:string):MMap | null;
	reload():void;
	saveMap(baseTags:MapTags):MMap;
}
class MMap {
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

class Sort {
	static instance():Sort;
	sort(input:Seq<unknown> | unknown[]):void;
	sort(input:Seq<unknown> | unknown[], fromIndex:number, toIndex:number):void;
}
class ServerControl {
	static instance: ServerControl;
	handler: CommandHandler;
}

class VoteSession {
	private target: mindustryPlayer;
	private task: TimerTask;
	private voted: ObjectIntMap<string>;
	private votes: number;
}

interface Array<T> {
	filter(predicate: BooleanConstructor, thisArg?: any): (T extends (false | 0 | "" | null | undefined) ? never : T)[];
}
interface ObjectConstructor {
	entries<const K extends PropertyKey, V>(input:Record<K, V>):[K, V][];
	fromEntries<const K extends PropertyKey, V>(input:[K, V][]):Record<K, V>;
}

const Threads: {
	daemon(callback:() => unknown):void;
}
const Tmp: {
	//not full
	v1:Vec2;
	v2:Vec2;
	v3:Vec2;
	v4:Vec2;
	v5:Vec2;
	v6:Vec2;
	
	v31:Vec2;
	v32:Vec2;
	v33:Vec2;
	v34:Vec2;

	c1:Color;
	c2:Color;
	c3:Color;
	c4:Color;
}
class EffectCallPacket2 {
	effect:Effect;
	x:number;
	y:number;
	rotation:number;
	color:Color;
	data:any;
}
class LabelReliableCallPacket {
	message:string;
	duration:number;
	worldx:number;
	worldy:number;
}

type ByteBuffer = {
	put(bytes:number[]):void;
	flip():void;
};
type MessageDigest = {
	update(buffer:ByteBuffer):void;
	digest():number[];
};

/** java.nio.file.Paths */
const Paths: {
	get(path:string):Path;
};
/** java.nio.file.Path */
type Path = {
	toRealPath():Path;
	getParent():Path;
}

}