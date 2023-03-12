import { menu } from "./menus";
const players = require("players");


/** Represents a permission level that is required to run a specific command. */
export class PermissionsLevel {
	static all = new PermissionsLevel("all");
	static player = new PermissionsLevel("player");
	static mod = new PermissionsLevel("mod");
	static admin = new PermissionsLevel("admin");
	static member = new PermissionsLevel("member", `You must have a [scarlet]Fish Membership[yellow] to use this command. Subscribe on the [sky]/discord[yellow]!`);
	constructor(public name:string, public customErrorMessage?:string){}
}


const commandArgTypes = ["string", "number", "boolean", "player"] as const;
type CommandArgType = typeof commandArgTypes extends ReadonlyArray<infer T> ? T : never;

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
			case "player":
				const player = players.getPByName(args[i]);
				if(player == null) return {error: `Player "${args[i]}" not found.`};
				outputArgs[cmdArg.name] = player;
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
					case "false": case "no": case "nah": case "nay": case "nope": case "f": case "n": outputArgs[cmdArg.name] = true; break;
					default: return {error: `Argument ${args[i]} is not a boolean. Try "true" or "false".`};
				}
				break;
		}
	}
	return {processedArgs: outputArgs, unresolvedArgs};
}

//const cause why not?
/**Determines if a FishPlayer can run a command with a specific permission level. */
export const canPlayerAccess = function canPlayerAccess(player:FishPlayer, level:PermissionsLevel):boolean {
	switch(level){
		case PermissionsLevel.all: return true;
		case PermissionsLevel.player: return !player.stopped || player.mod || player.admin;
		case PermissionsLevel.mod: return player.mod || player.admin;
		case PermissionsLevel.admin: return player.admin;
		case PermissionsLevel.member: return player.member;
		default: Log.err(`ERROR!: canPlayerAccess called with invalid permissions level ${level}`); return false;
	}
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
				const fishSender = players.getP(sender);

				//Verify authorization
				if(!canPlayerAccess(fishSender, data.level)){
					outputFail(data.customUnauthorizedMessage ?? data.level.customErrorMessage ?? `You do not have the required permission (${data.level}) to execute this command`, sender);
					return;
				}

				
				//closure over processedCmdArgs, should be fine
				const output = processArgs(rawArgs, processedCmdArgs);
				if("error" in output){
					//args are invalid
					outputFail(output.error, sender);
					return;
				}
				
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
		let optionsList:any[] = [];
		//Dubious implementation
		switch(argToResolve.type){
			case "player": (Groups.player as mindustryPlayer[]).forEach(player => optionsList.push(player)); break;
			default: throw new Error(`Unable to resolve arg of type ${argToResolve.type}`);
		}
		menu(`Select a player`, `Select a player for the argument "${argToResolve.name}"`, optionsList, sender, ({option}) => {
			processedArgs[argToResolve.name] = players.getP(option);
			resolveArgsRecursive(processedArgs, unresolvedArgs, sender, callback);
		}, true, player => player.name)

	}

}

