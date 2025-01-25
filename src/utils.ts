/*
Copyright © BalaM314, 2024. All Rights Reserved.
This file contains many utility functions.
*/

import * as api from './api';
import { fail } from './commands';
import { Gamemode, GamemodeName, adminNames, bannedWords, text, multiCharSubstitutions, substitutions } from "./config";
import { crash, escapeStringColorsServer, escapeTextDiscord, parseError, StringIO } from './funcs';
import { maxTime } from "./globals";
import { fishState, ipPattern, ipPortPattern, ipRangeCIDRPattern, ipRangeWildcardPattern, tileHistory, uuidPattern } from './globals';
import { FishPlayer } from "./players";
import { Boolf, PartialFormatString, SelectEnumClassKeys } from './types';


export function formatTime(time:number){

	if(maxTime - (time + Date.now()) < 20000) return "forever";

	const months = Math.floor(time / (30 * 24 * 60 * 60 * 1000));
	const days = Math.floor((time % (30 * 24 * 60 * 60 * 1000)) / (24 * 60 * 60 * 1000));
	const hours = Math.floor((time % (24 * 60 * 60 * 1000)) / (60 * 60 * 1000));
	const minutes = Math.floor((time % (60 * 60 * 1000)) / (60 * 1000));
	const seconds = Math.floor((time % (60 * 1000)) / (1000));

	return [
		months && `${months} month${months != 1 ? "s" : ""}`,
		days && `${days} day${days != 1 ? "s" : ""}`,
		hours && `${hours} hour${hours != 1 ? "s" : ""}`,
		minutes && `${minutes} minute${minutes != 1 ? "s" : ""}`,
		(seconds || time < 1000) && `${seconds} seeeeeeecond${seconds != 1 ? "s" : ""}`,
	].filter(Boolean).join(", ")
}

//TODO move this data to be right next to Mode
export function formatModeName(name:GamemodeName){
	return {Debug
		"attack": "Attack",
		"survival": "Survival",
		"hexed": "Hexed",
		"pvp": "PVP",
		"sandbox": "Sandbox",
		"hardcore": "Hardcore"
	}[name];
}

export function formatTimestamp(time:number){
	const date = new Date(time);
	return `${date.toDateString()}, ${date.toTimeString()}`;
}

export function formatTimeRelative(time:number, raw?:boolean){
	const difference = Math.abs(time - Date.now());

	if(difference < 1000)
		return "just now";
	else if(time > Date.now())
		return (raw ? "" : "in ") + formatTime(difference);
	else
		return formatTime(difference) + (raw ? "" : " ago");
}

export function colorBoolean(val:boolean){
	return val ? `[green]true[]` : `[red]false[]`
}

export function colorBadBoolean(val:boolean){
	return val ? `[red]true[]` : `[green]false[]`
}

/** Attempts to parse a Color from the input. */
export function getColor(input:string):Color | null {
	try {
		if(input.includes(',')){
			let formattedColor = input.split(',');
			const col = {
				r: Number(formattedColor[0]),
				g: Number(formattedColor[1]),
				b: Number(formattedColor[2]),
				a: 255,
			};
			return new Color(col.r, col.g, col.b, col.a);
		} else if(input.includes('#')){
			return Color.valueOf(input);
		} else if(((input):input is SelectEnumClassKeys<typeof Color> => input in Color)(input)){
			return Color[input];
		} else {
			return null;
		}
	} catch(e){
		return null;
	}
}

/** Searches for an enemy tile near a unit. */
export function nearbyEnemyTile(unit:Unit, dist:number):Building | null {
	//because the indexer is buggy
	if(dist > 10) crash(`nearbyEnemyTile(): dist (${dist}) is too high!`);

	let x = Math.floor(unit.x / Vars.tilesize);
	let y = Math.floor(unit.y / Vars.tilesize);
	for(let i = -dist; i <= dist; i ++){
		for(let j = -dist; j <= dist; j ++){
			let build = Vars.world.build(x + i, y + j);
			if(build && build.team != unit.team && build.team != Team.derelict) return build;
		}
	}
	return null;
}

/** Attempts to parse a Team from the input. */
export function getTeam(team:string):Team | string {
	if(team in Team && Team[team as keyof typeof Team] instanceof Team) return Team[team as keyof typeof Team] as Team;
	else if(Team.baseTeams.find(t => t.name.includes(team.toLowerCase()))) return Team.baseTeams.find(t => t.name.includes(team.toLowerCase()))!;
	else if(!isNaN(Number(team))) return `"${team}" is not a valid team string. Did you mean "#${team}"?`;
	else if(!isNaN(Number(team.slice(1)))){
		const num = Number(team.slice(1));
		if(num <= 255 && num >= 0 && Number.isInteger(num))
			return Team.all[Number(team.slice(1))];
		else
			return `Team ${team} is outside the valid range (integers 0-255).`;
	}
	return `"${team}" is not a valid team string.`;
}

/** Attempts to parse an Item from the input. */
export function getItem(item:string):Item | string {
	if(item in Items && Items[item as keyof typeof Items] instanceof Item) return Items[item as keyof typeof Items] as Item;
	else if(Vars.content.items().find(t => t.name.includes(item.toLowerCase()))) return Vars.content.items().find(t => t.name.includes(item.toLowerCase()));
	return `"${item}" is not a valid item.`;
}


/**
 * @param wordList "chat" is least strict, followed by "strict", and "name" is most strict.
 * @returns a
 */
export function matchFilter(input:string, wordList = "chat" as "chat" | "strict" | "name", aggressive = false):false | string | [string] {
	const currentBannedWords = [
		bannedWords.normal,
		(wordList == "strict" || wordList == "name") && bannedWords.strict,
		wordList == "name" && bannedWords.names,
	].filter(Boolean).flat();
	if(aggressive) currentBannedWords.push(["hitler", []]);
	//Replace substitutions
	const variations = [input, cleanText(input, false)];
	if(aggressive) variations.push(cleanText(input, true));
	for(const [banned, whitelist] of currentBannedWords){
		for(const text of variations){
			if(banned instanceof RegExp ? banned.test(text) : text.includes(banned)){
				let modifiedText = text;
				whitelist.forEach(w => modifiedText = modifiedText.replace(new RegExp(w, "g"), "")); //Replace whitelisted words with nothing
				if(banned instanceof RegExp ? banned.test(modifiedText) : modifiedText.includes(banned)) //If the text still matches, fail
					return (
						banned === uuidPattern ? `a Mindustry UUID` :
						banned === ipPattern || banned === ipPortPattern ? `an IP address` :
						//parsing regex with regex, massive hack
						banned instanceof RegExp ? banned.source.replace(/\\b|\(\?\<\!.+?\)|\(\?\!.+?\)/g, "") :
						banned
					);
			}
		}
	}
	return false;
}

const foosPattern = Pattern.compile(/[\u0F80-\u107F]{2}$/.source);
export function removeFoosChars(text:string):string {
	return foosPattern.matcher(text).replaceAll("");
}

export function cleanText(text:string, applyAntiEvasion = false){
	//Replace substitutions
	let replacedText =
		multiCharSubstitutions.reduce((acc, [from, to]) => acc.replace(from, to),
			Strings.stripColors(removeFoosChars(text))
			.split("").map(c => substitutions[c] ?? c).join("")
		)
		.toLowerCase()
		.trim();
	if(applyAntiEvasion){
		replacedText = replacedText.replace(new RegExp(`[^a-zA-Z0-9]`, "gi"), "");
	}
	return replacedText;
}

export function isImpersonator(name:string, isAdmin:boolean):false | string {
	const replacedText = cleanText(name);
	const antiEvasionText = cleanText(name, true);
	//very clean code i know
	const filters:[check:Boolf<string>, message:string][] = (
		(input: (string | [string | RegExp | Boolf<string>, string])[]) =>
		input.map(i =>
			Array.isArray(i)
			? [
				typeof i[0] == "string" ? replacedText => replacedText.includes(<string>i[0]) :
				i[0] instanceof RegExp ? replacedText => (<RegExp>i[0]).test(replacedText) :
				i[0],
				i[1]
			]
			: [
				replacedText => replacedText.includes(i),
				`Name contains disallowed ${i.length == 1 ? "icon" : "word"} ${i}`
			]
		)
	)([
		"server", "admin", "moderator", "staff",
		[">|||>", "Name contains >|||> which is reserved for the server owner"],
		"\uE817", "\uE82C", "\uE88E", "\uE813",
		[/^<.{1,3}>/, "Name contains a prefix such as <a> which is used for role prefixes"],
		[(replacedText) => !isAdmin && adminNames.includes(replacedText.replace(/ /g, "")), "One of our admins uses this name"]
	]);
	for(const [check, message] of filters){
		if(check(replacedText)) return message;
		if(check(antiEvasionText)) return message;
	}
	return false;
}

export function logAction(action:string):void;
export function logAction(action:string, by:FishPlayer):void;
export function logAction(action:string, by:FishPlayer | string, to:FishPlayer | PlayerInfo | string, reason?:string, duration?:number):void;
export function logAction(action:string, by?:FishPlayer | string, to?:FishPlayer | PlayerInfo | string, reason?:string, duration?:number) {
	if(by === undefined){ //overload 1
		api.sendModerationMessage(
`${action}
**Server:** ${Gamemode.name()}`
		);
		return;
	}
	if(to === undefined){ //overload 2
		api.sendModerationMessage(
`${(by as FishPlayer).cleanedName} ${action}
**Server:** ${Gamemode.name()}`
		);
		return;
	}
	if(to){ //overload 3
		let name:string, uuid:string, ip:string;
		let actor:string = typeof by === "string" ? by : by.name;
		if(to instanceof FishPlayer){
			name = escapeTextDiscord(to.name);
			uuid = to.uuid;
			ip = to.ip();
		} else if(typeof to == "string"){
			if(uuidPattern.test(to)){
				name = `[${to}]`;
				uuid = to;
				ip = "[unknown]";
			} else {
				name = to;
				uuid = "[unknown]";
				ip = "[unknown]";
			}
		} else {
			name = escapeTextDiscord(to.lastName);
			uuid = to.id;
			ip = to.lastIP;
		}
		api.sendModerationMessage(
`${actor} ${action} ${name} ${duration ? `for ${formatTime(duration)} ` : ""}${reason ? `with reason ${escapeTextDiscord(reason)}` : ""}
**Server:** ${Gamemode.name()}
**uuid:** \`${uuid}\`
**ip**: \`${ip}\``
		);
		return;
	}
}

/** @returns the number of milliseconds. */
export function parseTimeString(str:string):number | null {
	const formats = (<[RegExp, number][]>[
		[/(\d+)s/, 1],
		[/(\d+)m/, 60],
		[/(\d+)h/, 3600],
		[/(\d+)d/, 86400],
		[/(\d+)w/, 604800]
	]).map(([regex, mult]) => [Pattern.compile(regex.source), mult] as const);
	if(str == "forever") return (maxTime - Date.now() - 10000);
	for(const [pattern, mult] of formats){
		//rhino regex doesn't work
		const matcher = pattern.matcher(str);
		if(matcher.matches()){
			const num = Number(matcher.group(1));
			if(!isNaN(num)) return (num * mult) * 1000;
		}
	}
	return null;
}

/** Triggers the restart countdown. Execution always returns from this function. */
export function serverRestartLoop(sec:number):void {
	if(sec > 0){
		if(sec < 15 || sec % 5 == 0) Call.sendMessage(`[scarlet]Server restarting in: ${sec}`);
		fishState.restartLoopTask = Timer.schedule(() => serverRestartLoop(sec - 1), 1);
	} else {
		Log.info(`Restarting...`);
		Core.settings.manualSave();
		FishPlayer.saveAll();
		const file = Vars.saveDirectory.child('1' + '.' + Vars.saveExtension);
		Vars.netServer.kickAll(Packets.KickReason.serverRestarting);
		Core.app.post(() => {
			SaveIO.save(file);
			Core.app.exit();
		});
	}
}

export function isBuildable(block:Block){
	return block == Blocks.powerVoid || (block.buildType != Blocks.air.buildType && !(block instanceof ConstructBlock));
}

export function getUnitType(type:string):Unit | string {
	validUnits ??= Vars.content.units().select((u:UnitType) => !(u instanceof MissileUnitType || u.internal));
	let temp;
	if(temp = validUnits!.find(u => u.name == type)) return temp;
	else if(temp = validUnits!.find((t:UnitType) => t.name.includes(type.toLowerCase()))) return temp;
	return `"${type}" is not a valid unit type.`;
}

//TODO refactor this, lots of duped code across multiple select functions
export function getMap(name:string):MMap | "none" | "multiple" {
	if(name == "") return "none";
	const mode = Vars.state.rules.mode();
	const maps = Vars.maps.all() /*.select(m => mode.valid(m))*/; //this doesn't work...
	
	const filters:((m:MMap) => boolean)[] = [
		//m => m.name() === name, //exact match
		m => m.name().replace(/ /g, "_") === name, //exact match with spaces replaced
		m => m.name().replace(/ /g, "_").toLowerCase() === name.toLowerCase(), //exact match with spaces replaced ignoring case
		m => m.plainName().replace(/ /g, "_").toLowerCase() === name.toLowerCase(), //exact match with spaces replaced ignoring case and colors
		m => m.plainName().toLowerCase().includes(name.toLowerCase()), //partial match ignoring case and colors
		m => m.plainName().replace(/ /g, "_").toLowerCase().includes(name.toLowerCase()), //partial match with spaces replaced ignoring case and colors
		m => m.plainName().replace(/ /g, "").toLowerCase().includes(name.toLowerCase()), //partial match with spaces removed ignoring case and colors
		m => m.plainName().replace(/[^a-zA-Z]/gi, "").toLowerCase().includes(name.toLowerCase()), //partial match with non-alphabetic characters removed ignoring case and colors
	];
	
	for(const filter of filters){
		const matchingMaps = maps.select(filter);
		if(matchingMaps.size == 1) return matchingMaps.get(0)!;
		else if(matchingMaps.size > 1) return "multiple";
		//if empty, go to next filter
	}
	//no filters returned a result
	return "none";
}

let buildableBlocks:Seq<Block> | null = null;
let validUnits:Seq<UnitType> | null = null;

export function getBlock(block:string, filter:"buildable" | "air" | "all"):Block | string {
	buildableBlocks ??= Vars.content.blocks().select(isBuildable);
	const check = ({
		buildable: b => isBuildable(b),
		air: b => b == Blocks.air || isBuildable(b),
		all: b => true
	} satisfies Record<string, (b:Block) => boolean>)[filter];
	let out:Block;
	if(block in Blocks && Blocks[block] instanceof Block && check(Blocks[block])) return Blocks[block];
	else if(out = Vars.content.blocks().find(t => t.name.includes(block.toLowerCase()) && check(t))) return out;
	else if(out = Vars.content.blocks().find(t => t.name.replace(/-/g, "").includes(block.toLowerCase().replace(/ /g, "")) && check(t))) return out;
	else if(block.includes("airblast")) return Blocks.blastDrill;
	return `"${block}" is not a valid block.`;
}

export function teleportPlayer(player:mindustryPlayer, to:mindustryPlayer){
	Timer.schedule(() => {
		player.unit().set(to.unit().x, to.unit().y);
		Call.setPosition(player.con, to.unit().x, to.unit().y);
		Call.setCameraPosition(player.con, to.unit().x, to.unit().y);
	}, 0, 0.016, 10);
}

export function logErrors<T extends (...args:any[]) => unknown>(message:string, func:T):T {
	return function(...args:any[]){
		try {
			return func(...args);
		} catch(err){
			Log.err(message)
			Log.err(parseError(err));
		}
	} as T;
}

export function definitelyRealMemoryCorruption(){
	Log.info(`Triggering a prank: this will cause players to see two error messages claiming to be from a memory corruption, and cause a flickering amount of fissile matter and dormant cysts to be put in the core.`);
	FishPlayer.messageStaff(`[gray]<[cyan]staff[gray]> [white]Activating memory corruption prank! (please don't ruin it by telling players what is happening, pretend you dont know)`);
	api.sendModerationMessage(`Activated memory corruption prank on server ${Vars.state.rules.mode().name()}`);
	let t1f = false;
	let t2f = false;
	fishState.corruption_t1 = Timer.schedule(() => Vars.state.rules.defaultTeam.data().cores.first().items.set(Items.dormantCyst, (t1f = t1f !== true) ? 69 : 420), 0, 0.4, 600);
	fishState.corruption_t2 = Timer.schedule(() => Vars.state.rules.defaultTeam.data().cores.first().items.set(Items.fissileMatter, (t2f = t2f !== true) ? 999 : 123), 0, 1.5, 200);
	const hexString = Math.floor(Math.random() * 0xFFFFFFFF).toString(16).padStart(8, "0");
	Call.sendMessage("[scarlet]Error: internal server error.");
	Call.sendMessage(`[scarlet]Error: memory corruption: mindustry.world.modules.ItemModule@${hexString}`);
}

export function getEnemyTeam():Team {
	if(Gamemode.pvp()) return Team.derelict;
	else return Vars.state.rules.waveTeam;
}

export function neutralGameover(){
	FishPlayer.ignoreGameover(() => {
		if(Gamemode.hexed()) serverRestartLoop(15);
		else Events.fire(new EventType.GameOverEvent(getEnemyTeam()));
	});
}

/** Please validate wavesToSkip to ensure it is not huge */
export function skipWaves(wavesToSkip:number, runIntermediateWaves:boolean){
	if(runIntermediateWaves){
		for(let i = 0; i < wavesToSkip; i ++){
			Vars.logic.skipWave();
		}
	} else {
		Vars.state.wave += wavesToSkip - 1;
		Vars.logic.skipWave();
	}
}

export function logHTrip(player:FishPlayer, name:string, message?:string){
	Log.warn(`&yPlayer &b"${player.cleanedName}"&y (&b${player.uuid}&y/&b${player.ip()}&y) tripped &c${name}&y` + (message ? `: ${message}` : ""));
	FishPlayer.messageStaff(`[yellow]Player [blue]"${player.cleanedName}"[] tripped [cyan]${name}[]` + (message ? `: ${message}` : ""));
	api.sendModerationMessage(`Player \`${player.cleanedName}\` (\`${player.uuid}\`/\`${player.ip()}\`) tripped **${name}**${message ? `: ${message}` : ""}\n**Server:** ${Gamemode.name()}`);
}

export function setType<T>(input:unknown):asserts input is T {}

export function untilForever(){
	return (maxTime - Date.now() - 10000);
}

export function colorNumber(number:number, getColor:(number:number) => string, side:"server" | "client" = "client"):string {
	return getColor(number) + number.toString() + (side == "client" ? "[]" : "&fr");
}

export function getAntiBotInfo(side:"client" | "server"){
	let color = side == "client" ? "[acid]" : "&ly";
	let True = side == "client" ? "[red]true[]" : "&lrtrue";
	let False = side == "client" ? "[green]false[]" : "&gfalse";
	return (
`${color}Flag count(last 1 minute period): ${FishPlayer.flagCount}
${color}Autobanning flagged players: ${FishPlayer.shouldWhackFlaggedPlayers() ? True : False}
${color}Kicking new players: ${FishPlayer.shouldKickNewPlayers() ? True : False}
${color}Recent connect packets(last 1 minute period): ${FishPlayer.playersJoinedRecent}
${color}Override: ${FishPlayer.antiBotModeOverride ? True : False}`
	);
}

const failPrefix = "[scarlet]\u26A0 [yellow]";
const successPrefix = "[#48e076]\uE800 ";

export function outputFail(message:string | PartialFormatString, sender:mindustryPlayer | FishPlayer){
	sender.sendMessage(failPrefix + (typeof message == "function" && "__partialFormatString" in message ? message("[yellow]") : message));
}
export function outputSuccess(message:string | PartialFormatString, sender:mindustryPlayer | FishPlayer){
	sender.sendMessage(successPrefix + (typeof message == "function" && "__partialFormatString" in message ? message("[#48e076]") : message));
}
export function outputMessage(message:string | PartialFormatString, sender:mindustryPlayer | FishPlayer){
	sender.sendMessage(((typeof message == "function" && "__partialFormatString" in message ? message(null) : message) + "").replace(/\t/g, " ".repeat(4)));
}
export function outputConsole(message:string | PartialFormatString, channel:(typeof Log)[keyof typeof Log] = Log.info){
	channel(typeof message == "function" && "__partialFormatString" in message ? message("") : message);
}

export function updateBans(message?:(player:mindustryPlayer) => string){
	Groups.player.each(player => {
		if(Vars.netServer.admins.isIDBanned(player.uuid())){
			player.con.kick(Packets.KickReason.banned);
			if(message)
				Call.sendMessage(message(player));
		}
	});
}

export function processChat(player:mindustryPlayer, message:string, effects = false){
	const fishPlayer = FishPlayer.get(player);
	let highlight = fishPlayer.highlight;
	let filterTripText;
	const suspicious = fishPlayer.joinsLessThan(3);
	if(
		(!fishPlayer.hasPerm("bypassChatFilter") || fishPlayer.chatStrictness == "strict")
		&& (filterTripText = matchFilter(message, fishPlayer.chatStrictness, suspicious))
	){
		if(effects){
			if(
				suspicious && removeFoosChars(message).split(" ")
					.map(w => w.replace(/[-_.^*,]/g, ""))
					.some(w => bannedWords.autoWhack.includes(w))
			){
				logHTrip(fishPlayer, "bad words in chat", `message: \`${message}\``);
				fishPlayer.muted = true;
				fishPlayer.stop("automod", maxTime, `Automatic stop due to suspicious activity`, false);
			}
			Log.info(`Censored message from player ${player.name}: "${escapeStringColorsServer(message)}"; contained "${filterTripText}"`);
			FishPlayer.messageStaff(`[yellow]Censored message from player ${fishPlayer.cleanedName}: "${message}" contained "${filterTripText}"`);
		}
		message = text.chatFilterReplacement.message();
		highlight ??= text.chatFilterReplacement.highlight();
	}

	if(message.startsWith("./")) message = message.replace("./", "/");

	if(!fishPlayer.hasPerm("chat")){
		if(effects){
			FishPlayer.messageMuted(player.name, message);
			Log.info(`<muted>${player.name}: ${message}`);
		}
		return null;
	}

	return (highlight ?? "") + message;
}

export const addToTileHistory = logErrors("Error while saving a tilelog entry", (e:any) => {

	let tile:Tile, uuid:string, action:string, type:string, time:number = Date.now();
	if(e instanceof EventType.BlockBuildBeginEvent){
		tile = e.tile;
		uuid = e.unit?.player?.uuid() ?? e.unit?.type.name ?? "unknown";
		if(e.breaking){
			action = "broke";
			type = (e.tile.build instanceof ConstructBlock.ConstructBuild) ? e.tile.build.previous.name : "unknown";
			if(e.unit?.player?.uuid() && e.tile.build?.team != Team.derelict){
				const fishP = FishPlayer.get(e.unit.player);
				//TODO move this code
				fishP.tstats.blocksBroken ++;
				fishP.stats.blocksBroken ++;
			}
		} else {
			action = "built";
			type = (e.tile.build instanceof ConstructBlock.ConstructBuild) ? e.tile.build.current.name : "unknown";
			if(e.unit?.player?.uuid()){
				const fishP = FishPlayer.get(e.unit.player);
				//TODO move this code
				fishP.stats.blocksPlaced ++;
			}
		}
	} else if(e instanceof EventType.ConfigEvent){
		tile = e.tile.tile;
		uuid = e.player?.uuid() ?? "unknown";
		action = "configured";
		type = e.tile.block.name;
	} else if(e instanceof EventType.BuildRotateEvent){
		tile = e.build.tile;
		uuid = e.unit?.player?.uuid() ?? e.unit?.type.name ?? "unknown";
		action = "rotated";
		type = e.build.block.name;
	} else if(e instanceof EventType.UnitDestroyEvent){
		tile = e.unit.tileOn();
		if(!tile) return;
		if(!e.unit.type.playerControllable) return;
		uuid = e.unit.isPlayer() ? e.unit.getPlayer().uuid() : e.unit.lastCommanded ?? "unknown";
		action = "killed";
		type = e.unit.type.name;
	} else if(e instanceof EventType.BlockDestroyEvent){
		if(Gamemode.attack() && e.tile.build?.team != Vars.state.rules.defaultTeam) return; //Don't log destruction of enemy blocks
		tile = e.tile;
		uuid = "[[something]";
		action = "killed";
		type = e.tile.block()?.name ?? "air";
	} else if(e instanceof EventType.PayloadDropEvent){
		action = "pay-dropped";
		const controller = e.carrier.controller();
		uuid = e.carrier.player?.uuid() ?? (controller instanceof LogicAI ? `${e.carrier.type.name} controlled by ${controller.controller.block.name} at ${controller.controller.tileX()},${controller.controller.tileY()} last accessed by ${e.carrier.getControllerName()}` : null) ?? e.carrier.type.name;
		if(e.build){
			tile = e.build.tile;
			type = e.build.block.name;
		} else if(e.unit){
			tile = e.unit.tileOn();
			if(!tile) return;
			type = e.unit.type.name;
		} else return;
	} else if(e instanceof EventType.PickupEvent){
		action = "picked up";
		if(e.carrier.isPlayer()) return; //This event would have been handled by actionfilter
		const controller = e.carrier.controller();
		if(!(controller instanceof LogicAI)) return;
		uuid = `${e.carrier.type.name} controlled by ${controller.controller.block.name} at ${controller.controller.tileX()},${controller.controller.tileY()} last accessed by ${e.carrier.getControllerName()}`
		if(e.build){
			tile = e.build.tile;
			type = e.build.block.name;
		} else if(e.unit){
			tile = e.unit.tileOn();
			if(!tile) return;
			type = e.unit.type.name;
		} else return;
	} else if(e instanceof Object && "pos" in e && "uuid" in e && "action" in e && "type" in e){
		let pos;
		({pos, uuid, action, type} = e);
		tile = Vars.world.tile(pos.split(",")[0], pos.split(",")[1]) ?? crash(`Cannot log ${action} at ${pos}: Nonexistent tile`);
	} else return;
	if(tile == null) return;
	[tile, uuid, action, type, time] satisfies [Tile, string, string, string, number];

	tile.getLinkedTiles(t => {
		const pos = `${t.x},${t.y}`;
		let existingData = tileHistory[pos] ? StringIO.read(tileHistory[pos], str => str.readArray(d => ({
			action: d.readString(2),
			uuid: d.readString(3),
			time: d.readNumber(16),
			type: d.readString(2),
		}), 1)) : [];
	
		existingData.push({
			action, uuid, time, type
		});
		if(existingData.length >= 9){
			existingData = existingData.splice(0, 9);
		}
		//Write
		tileHistory[t.x + ',' + t.y] = StringIO.write(existingData, (str, data) => str.writeArray(data, el => {
			str.writeString(el.action, 2);
			str.writeString(el.uuid, 3);
			str.writeNumber(el.time, 16);
			str.writeString(el.type, 2);
		}, 1));
	});
	
});

export function getIPRange(input:string, error?:(message:string) => never):string | null {
	if(ipRangeCIDRPattern.test(input)){
		const [ip, maskLength] = input.split("/");
		switch(maskLength){
			case "24":
				return ip.split(".").slice(0, 3).join(".") + ".";
			case "16":
				return ip.split(".").slice(0, 2).join(".") + ".";
			default:
				error?.(`Mindustry does not currently support netmasks other than /16 and /24`);
				return null;
		}
	} else if(ipRangeWildcardPattern.test(input)){
		//1.2.3.*
		//1.2.*
		const [a, b, c, d] = input.split(".");
		if(c !== "*") return `${a}.${b}.${c}.`;
		return `${a}.${b}.`;
	} else return null;
}

//this brings me physical pain
export function getHash(file: Fi, algorithm: string = "SHA-1"): string | undefined {
	try {
		const header = `blob ${file.length()}\0`;
		const fileSHAHeader = Packages.java.nio.charset.StandardCharsets.UTF_8.encode(header);
		const contents = file.readBytes();
		const buffer = Packages.java.nio.ByteBuffer.allocate(fileSHAHeader.remaining() + contents.length) as ByteBuffer;
		buffer.put(fileSHAHeader);
		buffer.put(contents);
		buffer.flip();
		const digest = Packages.java.security.MessageDigest.getInstance(algorithm) as MessageDigest;
		digest.update(buffer);
		return digest.digest().map(byte =>
			(byte & 0xFF).toString(16).padStart(2, "0")
		).join("");
	} catch (e) {
		Log.err(`Cannot generate ${algorithm}, ${e}`);
		return undefined;
	}
}

export function match<K extends PropertyKey, O extends Record<K, unknown>>(value:K, clauses:O):O[K];
export function match<K extends PropertyKey, const O extends Partial<Record<K, unknown>>, D>(value:K, clauses:O, defaultValue:D):O[K & keyof O] | D;
export function match(value:PropertyKey, clauses:Record<PropertyKey, unknown>, defaultValue?:unknown):unknown {
	return Object.prototype.hasOwnProperty.call(clauses, value) ? clauses[value] : defaultValue;
}

/** @throws CommandError */
export function fishCommandsRootDirPath():Path {
	const commandsDir = Vars.modDirectory.child("fish-commands");
	if(!commandsDir.exists())
		fail(`Fish commands directory at path ${commandsDir.absolutePath()} does not exist!`);
	let fishCommandsRootDirPath = Paths.get(commandsDir.file().path);
	if(Packages.java.nio.file.Files.isSymbolicLink(fishCommandsRootDirPath)){
		//fish-commands is linked to the build directory of somewhere else
		//resolve and get the parent directory of the build directory
		fishCommandsRootDirPath = fishCommandsRootDirPath.toRealPath().getParent();
	}
	return fishCommandsRootDirPath;
}
