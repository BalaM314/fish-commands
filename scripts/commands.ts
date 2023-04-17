import { menu } from "./menus";
import { FishPlayer } from "./players";
import { Rank } from "./ranks";
import type { CommandArg, FishCommandArgType, FishCommandsList, ClientCommandHandler, ServerCommandHandler, FishConsoleCommandsList, FishCommandData } from "./types";
import { getTeam } from "./utils";

export const allCommands:Record<string, FishCommandData> = {};
const commandArgTypes = ["string", "number", "boolean", "player", "menuPlayer", "team"] as const;
export type CommandArgType = typeof commandArgTypes extends ReadonlyArray<infer T> ? T : never;


/** Represents a permission level that is required to run a specific command. */
export class Perm {
	static none = new Perm("all", fishP => true, "[sky]");
	static notGriefer = new Perm("player", fishP => !fishP.stopped || Perm.mod.check(fishP), "[sky]");
	static mod = Perm.fromRank(Rank.mod);
	static admin = Perm.fromRank(Rank.admin);
	static member = new Perm("member", fishP => fishP.member || !fishP.stopped, "[pink]", `You must have a [scarlet]Fish Membership[yellow] to use this command. Subscribe on the [sky]/discord[yellow]!`);
	constructor(public name:string, public check:(fishP:FishPlayer) => boolean, public color:string = "", public unauthorizedMessage:string = `You do not have the required permission (${name}) to execute this command`){}
	static fromRank(rank:Rank){
		return new Perm(rank.name, fishP => fishP.ranksAtLeast(rank), rank.color);
	}
}


/**Takes an arg string, like `reason:string?` and converts it to a CommandArg. */
function processArgString(str:string):CommandArg {
	//this was copypasted from mlogx haha
	const matchResult = str.match(/(\w+):(\w+)(\?)?/);
	if(!matchResult){
		throw new Error(`Bad arg string ${str}: does not match pattern word:word(?)`);
	}
	const [, name, type, isOptional] = matchResult;
	if((commandArgTypes.includes as (thing:string) => thing is CommandArgType)(type)){
		return { name, type, isOptional: !! isOptional };
	} else {
		throw new Error(`Bad arg string ${str}: invalid type ${type}`);
	}
}

export function formatArg(a:string){
	const isOptional = a.at(-1) == "?";
	const brackets = isOptional ? ["[", "]"] : ["<", ">"];
	return brackets[0] + a.split(":")[0] + brackets[1];
}

/**Takes a list of args passed to the command, and processes it, turning it into a kwargs style object. */
function processArgs(args:string[], processedCmdArgs:CommandArg[], allowMenus:boolean = true):{
	processedArgs: Record<string, FishCommandArgType>;
	unresolvedArgs: CommandArg[];
} | {
	error: string;
}{
	let outputArgs:Record<string, FishCommandArgType> = {};
	let unresolvedArgs:CommandArg[] = [];
	for(const [i, cmdArg] of processedCmdArgs.entries()){
		//if the arg was not provided
		if(!args[i]){
			if(cmdArg.isOptional){
				outputArgs[cmdArg.name] = null;
			} else if(cmdArg.type == "player" && allowMenus){
				outputArgs[cmdArg.name] = null;
				unresolvedArgs.push(cmdArg);
			} else throw new Error("arg parsing failed");
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
			case "menuPlayer":
				return {error: `menuPlayer argtype is not yet implemented`};
				break;
			case "team":
				const team = getTeam(args[i]);
				if(team == null) return {error: `"${args[i]}" is not a valid team name.`};
				outputArgs[cmdArg.name] = team;
				break;
			case "number":
				const number = parseInt(args[i]);
				if(isNaN(number)) return {error: `Invalid number "${args[i]}"`};
				outputArgs[cmdArg.name] = number;
				break;
			case "string":
				outputArgs[cmdArg.name] = args[i];
				break;
			case "boolean":
				switch(args[i].toLowerCase()){
					case "true": case "yes": case "yeah": case "ya": case "ya": case "t": case "y": outputArgs[cmdArg.name] = true; break;
					case "false": case "no": case "nah": case "nay": case "nope": case "f": case "n": outputArgs[cmdArg.name] = false; break;
					default: return {error: `Argument ${args[i]} is not a boolean. Try "true" or "false".`};
				}
				break;
		}
	}
	return {processedArgs: outputArgs, unresolvedArgs};
}


function outputFail(message:string, sender:mindustryPlayer){
	sender.sendMessage(`[scarlet]⚠ [yellow]${message}`);
}
function outputSuccess(message:string, sender:mindustryPlayer){
	sender.sendMessage(`[#48e076]✔ ${message}`);
}
function outputMessage(message:string, sender:mindustryPlayer){
	sender.sendMessage(message);
}


const CommandError = (function(){}) as typeof Error;
Object.setPrototypeOf(CommandError.prototype, Error.prototype);
//Shenanigans necessary due to odd behavior of Typescript's compiled error subclass
export function fail(message:string):never {
	let err = new Error(message);
	Object.setPrototypeOf(err, CommandError.prototype);
	throw err;
}

/**Converts the CommandArg[] to the format accepted by Arc CommandHandler */
function convertArgs(processedCmdArgs:CommandArg[], allowMenus:boolean):string {
	return processedCmdArgs.map((arg, index, array) => {
		const isOptional = arg.isOptional || (arg.type == "player" && allowMenus && !array.slice(index + 1).some(c => !c.isOptional));
		const brackets = isOptional ? ["[", "]"] : ["<", ">"];
		//if the arg is a string and last argument, make it a spread type (so if `/warn player a b c d` is run, the last arg is "a b c d" not "a")
		return brackets[0] + arg.name + (arg.type == "string" && index + 1 == array.length ? "..." : "") + brackets[1];
	}).join(" ");
}

/**
 * Registers all commands in a list to a client command handler.
 **/
export function register(commands:FishCommandsList, clientHandler:ClientCommandHandler, serverHandler:ServerCommandHandler){

	for(const [name, data] of Object.entries(commands)){

		//Process the args
		const processedCmdArgs = data.args.map(processArgString);
		clientHandler.removeCommand(name); //The function silently fails if the argument doesn't exist so this is safe
		clientHandler.register(
			name,
			convertArgs(processedCmdArgs, true),
			data.description,
			new Packages.arc.util.CommandHandler.CommandRunner({ accept: (rawArgs:string[], sender:mindustryPlayer) => {
				const fishSender = FishPlayer.get(sender);

				//Verify authorization
				//as a bonus, this crashes if data.perm is undefined
				if(!data.perm.check(fishSender)){
					outputFail(data.customUnauthorizedMessage ?? data.perm.unauthorizedMessage, sender);
					return;
				}

				//closure over processedCmdArgs, should be fine
				//Process the args
				const output = processArgs(rawArgs, processedCmdArgs);
				if("error" in output){
					//if args are invalid
					outputFail(output.error, sender);
					return;
				}
				
				//Recursively resolve unresolved args (such as players that need to be determined through a menu)
				resolveArgsRecursive(output.processedArgs, output.unresolvedArgs, fishSender, () => {
					//Run the command handler
					try {
						data.handler({
							rawArgs,
							args: output.processedArgs,
							sender: fishSender,
							outputFail: message => outputFail(message, sender),
							outputSuccess: message => outputSuccess(message, sender),
							output: message => outputMessage(message, sender),
							execServer: command => serverHandler.handleMessage(command),
							allCommands
						});
					} catch(err){
						if(err instanceof CommandError){
							//If the error is a command error, then just outputFail
							outputFail(err.message, sender);
						} else {
							sender.sendMessage(`[scarlet]❌ An error occurred while executing the command!`);
							if(fishSender.ranksAtLeast(Rank.admin)) sender.sendMessage((<any>err).toString());
						}
					}
				});
				
			}})
		);
		allCommands[name] = data;
	}
}

export function registerConsole(commands:FishConsoleCommandsList, serverHandler:ServerCommandHandler){

	for(const [name, data] of Object.entries(commands)){
		//Cursed for of loop due to lack of object.entries

		//Process the args
		const processedCmdArgs = data.args.map(processArgString);
		serverHandler.removeCommand(name); //The function silently fails if the argument doesn't exist so this is safe
		serverHandler.register(
			name,
			convertArgs(processedCmdArgs, false),
			data.description,
			new Packages.arc.util.CommandHandler.CommandRunner({ accept: (rawArgs:string[]) => {
				
				//closure over processedCmdArgs, should be fine
				//Process the args
				const output = processArgs(rawArgs, processedCmdArgs, false);
				if("error" in output){
					//ifargs are invalid
					Log.warn(output.error);
					return;
				}
				
				try {
					data.handler({
						rawArgs,
						args: output.processedArgs,
						outputFail: message => Log.warn(`⚠ ${message}`),
						outputSuccess: message => Log.info(`${message}`),
						output: message => Log.info(message),
						execServer: command => serverHandler.handleMessage(command),
					});
				} catch(err){
					if(err instanceof CommandError){
						Log.warn(`⚠ ${err.message}`);
					} else {
						Log.err("&lrAn error occured while executing the command!&fr");
						Log.err(err as any);
					}
				}
			}})
		);
	}
}

/**Recursively resolves args. This function is necessary to handle cases such as a command that accepts multiple players that all need to be selected through menus. */
function resolveArgsRecursive(processedArgs: Record<string, FishCommandArgType>, unresolvedArgs:CommandArg[], sender:FishPlayer, callback:(args:Record<string, FishCommandArgType>) => void){
	if(unresolvedArgs.length == 0){
		callback(processedArgs);
	} else {
		const argToResolve = unresolvedArgs.shift()!;
		let optionsList:mindustryPlayer[] = [];
		//TODO Dubious implementation
		switch(argToResolve.type){
			case "player": (Groups.player as mindustryPlayer[]).forEach(player => optionsList.push(player)); break;
			default: throw new Error(`Unable to resolve arg of type ${argToResolve.type}`);
		}
		menu(`Select a player`, `Select a player for the argument "${argToResolve.name}"`, optionsList, sender, ({option}) => {
			processedArgs[argToResolve.name] = FishPlayer.get(option);
			resolveArgsRecursive(processedArgs, unresolvedArgs, sender, callback);
		}, true, player => player.name)

	}

}

