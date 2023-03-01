const menus = require('../menus');
const players = require("../players");
declare const Call: any;
declare const Strings: {
	stripColors(string:string): string;
}
/**
 * Misc notes:
 * I made a handful of arbitrary choices, you can change them if you want
 * this is very, very incomplete
 * the api I want seems feasible to implement
 * maybe we should abstract away the "select a player" menu?
 */

/** Represents a permission level that is required to run a specific command. */
enum PermissionsLevel {
	all = "all",
	player = "player",//Must be not marked griefer
	mod = "mod",
	admin = "admin",
}

type FishCommandArgType = string | number | FishPlayer | null;

interface FishCommandRunner {
	(_:{
		rawArgs:(string | undefined)[],
		args:Record<string, any>,
		sender:FishPlayer,
		outputSuccess:(message:string) => void,
		outputFail:(message:string) => void
	}): void;
}

interface FishCommandData {
	args: string[],
	description: string,
	level: PermissionsLevel,
	handler: FishCommandRunner,
}
type FishCommandsList = Record<string, FishCommandData>;

interface FishPlayer {
	player: mindustryPlayer;
	name: string,
	muted: boolean,
	mod: boolean,
	admin: boolean,
	member: boolean,
	stopped: boolean,
	/*rank*/
	watch: boolean,
	pet: string,
	highlight: null,
	history: [],
	fakeAdmin: false,
}

/* mindustry.gen.Player */
type mindustryPlayer = any;

interface ClientCommandHandler {
	register(name:string, args:string, description:string, runner:(args:string[], player:mindustryPlayer) => void):void;
}
const commandArgTypes = ["string", "number", "player"] as const;
type CommandArgType = typeof commandArgTypes extends ReadonlyArray<infer T> ? T : never;

interface CommandArg {
	name: string;
	type: CommandArgType;
	isOptional: boolean;
}

function processArgString(str:string):CommandArg {
	//this was copypasted from mlogx haha
	const matchResult = str.match(/(\w+):(\w+)(\?)?/);
	if(!matchResult){
		throw new Error(`Bad arg string ${str}: does not match pattern word:word(?)`);
	}
	const [, name, type, isOptional] = matchResult;
	if(commandArgTypes.includes(<any>type)){
		return { name, type: type as CommandArgType, isOptional: !! isOptional };
	} else {
		throw new Error(`Bad arg string ${str}: invalid type ${type}`);
	}
}

function processArgs(args:string[], processedCmdArgs:CommandArg[]):Record<string, FishCommandArgType> | string {
	/** 
	 * not an actual implementation 
	 * don't try to implement this, I have some very similar code from mlogx
	 * if one of the command args is of type "number", this function should find that from the provided args, make sure its a number, and turn it into a number
	 * if its of type "player", it should return a FishPlayer
	 * (if players.getPByName returns null then return an error message "player ${} not found")
	 * */

	let outputArgs:Record<string, FishCommandArgType> = {};
	for(const [i, cmdArg] of processedCmdArgs.entries()){
		switch(cmdArg.type){
			case "player":
				if(!args[i]){
					if(cmdArg.isOptional){
						outputArgs[cmdArg.name] = null; break;
					}
					throw new Error("arg parsing failed");
				}
				const player = players.getPByName(args[i]);
				if(player == null) return `Player "${args[i]}" not found.`;
				outputArgs[cmdArg.name] = player;
				break;
			case "number":
				if(!args[i]){
					if(cmdArg.isOptional){
						outputArgs[cmdArg.name] = null; break;
					}
					throw new Error("arg parsing failed");
				}
				const number = parseInt(args[i]);
				if(isNaN(number)) return `Invalid number "${args[i]}"`;
				outputArgs[cmdArg.name] = number;
				break;
			case "string":
				if(!args[i]){
					if(cmdArg.isOptional){
						outputArgs[cmdArg.name] = null; break;
					}
					throw new Error("arg parsing failed");
				}
				outputArgs[cmdArg.name] = args[i];
				break;
		}
	}
	return outputArgs;
}

//const cause why not?
const canPlayerAccess = function canPlayerAccess(player:FishPlayer, level:PermissionsLevel){
	switch(level){
		case PermissionsLevel.all: return true;
		case PermissionsLevel.player: return !player.stopped;
		case PermissionsLevel.mod: return player.mod;
		case PermissionsLevel.admin: return player.admin;
	}
}

function register(commands:FishCommandsList, clientCommands:ClientCommandHandler, runner:(func:(args:string[], player:mindustryPlayer) => void) => (args:string[], player:mindustryPlayer) => void){
	function outputFail(message:string, sender:mindustryPlayer){
		sender.sendMessage(`[scarlet]⚠ [yellow]${message}`);
	}
	function outputSuccess(message:string, sender:mindustryPlayer){
		sender.sendMessage(`[#48e076]${message}`);
	}
	for(const [name, data] of Object.entries(commands)){
		const processedCmdArgs = data.args.map(processArgString);
		clientCommands.register(
			name,
			processedCmdArgs.map(arg => arg.isOptional ? `[${arg.name}(optional)]` : `<${arg.name}>`).join(" "),
			data.description,
			//closure over processedCmdArgs, should be fine
			runner((rawArgs, sender) => {
				const fishSender = players.getP(sender);

				if(!canPlayerAccess(fishSender, data.level)){
					outputFail(`You do not have the required permission (${data.level}) to execute this command`, fishSender);
					return;
				}

				
				const output = processArgs(rawArgs, processedCmdArgs);
				if(typeof output == "string"){
					//args are invalid
					outputFail(output, sender);
					return;
				}

				data.handler({
					rawArgs,
					args: output,
					sender: fishSender,
					//getP was modified for this to work
					outputFail: message => outputFail(message, sender),
					outputSuccess: message => outputSuccess(message, sender),
				});
			})
		);
	}
}