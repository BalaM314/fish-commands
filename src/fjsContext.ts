/*
Copyright © BalaM314, 2024. All Rights Reserved.
This file contains the context for the "fjs" command, which executes code with access to the plugin's internals.
*/

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
const { Promise } = require("./promise");

const { Perm, allCommands } = commands;
const { FishPlayer } = players;
const { Rank, RoleFlag } = ranks;
const { menu } = menus;

Object.assign(this as never, utils); //global scope goes brrrrr, I'm sure this will not cause any bugs whatsoever

const $ = Object.assign(
	function $(input:unknown){
		if(typeof input == "string"){
			if(Pattern.matches("[a-zA-Z0-9+/]{22}==", input)){
				return FishPlayer.getById(input);
			}
		}
		return null;
	},
	{
		sussy: true,
		info: function(input:unknown){
			if(typeof input == "string"){
				if(Pattern.matches("[a-zA-Z0-9+/]{22}==", input)){
					return Vars.netServer.admins.getInfo(input);
				}
			}
			return null;
		},
		create: function(input:unknown){
			if(typeof input == "string"){
				if(Pattern.matches("[a-zA-Z0-9+/]{22}==", input)){
					return FishPlayer.getFromInfo(Vars.netServer.admins.getInfo(input));
				}
			}
			return null;
		},
	}
);

/** Used to persist variables. */
const vars = {};

export function runJS(input:string, outputFunction?:(data:any) => unknown, errorFunction?:(data:any) => unknown){
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
