const api = require("./api");
const commands = require("./commands");
const config = require("./config");
const consoleCommands = require("./consoleCommands");
const globals = require("./globals");
const memberCommands = require("./api");
const menus = require("./menus");
const ohno = require("./ohno");
const packetHandlers = require("./packetHandlers");
const playerCommands = require("./playerCommands");
const players = require("./players");
const ranks = require("./ranks");
const staffCommands = require("./staffCommands");
const timers = require("./timers");
const utils = require("./utils");

const { Perm } = commands;
const { FishPlayer } = players;
const { Ranks } = ranks;



exports.runJS = function(input){
	try {
		const output = eval(input);
		if(output instanceof Array){
			Log.info("&cArray: [&fr" + output.join(", ") + "&c]&fr");
		} else if(output === undefined){
			Log.info("undefined");
		} else {
			Log.info(output);
		}
	} catch(err){
		Log.err(err);
	}
}