import type { CommandArgType, Perm } from "./commands";
import type { FishPlayer } from "./players";
import type { Rank, RoleFlag } from "./ranks";

export type SelectClasslikeEnumKeys<C extends Function,
	Key extends keyof C = keyof C
> = Key extends unknown ? ( //trigger DCT
	C[Key] extends C["prototype"] ? //if C[Key] is a C
		Key extends "prototype" ? never : Key //and Key is not the string "prototype", return it
	: never
) : never;

export type FishCommandArgType = string | number | FishPlayer | Team | boolean | null | UnitType | Block | MMap;
export type MenuListener = (player:mindustryPlayer, option:number) => void;

/** Returns the type for an arg type string. Example: returns `number` for "time". */
export type TypeOfArgType<T> =
	T extends "string" ? string :
	T extends "boolean" ? boolean :
	T extends "number" ? number :
	T extends "time" ? number :
	T extends "team" ? Team :
	T extends "player" ? FishPlayer :
	T extends "exactPlayer" ? FishPlayer :
	T extends "offlinePlayer" ? FishPlayer :
	T extends "unittype" ? UnitType :
	T extends "block" ? Block :
	T extends "uuid" ? string :
	T extends "map" ? MMap :
	never;

//TLDR: Yeet U through a wormhole, then back through the same wormhole, and it comes out the other side as an intersection type
export type UnionToIntersection<U> = (
	(
		//(U extends any) triggers the distributive conditional type behavior
		//The conditional type is distributed across the members of the union
		//so this makes `Cons<U1> | Cons<U2> | Cons<U3>`
		U extends any ? (_: U) => void : never
		//Then when infer is used to extract the parameter of Cons, it must be something that satisfies all the function types
		//which is an intersection of the types
	) extends (_: infer I) => void ? I : never
) extends infer O ? {[K in keyof O] : O[K]} : never; //This doesn't change the actual type, but makes vscode display it nicely

/**
 * Returns the type of args given a union of the arg string types.
 * Example: given `"player:player?" | "force:boolean"` returns `{player: FishPlayer | null; force: boolean;}`
 **/
export type ArgsFromArgStringUnion<ArgStringUnion extends string> =
	[ArgStringUnion] extends [never] ? Record<string, any> : //If any was passed, return Record<string, any>
	0 extends (1 & ArgStringUnion) ? Record<string, any> : //If any was passed, return Record<string, any>
	UnionToIntersection<ObjectTypeFor<ArgStringUnion>>;
//Typescript distributes the generic across the union type, producing a union of all the objects types, then we convert the union to an intersection

export type ObjectTypeFor<ArgString> =
	ArgString extends `${string}?` //Check if it's optional
	//It is optional
	? ArgString extends `${infer N}:${infer T}?` //Use inferred template literal types to extract the name into N and the type string into T
		? {[_ in N]: TypeOfArgType<T> | null} : never //Make an object, using TypeOfArgType to turn "player" into FishPlayer
	//It isn't optional
	: ArgString extends `${infer N}:${infer T}` //Same as above, but without the `| null`
		? {[_ in N]: TypeOfArgType<T>} : never;

export type TapHandleMode = "off" | "once" | "on";

export type Formattable = FishPlayer | Rank | RoleFlag | Error | mindustryPlayer | string | boolean | number | mindustryPlayerData | UnitType | Block;
export type PartialFormatString = (data:string | null) => string;
export interface FishCommandRunner<ArgType extends string, StoredData> {
	(_:{
		/**Raw arguments that were passed to the command. */
		rawArgs:(string | undefined)[];
		/**Formatted and parsed args. Access an argument by name, like python's keyword args. Example: `args.player.setRank(Rank.mod);`. An argument can only be null if it was optional, otherwise the command will error before the handler runs. */
		args:ArgsFromArgStringUnion<ArgType>;
		/**The player who ran the command. */
		sender:FishPlayer;
		outputSuccess:(message:string | PartialFormatString) => void;
		outputFail:(message:string | PartialFormatString) => void;
		output:(message:string | PartialFormatString) => void;
		f:TagFunction<Formattable, PartialFormatString>;
		/**Executes a server console command. Be careful! */
		execServer:(message:string) => void;
		/**Call this function to set tap handling mode. */
		handleTaps:(mode:TapHandleMode) => void;
		data:StoredData;
		currentTapMode:TapHandleMode;
		/** Vars.netServer.admins */
		admins: Administration;
		/**List of every registered command, including this one. */
		allCommands:Record<string, FishCommandData<any, any>>;
		/**Timestamp of the last time this command was run successfully by any player. */
		lastUsedSuccessfully:number;
		/**Timestamp of the last time this command was run by the current sender. */
		lastUsedSender:number;
		/**Timestamp of the last time this command was run succesfully by the current sender. */
		lastUsedSuccessfullySender:number;
	}):unknown;
}

export interface FishConsoleCommandRunner<ArgType extends string, StoredData> {
	(_:{
		/**Raw arguments that were passed to the command. */
		rawArgs:(string | undefined)[];
		/**
		 * Formatted and parsed args.
		 * Access an argument by name, like python's keyword args.
		 * Example: `args.player.mod = true`.
		 * An argument can only be null if it was optional, otherwise the command will error before the handler runs.
		 **/
		args:ArgsFromArgStringUnion<ArgType>;
		data:StoredData;
		outputSuccess:(message:string) => void;
		outputFail:(message:string) => void;
		output:(message:string) => void;
		/**Executes a server console command. Be careful to not commit recursion as that will cause a crash.*/
		execServer:(message:string) => void;
		/** Vars.netServer.admins */
		admins: Administration;
		/**Timestamp of the last time this command was run. */
		lastUsed:number;
		/**Timestamp of the last time this command was run succesfully. */
		lastUsedSuccessfully:number;
	}): unknown;
}

export interface TapHandler<ArgType extends string, StoredData> {
	(_:{
		/**Last args used to call the parent command. **/
		args:ArgsFromArgStringUnion<ArgType>;
		sender:FishPlayer;
		x:number;
		y:number;
		tile:Tile;
		data:StoredData;
		output:(message:string) => void;
		outputFail:(message:string) => void;
		outputSuccess:(message:string) => void;
		/**Timestamp of the last time this command was run. */
		commandLastUsed:number;
		/**Timestamp of the last time this command was run succesfully. */
		commandLastUsedSuccessfully:number;
		/** Vars.netServer.admins */
		admins: Administration;
		/**Timestamp of the last time this tap handler was run. */
		lastUsed:number;
		/**Timestamp of the last time this tap handler was run succesfully. (without fail() being called) */
		lastUsedSuccessfully:number;
	}):unknown;
}

export interface FishCommandData<ArgType extends string, StoredData> {
	/**Args for this command, like ["player:player", "reason:string?"] */
	args: ArgType[];
	description: string;
	/**
	 * Permission level required for players to run this command.
	 * If the player does not have this permission, the handler is not run and an error message is printed.
	 **/
	perm: Perm;
	/**Custom error message for unauthorized players. The default is `You do not have the required permission (mod) to execute this command`. */
	customUnauthorizedMessage?: string;
	/** Called exactly once at server start. Use this to add event handlers. */
	init?: () => StoredData;
	data?: StoredData;
	handler: FishCommandRunner<ArgType, StoredData>;
	tapped?: TapHandler<ArgType, StoredData>;
	/**If true, this command is hidden and pretends to not exist for players that do not have access to it.. */
	isHidden?: boolean;
}
export interface FishConsoleCommandData<ArgType extends string, StoredData> {
	/**Args for this command, like ["player:player", "reason:string?"] */
	args: ArgType[];
	description: string;
	/** Called exactly once at server start. Use this to add event handlers. */
	init?: () => StoredData;
	data?: StoredData;
	handler: FishConsoleCommandRunner<ArgType, StoredData>;
}


export interface TileHistoryEntry {
	name:string;
	action:string;
	type:string;
	time:number;
}


export interface FishPlayerData {
	uuid: string;
	name: string;
	muted: boolean;
	autoflagged: boolean;
	/**@deprecated */
	member: boolean;
	/**@deprecated */
	stopped: boolean;
	unmarkTime: number;
	rank: string;
	flags: string[];
	highlight: string | null;
	rainbow: { speed:number; } | null;
	history: PlayerHistoryEntry[];
	usid: string | null;
	chatStrictness: "chat" | "strict";
}

export interface PlayerHistoryEntry {
	action:string;
	by:string;
	time:number;
}

export interface ClientCommandHandler {
	register(name:string, args:string, description:string, runner:(args:string[], player:mindustryPlayer) => unknown):void;
	removeCommand(name:string):void;
}

export interface ServerCommandHandler {
	/**Executes a server console command. */
	handleMessage(command:string):void;
	register(name:string, args:string, description:string, runner:(args:string[], player:mindustryPlayer) => unknown):void;
	removeCommand(name:string):void;
}

export interface PreprocessedCommandArg {
	type: CommandArgType;
	/**Whether the argument is optional (and may be null) */
	optional?: boolean;
}

export type PreprocessedCommandArgs = Record<string, PreprocessedCommandArg>;

export interface CommandArg {
	name: string;
	type: CommandArgType;
	isOptional: boolean;
}

export interface FlaggedIPData {
	name: string;
	uuid: string;
	ip: string;
	moderated: boolean;
};

export type Boolf<T> = (input:T) => boolean;

export interface TagFunction<Tin = string, Tout = string> {
	(stringChunks: readonly string[], ...varChunks: readonly Tin[]):Tout;
}
