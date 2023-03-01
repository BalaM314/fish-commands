const menus = require('menus');
const players = require("players");

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


const commandArgTypes = ["string", "number", "boolean", "player"] as const;
type CommandArgType = typeof commandArgTypes extends ReadonlyArray<infer T> ? T : never;


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

function processArgs(args:string[], processedCmdArgs:CommandArg[]):Record<string, FishCommandArgType> | string {
	let outputArgs:Record<string, FishCommandArgType> = {};
	for(const [i, cmdArg] of processedCmdArgs.entries()){
		if(!args[i]){
			if(cmdArg.isOptional){
				outputArgs[cmdArg.name] = null; continue;
			} else {
				throw new Error("arg parsing failed");
			}
		}
		switch(cmdArg.type){
			case "player":
				const player = players.getPByName(args[i]);
				if(player == null) return `Player "${args[i]}" not found.`;
				outputArgs[cmdArg.name] = player;
				break;
			case "number":
				const number = parseInt(args[i]);
				if(isNaN(number)) return `Invalid number "${args[i]}"`;
				outputArgs[cmdArg.name] = number;
				break;
			case "string":
				outputArgs[cmdArg.name] = args[i];
				break;
			case "boolean":
				switch(args[i].toLowerCase()){
					case "true": case "yes": case "yeah": case "ya": case "ya": case "t": case "y": outputArgs[cmdArg.name] = true; break;
					case "false": case "no": case "nah": case "nay": case "nope": case "f": case "n": outputArgs[cmdArg.name] = true; break;
					default: return `Argument ${args[i]} is not a boolean. Try "true" or "false".`; break;
				}
				break;
		}
	}
	return outputArgs;
}

//const cause why not?
const canPlayerAccess = function canPlayerAccess(player:FishPlayer, level:PermissionsLevel){
	switch(level){
		case PermissionsLevel.all: return true;
		case PermissionsLevel.player: return !player.stopped || player.mod || player.admin;
		case PermissionsLevel.mod: return player.mod || player.admin;
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
	for(const name of Object.keys(commands)){
		const data = commands[name];
		const processedCmdArgs = data.args.map(processArgString);
		clientCommands.register(
			name,
			processedCmdArgs.map((arg, index, array) => {
				const brackets = arg.isOptional ? ["[", "]"] : ["<", ">"];
				return brackets[0] + arg.name + (arg.type == "string" && index + 1 == array.length ? "..." : "") + brackets[1];
			}).join(" "),
			data.description,
			//closure over processedCmdArgs, should be fine
			runner((rawArgs, sender) => {
				const fishSender = players.getP(sender);

				if(!canPlayerAccess(fishSender, data.level)){
					outputFail(data.customUnauthorizedMessage ?? `You do not have the required permission (${data.level}) to execute this command`, sender);
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

module.exports = {
	register,
	PermissionsLevel
};
