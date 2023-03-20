
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
	on(event:any, handler:(e:any) => void);
}
declare const ServerLoadEvent: any;
declare const Menus: {
	registerMenu(listener:MenuListener):number;
}
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
declare const Team: {
	[index:string]: Team;
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
declare class Color {

}
declare const Core: {
	settings: {
		get(key:string, defaultValue?:any):any;
		put(key:string, value:any):void;
		manualSave():void;
	}
	app: {
		post(func:() => unknown):void;
		exit():void;
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