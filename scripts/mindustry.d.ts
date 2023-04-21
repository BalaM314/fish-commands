
declare const Call: any;
declare const Log: {
	debug(message:string);
	info(message:string);
	warn(message:string);
	err(message:string);
};
declare const Strings: {
	stripColors(string:string): string;
}
declare const Vars: any;
declare const Events: {
	on(event:EventType, handler:(e:any) => void);
}
declare type Tile = any;
declare const ServerLoadEvent: any;
declare const Menus: {
	registerMenu(listener:MenuListener):number;
}
type MenuListener = (player:Player, option:number) => unknown;
declare const UnitTypes: {
	[index:string]: UnitType;
}
type UnitType = any;
declare const Sounds: {
	[index:string]: Sound;
}
type Sound = any;
declare const Blocks: {
	[index:string]: Block;
}
type Block = any;
declare class Team {
	static derelict:Team;
	static sharded:Team;
	static crux:Team;
	static malis:Team;
	static green:Team;
	static blue:Team;
}
type Team = any;
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
declare const Groups: any;
declare class Vec2 {
	constructor(x:number, y:number);
}
/* mindustry.gen.Player */
declare type mindustryPlayer = any;
declare class Color {
	static [index:string]: Color;
	constructor();
	constructor(rgba8888:number);
	constructor(r:number, g:number, b:number);
	constructor(r:number, g:number, b:number, a:number);
	constructor(color:Color);
	static valueOf(string:string):Color;
}
declare const Core: {
	settings: {
		get(key:string, defaultValue?:any):any;
		put(key:string, value:any):void;
		remove(key:string):void;
		manualSave():void;
	}
	app: {
		post(func:() => unknown):void;
		exit():void;
		listeners: any[];
	}
}
declare const SaveIO: {
	save(name:string):void;
}
declare const Timer: {
	schedule(func:() => unknown, delaySeconds:number, intervalSeconds?:number, repeatCount?:number);
}
declare const Time: {
	millis(): number;
}
declare const GameState: {
	State: Record<"playing" | "paused", any>;
}
declare class HttpRequest {
	submit(func:(response:HttpResponse, exception:any) => void):void;
	header(name:string, value:string):HttpRequest;
	timeout: number;
}
declare class HttpReponse {
	getResultAsString():string;
}
declare const Http: {
	post(url:string, content:string):HttpRequest;
	get(url:string):HttpRequest;
}
declare class ObjectSet<T> {
	size:number;
	select(predicate:(item:T) => boolean):ObjectSet<T>;
	each(func:(item:T) => unknown);
	add(item:T):boolean;
	remove(item:T):boolean;
	isEmpty():boolean;
	contains(item:T):boolean;
	get(key:T):T;
	first():T;
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

declare class Pattern {
	static matches(regex:string, target:string):boolean;
}
declare const Packets: {
	KickReason: any;
};

declare function print(message:string):void;