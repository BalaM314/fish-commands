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
	register(name:string, args:string, description:string, runner:(args:string[], player:any) => void):void;
}


interface CommandArg {
	name: string;
	type: string;
	isOptional: boolean;
}

function processArgString(str:string):CommandArg {
	//this was copypasted from mlogx haha
	const matchResult = str.match(/(\w+):(\w+)(\?)?/);
	if(!matchResult){
		throw new Error(`Bad arg string ${str}: does not match pattern word:word(?)`);
	}
	const [, name, type, isOptional] = matchResult;
	return { name, type, isOptional: !! isOptional };
}

function processArgs(args:string[], processedCmdArgs:CommandArg[]):Record<string, any> | string {
	/** 
	 * not an actual implementation 
	 * don't try to implement this, I have some very similar code from mlogx
	 * if one of the command args is of type "number", this function should find that from the provided args, make sure its a number, and turn it into a number
	 * if its of type "player", it should return a FishPlayer
	 * (if players.getPByName returns null then return an error message "player ${} not found")
	 * */
	if(args == <any>["SussyImpasta", "being sus"] && processedCmdArgs == <any>[{name: "player", type: "player", isOptional: false}, {name: "reason", type: "string", isOptional: true}]){
		return {
			reason: args[1],
			player: players.getPByName("SussyImpasta")
			//function added in commands rewrite
		};
	} else {
		return `Invalid arguments: Insufficient sus level`;//
	}

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