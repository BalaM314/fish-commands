/*
Copyright © BalaM314, 2024. All Rights Reserved.
This file contains the commands system.
*/
//Behold, the power of typescript!

import { FColor, Gamemode, GamemodeName, text } from "./config";
import { ipPattern, uuidPattern } from "./globals";
import { menu } from "./menus";
import { FishPlayer } from "./players";
import { Rank, RankName, RoleFlag } from "./ranks";
import type { ClientCommandHandler, CommandArg, FishCommandArgType, FishCommandData, FishCommandHandlerData, FishCommandHandlerUtils, FishConsoleCommandData, Formattable, PartialFormatString, SelectEnumClassKeys, ServerCommandHandler } from "./types";
import { formatModeName, getBlock, getItem, getMap, getTeam, getUnitType, outputConsole, outputFail, outputMessage, outputSuccess, parseTimeString } from "./utils";
import { tagProcessorPartial } from './funcs';
import { parseError } from './funcs';
import { escapeStringColorsClient, escapeStringColorsServer } from './funcs';
import { crash } from './funcs';

const hiddenUnauthorizedMessage = "[scarlet]Unknown command. Check [lightgray]/help[scarlet].";

let initialized = false;

/** Stores all chat comamnds by their name. */
export const allCommands:Record<string, FishCommandData<string, any>> = {};
/** Stores all console commands by their name. */
export const allConsoleCommands:Record<string, FishConsoleCommandData<string, any>> = {};

/** Stores the last usage data for chat commands by their name. */
const globalUsageData:Record<string, {
	lastUsed: number;
	lastUsedSuccessfully: number;
}> = {};

/** All valid command arg types. */
const commandArgTypes = [
	"string", "number", "boolean", "player", /*"menuPlayer",*/ "team", "time", "unittype", "block",
	"uuid", "offlinePlayer", "map", "rank", "roleflag", "item"
] as const;
export type CommandArgType = typeof commandArgTypes extends ReadonlyArray<infer T> ? T : never;


/** Helper function to get the correct type for command lists. */
export const commandList = <A extends Record<string, string>>(list:{
	//Store the mapping between commandname and ArgStringUnion in A
	[K in keyof A]: FishCommandData<A[K], any>;
}):Record<keyof A, FishCommandData<string, any> | (() => FishCommandData<string, any>)> => list;
/** Helper function to get the correct type for command lists. */
export const consoleCommandList = <A extends Record<string, string>>(list:{
	//Store the mapping between commandname and ArgStringUnion in A
	[K in keyof A]: FishConsoleCommandData<A[K], any>;
}):Record<keyof A, FishConsoleCommandData<string, any>> => list;

export function command<TParam extends string, TData>(cmd:FishCommandData<TParam, TData>):FishCommandData<TParam, TData>;
export function command<TParam extends string, TData>(cmd:() => FishCommandData<TParam, TData>):FishCommandData<TParam, TData>;//not type safe, can't be bothered to find a solution that works with commandList
export function command<TParam extends string, TData>(cmd:FishConsoleCommandData<TParam, TData>):FishConsoleCommandData<TParam, TData>;
/**
 * Helper function to get the correct type definitions for commands that use "data" or init().
 * Necessary because, while typescript is capable of inferring A1, A2...
 * ```
 * {
 * 	prop1: Type<A1>;
 * 	prop2: Type<A2>;
 * }
 * ```
 * it cannot handle inferring A1 and B1.
 * ```
 * {
 * 	prop1: Type<A1, B1>;
 * 	prop2: Type<A2, B2>;
 * }
 * ```
 */
export function command(input:unknown){
	return input;
}

/** Represents a permission that is required to do something. */
export class Perm {
	static perms:Partial<Record<string, Perm>> = {};

	static none = new Perm("all", fishP => true, "[sky]");
	static trusted = Perm.fromRank(Rank.trusted);
	static mod = Perm.fromRank(Rank.mod);
	static admin = Perm.fromRank(Rank.admin);
	static member = new Perm("member", fishP => fishP.hasFlag("member") && !fishP.marked(), "[pink]", `You must have a ${FColor.member`Fish Membership`} to use this command. Get a Fish Membership at[sky] ${text.membershipURL} []`);
	static chat = new Perm("chat", fishP => (!fishP.muted && !fishP.autoflagged) || fishP.ranksAtLeast("mod"));
	static bypassChatFilter = new Perm("bypassChatFilter", "admin");
	static seeMutedMessages = new Perm("seeMutedMessages", fishP => fishP.muted || fishP.autoflagged || fishP.ranksAtLeast("mod"));
	static play = new Perm("play", fishP => !fishP.stelled() || fishP.ranksAtLeast("mod"));
	static seeErrorMessages = new Perm("seeErrorMessages", "admin");
	static viewUUIDs = new Perm("viewUUIDs", "admin");
	static blockTrolling = new Perm("blockTrolling", fishP => fishP.rank === Rank.pi);
	static visualEffects = new Perm("visualEffects", fishP => !fishP.stelled() || fishP.ranksAtLeast("mod"));
	static bulkVisualEffects = new Perm("bulkVisualEffects", fishP => (
		(fishP.hasFlag("developer") || fishP.hasFlag("illusionist") || fishP.hasFlag("member")) && !fishP.stelled())
		|| fishP.ranksAtLeast("mod")
	);
	static bypassVoteFreeze = new Perm("bypassVoteFreeze", "trusted");
	static bypassVotekick = new Perm("bypassVotekick", "mod");
	static warn = new Perm("warn", "mod");
	static vanish = new Perm("vanish", "mod");
	static changeTeam = new Perm("changeTeam", "admin").exceptModes({
		sandbox: Perm.trusted,
		attack: Perm.admin,
		hexed: Perm.mod,
		pvp: Perm.trusted,
	});
	/** Whether players should be allowed to change the team of a unit or building. If not, they will be kicked out of their current unit or building before switching teams. */
	static changeTeamExternal = new Perm("changeTeamExternal", "admin").exceptModes({
		sandbox: Perm.trusted,
	});
	static usidCheck = new Perm("usidCheck", "trusted");
	static runJS = new Perm("runJS", "manager");
	static bypassNameCheck = new Perm("bypassNameCheck", "fish");
	static hardcore = new Perm("hardcore", "trusted");
	static massKill = new Perm("massKill", "admin").exceptModes({
		sandbox: Perm.mod,
	});

	check:(fishP:FishPlayer) => boolean;
	constructor(
		public name:string, check:RankName | ((fishP:FishPlayer) => boolean),
		public color:string = "",
		public unauthorizedMessage:string = `You do not have the required permission (${name}) to execute this command`
	){
		if(typeof check == "string"){
			if(Rank.getByName(check) == null) crash(`Invalid perm ${name}: invalid rank name ${check}`);
			this.check = fishP => fishP.ranksAtLeast(check as RankName);
		} else {
			this.check = check;
		}
		Perm.perms[name] = this;
	}

	/** Creates a new Perm with overrides for specified gamemodes. */
	exceptModes(modes:Partial<Record<GamemodeName, Perm>>, unauthorizedMessage:string = this.unauthorizedMessage){
		return new Perm(this.name, (fishP) => {
			const effectivePerm = modes[Gamemode.name()] ?? this;
			return effectivePerm.check(fishP);
		}, this.color, unauthorizedMessage);
	}

	static fromRank(rank:Rank){
		return new Perm(rank.name, fishP => fishP.ranksAtLeast(rank), rank.color);
	}
	static getByName(name:PermType):Perm {
		return Perm.perms[name] ?? crash(`Invalid requiredPerm`);
	}
}
export type PermType = SelectEnumClassKeys<typeof Perm>;

export const Req = {
	mode: (mode:GamemodeName) => () =>
		Gamemode[mode]()
			|| fail(`This command is only available in ${formatModeName(mode)}`),
	modeNot: (mode:GamemodeName) => () =>
		!Gamemode[mode]()
			|| fail(`This command is disabled in ${formatModeName(mode)}`),
	moderate: <T extends string>(argName:T, allowSameRank:boolean = false, minimumLevel:PermType = "mod", allowSelfIfUnauthorized = false) =>
		({args, sender}:{args:Record<T, FishPlayer>, sender:FishPlayer}) =>
			(sender.canModerate(args[argName], !allowSameRank, minimumLevel, allowSelfIfUnauthorized)
				|| fail(`You do not have permission to perform moderation actions on this player.`)),
	cooldown: (durationMS:number) => ({lastUsedSuccessfullySender}:FishCommandHandlerData<never, unknown>) =>
		Date.now() - lastUsedSuccessfullySender >= durationMS
			|| fail(`This command was run recently and is on cooldown.`),
	cooldownGlobal: (durationMS:number) => ({lastUsedSuccessfullySender}:FishCommandHandlerData<never, unknown>) =>
		Date.now() - lastUsedSuccessfullySender >= durationMS
			|| fail(`This command was run recently and is on cooldown.`),
	gameRunning: () =>
		!Vars.state.gameOver
			|| fail(`This game is over, please wait for the next map to load.`),
	teamAlive: ({sender}:{sender:FishPlayer}) =>
		sender.team().active()
			|| fail(`Your team is dead.`)
};

/** Takes an arg string, like `reason:string?` and converts it to a CommandArg. */
function processArgString(str:string):CommandArg {
	//this was copypasted from mlogx haha
	const matchResult = str.match(/(\w+):(\w+)(\?)?/);
	if(!matchResult){
		crash(`Bad arg string ${str}: does not match pattern word:word(?)`);
	}
	const [, name, type, isOptional] = matchResult;
	if((commandArgTypes.includes as (thing:string) => thing is CommandArgType)(type)){
		return { name, type, isOptional: !! isOptional };
	} else {
		crash(`Bad arg string ${str}: invalid type ${type}`);
	}
}

export function formatArg(a:string){
	const isOptional = a.at(-1) == "?";
	const brackets = isOptional ? ["[", "]"] : ["<", ">"];
	return brackets[0] + a.split(":")[0] + brackets[1];
}

/** Joins multi-word arguments that have been groups with quotes. Ex: turns [`"a`, `b"`] into [`a b`]*/
function joinArgs(rawArgs:string[]){
	let outputArgs = [];
	let groupedArg:string[] | null = null;
	for(let arg of rawArgs){
		if(arg.startsWith(`"`) && groupedArg == null){
			groupedArg = [];
		}
		if(groupedArg){
			groupedArg.push(arg);
			if(arg.endsWith(`"`)){
				outputArgs.push(groupedArg.join(" ").slice(1, -1));
				groupedArg = null;
			}
		} else {
			outputArgs.push(arg);
		}
	}
	if(groupedArg != null){
		//return `Unterminated string literal.`;
		outputArgs.push(groupedArg.join(" "));
	}
	return outputArgs;
}

/** Takes a list of joined args passed to the command, and processes it, turning it into a kwargs style object. */
function processArgs(args:string[], processedCmdArgs:CommandArg[], allowMenus:boolean = true):{
	processedArgs: Record<string, FishCommandArgType>;
	unresolvedArgs: CommandArg[];
} | {
	error: string;
}{
	let outputArgs:Record<string, FishCommandArgType> = {};
	let unresolvedArgs:CommandArg[] = [];
	for(const [i, cmdArg] of processedCmdArgs.entries()){
		if(!(i in args) || args[i] === ""){
			//if the arg was not provided or it was empty
			if(cmdArg.isOptional){
				outputArgs[cmdArg.name] = null;
			} else if(cmdArg.type == "player" && allowMenus){
				outputArgs[cmdArg.name] = null;
				unresolvedArgs.push(cmdArg);
			} else return {error: `No value specified for arg ${cmdArg.name}. Did you type two spaces instead of one?`};
			continue;
		}

		//Deserialize the arg
		switch(cmdArg.type){
			case "player":
				const output = FishPlayer.getOneByString(args[i]);
				if(output == "none") return {error: `Player "${args[i]}" not found.`};
				else if(output == "multiple") return {error: `Name "${args[i]}" could refer to more than one player.`};
				outputArgs[cmdArg.name] = output;
				break;
			case "offlinePlayer":
				if(uuidPattern.test(args[i])){
					const player = FishPlayer.getById(args[i]);
					if(player == null) return {error: `Player with uuid "${args[i]}" not found. Specify "create:${args[i]}" to create the player.`};
					outputArgs[cmdArg.name] = player;
				} else if(uuidPattern.test(args[i].split("create:")[1])){
					outputArgs[cmdArg.name] = FishPlayer.getFromInfo(
						Vars.netServer.admins.getInfo(
							args[i].split("create:")[1]
						)
					);
				} else {
					const output = FishPlayer.getOneOfflineByName(args[i]);
					if(output == "none") return {error: `Player "${args[i]}" not found.`};
					else if(output == "multiple") return {error: `Name "${args[i]}" could refer to more than one player. Try specifying by ID.`};
					outputArgs[cmdArg.name] = output;
				}
				break;
			case "team":
				const team = getTeam(args[i]);
				if(typeof team == "string") return {error: team};
				outputArgs[cmdArg.name] = team;
				break;
			case "number":
				let number = Number(args[i]);
				if(isNaN(number)){
					if(/\(\d+,/.test(args[i]))
						number = Number(args[i].slice(1, -1));
					else if(/\d+\)/.test(args[i]))
						number = Number(args[i].slice(0, -1));

					if(isNaN(number))
						return {error: `Invalid number "${args[i]}"`};
				}
				outputArgs[cmdArg.name] = number;
				break;
			case "time":
				const milliseconds = parseTimeString(args[i]);
				if(milliseconds == null) return {error: `Invalid time string "${args[i]}"`};
				outputArgs[cmdArg.name] = milliseconds;
				break;
			case "string":
				outputArgs[cmdArg.name] = args[i];
				break;
			case "boolean":
				switch(args[i].toLowerCase()){
					case "true": case "yes": case "yeah": case "ya": case "ye": case "t": case "y": case "1": outputArgs[cmdArg.name] = true; break;
					case "false": case "no": case "nah": case "nay": case "nope": case "f": case "n": case "0": outputArgs[cmdArg.name] = false; break;
					default: return {error: `Argument ${args[i]} is not a boolean. Try "true" or "false".`};
				}
				break;
			case "block":
				const block = getBlock(args[i], "air");
				if(typeof block == "string") return {error: block};
				outputArgs[cmdArg.name] = block;
				break;
			case "unittype":
				const unit = getUnitType(args[i]);
				if(typeof unit == "string") return {error: unit};
				outputArgs[cmdArg.name] = unit;
				break;
			case "uuid":
				if(!uuidPattern.test(args[i])) return {error: `Invalid uuid string "${args[i]}"`};
				outputArgs[cmdArg.name] = args[i];
				break;
			case "map":
				const map = getMap(args[i]);
				if(map == "none") return {error: `Map "${args[i]}" not found.`};
				else if(map == "multiple") return {error: `Name "${args[i]}" could refer to more than one map. Be more specific.`};
				outputArgs[cmdArg.name] = map;
				break;
			case "rank":
				const ranks = Rank.getByInput(args[i]);
				if(ranks.length == 0) return {error:`Unknown rank "${args[i]}"`};
				if(ranks.length > 1) return {error:`Ambiguous rank "${args[i]}"`};
				outputArgs[cmdArg.name] = ranks[0];
				break;
			case "roleflag":
				const roleflags = RoleFlag.getByInput(args[i]);
				if(roleflags.length == 0) return {error:`Unknown role flag "${args[i]}"`};
				if(roleflags.length > 1) return {error:`Ambiguous role flag "${args[i]}"`};
				outputArgs[cmdArg.name] = roleflags[0];
				break;
			case "item":
				const item = getItem(args[i]);
				if(typeof item === "string") return { error: item };
				outputArgs[cmdArg.name] = item;
				break;
			default: cmdArg.type satisfies never; crash("impossible");
		}
	}
	return {processedArgs: outputArgs, unresolvedArgs};
}


const outputFormatter_server = tagProcessorPartial<Formattable, string | null>((chunk) => {
	if(chunk instanceof FishPlayer){
		return `&c(${escapeStringColorsServer(chunk.cleanedName)})&fr`;
	} else if(chunk instanceof Rank){
		return `&p${chunk.name}&fr`;
	} else if(chunk instanceof RoleFlag){
		return `&p${chunk.name}&fr`;
	} else if(chunk instanceof Error){
		return `&r${escapeStringColorsServer(chunk.toString())}&fr`;
	} else if(chunk instanceof Player){
		const player = chunk as mindustryPlayer; //not sure why this is necessary, typescript randomly converts any to unknown
		return `&cPlayer#${player.id} (${escapeStringColorsServer(Strings.stripColors(player.name))})&fr`
	} else if(typeof chunk == "string"){
		if(uuidPattern.test(chunk)){
			return `&b${chunk}&fr`;
		} else if(ipPattern.test(chunk)){
			return `&b${chunk}&fr`;
		} else {
			return `${chunk}`;
		}
	} else if(typeof chunk == "boolean"){
		return `&b${chunk.toString()}&fr`;
	} else if(typeof chunk == "number"){
		return `&b${chunk.toString()}&fr`;
	} else if(chunk instanceof Administration.PlayerInfo){
		return `&c${escapeStringColorsServer(chunk.plainLastName())}&fr`;
	} else if(chunk instanceof UnitType){
		return `&c${chunk.localizedName}&fr`;
	} else if(chunk instanceof Block){
		return `&c${chunk.localizedName}&fr`;
	} else if(chunk instanceof Team){
		return `&c${chunk.name}&fr`;
	} else if(chunk instanceof Item){
		return `&c${chunk.name}&fr`;
	} else {
		chunk satisfies never;
		Log.err("Invalid format object!");
		Log.info(chunk);
		return chunk as string; //let it get stringified by the JS engine
	}
});
const outputFormatter_client = tagProcessorPartial<Formattable, string | null>((chunk, i, data, stringChunks) => {
	const reset = data ?? stringChunks[0].match(/^\[.+?\]/)?.[0] ?? "";
	if(chunk instanceof FishPlayer){
		return `[cyan](${chunk.name}[cyan])` + reset;
	} else if(chunk instanceof Rank){
		return `${chunk.color}${chunk.name}[]` + reset;
	} else if(chunk instanceof RoleFlag){
		return `${chunk.color}${chunk.name}[]` + reset;
	} else if(chunk instanceof Error){
		return `[red]${chunk.toString()}` + reset;
	} else if(chunk instanceof Player){
		const fishP = FishPlayer.get(chunk);
		return `[cyan](${fishP.name}[cyan])` + reset;
	} else if(typeof chunk == "string"){
		if(uuidPattern.test(chunk)){
			return `[blue]${chunk}[]`;
		} else if(ipPattern.test(chunk)){
			return `[blue]${chunk}[]`;
		} else {
			//TODO reset color?
			return chunk;
		}
	} else if(typeof chunk == "boolean"){
		return `[blue]${chunk.toString()}[]`;
	} else if(typeof chunk == "number"){
		return `[blue]${chunk.toString()}[]`;
	} else if(chunk instanceof Administration.PlayerInfo){
		return chunk.lastName + reset;
	} else if(chunk instanceof UnitType){
		return `[cyan]${chunk.localizedName}[]`;
	} else if(chunk instanceof Block){
		return `[cyan]${chunk.localizedName}[]`;
	} else if(chunk instanceof Team){
		return `[white]${chunk.coloredName()}[][]`;
	} else if(chunk instanceof Item){
		return `[cyan]${chunk.name}[]`;
	} else {
		chunk satisfies never;
		Log.err("Invalid format object!");
		Log.info(chunk);
		return chunk as string; //allow it to get stringified by the engine
	}
});



//Shenanigans were once necessary due to odd behavior of Typescript's compiled error subclass
//however it morphed into something ungodly
declare class _FAKE_CommandError { //oh god no why
	data: string | PartialFormatString;
}
export const CommandError = (function(){}) as unknown as typeof _FAKE_CommandError;
Object.setPrototypeOf(CommandError.prototype, Error.prototype);
export function fail(message:string | PartialFormatString):never {
	let err = new Error(typeof message == "string" ? message : "");
	//oh no it's even worse now because i have to smuggle a function through here
	(err as any).data = message;
	Object.setPrototypeOf(err, CommandError.prototype);
	throw err;
}

const variadicArgumentTypes:CommandArgType[] = ["player", "string", "map"];

/** Converts the CommandArg[] to the format accepted by Arc CommandHandler */
function convertArgs(processedCmdArgs:CommandArg[], allowMenus:boolean):string {
	return processedCmdArgs.map((arg, index, array) => {
		const isOptional = (arg.isOptional || (arg.type == "player" && allowMenus)) && !array.slice(index + 1).some(c => !c.isOptional);
		const brackets = isOptional ? ["[", "]"] : ["<", ">"];
		//if the arg is a string and last argument, make it variadic (so if `/warn player a b c d` is run, the last arg is "a b c d" not "a")
		return brackets[0] + arg.name + (variadicArgumentTypes.includes(arg.type) && index + 1 == array.length ? "..." : "") + brackets[1];
	}).join(" ");
}

export function handleTapEvent(event:EventType["TapEvent"]){
	const sender = FishPlayer.get(event.player);
	if(sender.tapInfo.commandName == null) return;
	const command = allCommands[sender.tapInfo.commandName];
	const usageData = sender.getUsageData(sender.tapInfo.commandName);
	try {
		let failed = false;
		command.tapped?.({
			args: sender.tapInfo.lastArgs,
			data: command.data,
			outputFail: message => {outputFail(message, sender); failed = true;},
			outputSuccess: message => outputSuccess(message, sender),
			output: message => outputMessage(message, sender),
			f: outputFormatter_client,
			admins: Vars.netServer.admins,
			commandLastUsed: usageData.lastUsed,
			commandLastUsedSuccessfully: usageData.lastUsedSuccessfully,
			lastUsed: usageData.tapLastUsed,
			lastUsedSuccessfully: usageData.tapLastUsedSuccessfully,
			sender,
			tile: event.tile,
			x: event.tile.x,
			y: event.tile.y,
		});
		if(!failed)
			usageData.tapLastUsedSuccessfully = Date.now();
		
	} catch(err){
		if(err instanceof CommandError){
			//If the error is a command error, then just outputFail
			outputFail(err.data, sender);
		} else {
			sender.sendMessage(`[scarlet]\u274C An error occurred while executing the command!`);
			if(sender.hasPerm("seeErrorMessages")) sender.sendMessage(parseError(err));
			Log.err(`Unhandled error in command execution: ${sender.cleanedName} ran /${sender.tapInfo.commandName} and tapped`);
			Log.err(err as Error);
		}
	} finally {
		if(sender.tapInfo.mode == "once"){
			sender.tapInfo.commandName = null;
		}
		usageData.tapLastUsed = Date.now();
	}
}

/**
 * Registers all commands in a list to a client command handler.
 **/
export function register(commands:Record<string, FishCommandData<string, any> | (() => FishCommandData<string, any>)>, clientHandler:ClientCommandHandler, serverHandler:ServerCommandHandler){

	for(let [name, _data] of Object.entries(commands)){

		let data = typeof _data == "function" ? _data() : _data;

		//Process the args
		const processedCmdArgs = data.args.map(processArgString);
		clientHandler.removeCommand(name); //The function silently fails if the argument doesn't exist so this is safe
		clientHandler.register(
			name,
			convertArgs(processedCmdArgs, true),
			data.description,
			new CommandHandler.CommandRunner({ accept(unjoinedRawArgs:string[], sender:mindustryPlayer){
				if(!initialized) crash(`Commands not initialized!`);

				const fishSender = FishPlayer.get(sender);
				FishPlayer.onPlayerCommand(fishSender, name, unjoinedRawArgs);

				//Verify authorization
				//as a bonus, this crashes if data.perm is undefined
				if(!data.perm.check(fishSender)){
					if(data.customUnauthorizedMessage)
						outputFail(data.customUnauthorizedMessage, sender);
					else if(data.isHidden)
						outputMessage(hiddenUnauthorizedMessage, sender);
					else
						outputFail(data.perm.unauthorizedMessage, sender);
					return;
				}

				//closure over processedCmdArgs, should be fine
				//Process the args
				const rawArgs = joinArgs(unjoinedRawArgs);
				const output = processArgs(rawArgs, processedCmdArgs);
				if("error" in output){
					//if args are invalid
					outputFail(output.error, sender);
					return;
				}
				
				//Recursively resolve unresolved args (such as players that need to be determined through a menu)
				resolveArgsRecursive(output.processedArgs, output.unresolvedArgs, fishSender, () => {
					//Run the command handler
					const usageData = fishSender.getUsageData(name);
					let failed = false;
					try {
						const args:FishCommandHandlerData<string, any> & FishCommandHandlerUtils = {
							rawArgs,
							args: output.processedArgs,
							sender: fishSender,
							data: data.data,
							outputFail: message => {outputFail(message, sender); failed = true;},
							outputSuccess: message => outputSuccess(message, sender),
							output: message => outputMessage(message, sender),
							f: outputFormatter_client,
							execServer: command => serverHandler.handleMessage(command),
							admins: Vars.netServer.admins,
							lastUsedSender: usageData.lastUsed,
							lastUsedSuccessfullySender: usageData.lastUsedSuccessfully,
							lastUsedSuccessfully: (globalUsageData[name] ??= {lastUsed: -1, lastUsedSuccessfully: -1}).lastUsedSuccessfully,
							allCommands,
							currentTapMode: fishSender.tapInfo.commandName == null ? "off" : fishSender.tapInfo.mode,
							handleTaps(mode){
								if(data.tapped == undefined) crash(`No tap handler to activate: command "${name}"`);
								if(mode == "off"){
									fishSender.tapInfo.commandName = null;
								} else {
									fishSender.tapInfo.commandName = name;
									fishSender.tapInfo.mode = mode;
								}
								fishSender.tapInfo.lastArgs = output.processedArgs;
							},
						};
						data.requirements?.forEach(r => r(args));
						data.handler(args);
						//Update usage data
						if(!failed){
							usageData.lastUsedSuccessfully = globalUsageData[name].lastUsedSuccessfully = Date.now();
						}
					} catch(err){
						if(err instanceof CommandError){
							//If the error is a command error, then just outputFail
							outputFail(err.data, sender);
						} else {
							sender.sendMessage(`[scarlet]\u274C An error occurred while executing the command!`);
							if(fishSender.hasPerm("seeErrorMessages")) sender.sendMessage(parseError(err));
							Log.err(`Unhandled error in command execution: ${fishSender.cleanedName} ran /${name}`);
							Log.err(err as Error);
							Log.err((err as Error).stack!);
						}
					} finally {
						usageData.lastUsed = globalUsageData[name].lastUsed = Date.now();
					}
				});
				
			}})
		);
		allCommands[name] = data;
	}
}

export function registerConsole(commands:Record<string, FishConsoleCommandData<string, any>>, serverHandler:ServerCommandHandler){

	for(const [name, data] of Object.entries(commands)){
		//Cursed for of loop due to lack of object.entries

		//Process the args
		const processedCmdArgs = data.args.map(processArgString);
		serverHandler.removeCommand(name); //The function silently fails if the argument doesn't exist so this is safe
		serverHandler.register(
			name,
			convertArgs(processedCmdArgs, false),
			data.description,
			new CommandHandler.CommandRunner({ accept: (rawArgs:string[]) => {
				if(!initialized) crash(`Commands not initialized!`);

				//closure over processedCmdArgs, should be fine
				//Process the args
				const output = processArgs(rawArgs, processedCmdArgs, false);
				if("error" in output){
					//ifargs are invalid
					Log.warn(output.error);
					return;
				}
				
				const usageData = (globalUsageData["_console_" + name] ??= {lastUsed: -1, lastUsedSuccessfully: -1});
				try {
					let failed = false;
					data.handler({
						rawArgs,
						args: output.processedArgs,
						data: data.data,
						outputFail: message => {outputConsole(message, Log.err); failed = true;},
						outputSuccess: outputConsole,
						output: outputConsole,
						f: outputFormatter_server,
						execServer: command => serverHandler.handleMessage(command),
						admins: Vars.netServer.admins,
						...usageData
					});
					usageData.lastUsed = Date.now();
					if(!failed) usageData.lastUsedSuccessfully = Date.now();
				} catch(err){
					usageData.lastUsed = Date.now();
					if(err instanceof CommandError){
						Log.warn(typeof err.data == "function" ? err.data("&fr") : err.data);
					} else {
						Log.err("&lrAn error occured while executing the command!&fr");
						Log.err(parseError(err));
					}
				}
			}})
		);
		allConsoleCommands[name] = data;
	}
}

/** Recursively resolves args. This function is necessary to handle cases such as a command that accepts multiple players that all need to be selected through menus. */
function resolveArgsRecursive(processedArgs: Record<string, FishCommandArgType>, unresolvedArgs:CommandArg[], sender:FishPlayer, callback:(args:Record<string, FishCommandArgType>) => void){
	if(unresolvedArgs.length == 0){
		callback(processedArgs);
	} else {
		const argToResolve = unresolvedArgs.shift()!;
		let optionsList:mindustryPlayer[] = [];
		//TODO Dubious implementation
		switch(argToResolve.type){
			case "player": Groups.player.each(player => optionsList.push(player)); break;
			default: crash(`Unable to resolve arg of type ${argToResolve.type}`);
		}
		menu(`Select a player`, `Select a player for the argument "${argToResolve.name}"`, optionsList, sender, (option) => {
			processedArgs[argToResolve.name] = FishPlayer.get(option);
			resolveArgsRecursive(processedArgs, unresolvedArgs, sender, callback);
		}, true, player => Strings.stripColors(player.name).length >= 3 ? Strings.stripColors(player.name) : escapeStringColorsClient(player.name))

	}

}

export function initialize(){
	if(initialized){
		crash("Already initialized commands.");
	}
	for(const [key, command] of Object.entries(allConsoleCommands)){
		if(command.init) command.data = command.init();
	}
	for(const [key, command] of Object.entries(allCommands)){
		if(command.init) command.data = command.init();
	}
	initialized = true;
}
