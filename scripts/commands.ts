import { menu } from "./menus";
import { FishPlayer } from "./players";
import type { Rank } from "./ranks";
import type { CommandArg, FishCommandArgType, FishCommandsList, ClientCommandHandler, ServerCommandHandler } from "./types";



/** Represents a permission level that is required to run a specific command. */
export class Perm {
	static all = new Perm("all", fishP => true);
	static notGriefer = new Perm("player", fishP => !fishP.stopped || fishP.mod || fishP.admin);
	static mod = new Perm("mod", fishP => fishP.mod || fishP.admin);
	static admin = new Perm("admin", fishP => fishP.admin);
	static member = new Perm("member", fishP => fishP.member || !fishP.stopped, `You must have a [scarlet]Fish Membership[yellow] to use this command. Subscribe on the [sky]/discord[yellow]!`);
	constructor(public name:string, public check:(fishP:FishPlayer) => boolean, public unauthorizedMessage:string = `You do not have the required permission (${name}) to execute this command`){}
	// static fromRank(rank:Rank){
	// 	return new Perm(rank.name, fishP => fishP.rank.level >= rank.level);
	// }
}

//TODO impl exactPlayer for /admin, etc
const commandArgTypes = ["string", "number", "boolean", "player", "exactPlayer", "namedPlayer"] as const;
export type CommandArgType = typeof commandArgTypes extends ReadonlyArray<infer T> ? T : never;

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


/**Takes a list of args passed to the command, and processes it, turning it into a kwargs style object. */
function processArgs(args:string[], processedCmdArgs:CommandArg[]):{
	processedArgs: Record<string, FishCommandArgType>;
	unresolvedArgs: CommandArg[];
} | {
	error: string;
}{
	let outputArgs:Record<string, FishCommandArgType> = {};
	let unresolvedArgs:CommandArg[] = [];
	for(const [i, cmdArg] of processedCmdArgs.entries()){
		if(!args[i]){
			if(cmdArg.isOptional){
				outputArgs[cmdArg.name] = null; continue;
			} else if(cmdArg.type == "player"){
				outputArgs[cmdArg.name] = null;
				unresolvedArgs.push(cmdArg);
				continue;
			} else {
				throw new Error("arg parsing failed");
			}
		}
		switch(cmdArg.type){
			case "player": case "namedPlayer":
				const player = FishPlayer.getByName(args[i]);
				if(player == null) return {error: `Player "${args[i]}" not found.`};
				outputArgs[cmdArg.name] = player;
				break;
			case "exactPlayer":
				const players = FishPlayer.getAllByName(args[i]);
				if(players.length === 0) return {error: `Player "${args[i]}" not found. You must specify the name exactly without colors.`};
				else if(players.length > 1) return {error: `Name "${args[i]}" could refer to more than one player.`};
				outputArgs[cmdArg.name] = players[0];
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


/**
 * Registers all commands in a list to a client command handler.
 * @argument runner (method) => new Packages.arc.util.CommandHandler.CommandRunner({ accept: method })
 * */
export function register(commands:FishCommandsList, clientCommands:ClientCommandHandler, serverCommands:ServerCommandHandler, runner:(func:(args:string[], player:mindustryPlayer) => void) => (args:string[], player:mindustryPlayer) => void){
	function outputFail(message:string, sender:mindustryPlayer){
		sender.sendMessage(`[scarlet]⚠ [yellow]${message}`);
	}
	function outputSuccess(message:string, sender:mindustryPlayer){
		sender.sendMessage(`[#48e076]${message}`);
	}
	function outputMessage(message:string, sender:mindustryPlayer){
		sender.sendMessage(message);
	}


	for(const name of Object.keys(commands)){
		//Cursed for of loop due to lack of object.entries
		const data = commands[name];

		//Process the args
		const processedCmdArgs = data.args.map(processArgString);

		clientCommands.register(
			name,
			//Convert the CommandArg[] to the format accepted by Arc CommandHandler
			processedCmdArgs.map((arg, index, array) => {
				const brackets = (arg.isOptional || arg.type == "player") ? ["[", "]"] : ["<", ">"];
				//if the arg is a string and last argument, make it a spread type (so if `/warn player a b c d` is run, the last arg is "a b c d" not "a")
				return brackets[0] + arg.name + (arg.type == "string" && index + 1 == array.length ? "..." : "") + brackets[1];
			}).join(" "),
			data.description,
			runner((rawArgs, sender) => {
				const fishSender = FishPlayer.get(sender);

				//Verify authorization
				if(!data.level.check(fishSender)){
					outputFail(data.customUnauthorizedMessage ?? data.level.unauthorizedMessage, sender);
					return;
				}

				
				//closure over processedCmdArgs, should be fine
				const output = processArgs(rawArgs, processedCmdArgs);
				if("error" in output){
					//args are invalid
					outputFail(output.error, sender);
					return;
				}
				
				//Recursively resolve unresolved args (such as players that need to be determined through a menu)
				resolveArgsRecursive(output.processedArgs, output.unresolvedArgs, fishSender, () => {
					//Run the command handler
					data.handler({
						rawArgs,
						args: output.processedArgs,
						sender: fishSender,
						outputFail: message => outputFail(message, sender),
						outputSuccess: message => outputSuccess(message, sender),
						output: message => outputMessage(message, sender),
						execServer: command => serverCommands.handleMessage(command)
					});
				});
				

				
			})
		);
	}
}

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

