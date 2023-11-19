const api = require("./api");
const commands = require("./commands");
const config = require("./config");
const { commands: consoleCommands } = require("./consoleCommands");
const globals = require("./globals");
const { commands: memberCommands } = require("./memberCommands");
const menus = require("./menus");
const packetHandlers = require("./packetHandlers");
const { commands: playerCommands } = require("./playerCommands");
const players = require("./players");
const ranks = require("./ranks");
const { commands: staffCommands } = require("./staffCommands");
const timers = require("./timers");
const utils = require("./utils");

const { Perm, allCommands } = commands;
const { FishPlayer } = players;
const { Rank, RoleFlag } = ranks;
const { menu } = menus;

Object.assign(this, utils); //global scope goes brrrrr, I'm sure this will not cause any bugs whatsoever

const $ = Object.assign(
	function $(input){
		if(typeof input == "string"){
			if(Pattern.matches("[a-zA-Z0-9+/]{22}==", input)){
				return FishPlayer.getById(input);
			}
		}
		return null;
	},
	{
		sussy: true,
		info: function(input){
			if(typeof input == "string"){
				if(Pattern.matches("[a-zA-Z0-9+/]{22}==", input)){
					return Vars.netServer.admins.getInfo(input);
				}
			}
			return null;
		}
	}
);

exports.runJS = function(input, outputFunction, errorFunction){
	if(outputFunction == undefined) outputFunction = Log.info;
	if(errorFunction == undefined) errorFunction = Log.err;
	try {
		const admins = Vars.netServer.admins;
		const output = eval(input);
		if(output instanceof Array){
			outputFunction("&cArray: [&fr" + output.join(", ") + "&c]&fr");
		} else if(output === undefined){
			outputFunction("undefined");
		} else if(output === null){
			outputFunction("null");
		} else {
			outputFunction(output);
		}
	} catch(err){
		errorFunction(err);
	}
}