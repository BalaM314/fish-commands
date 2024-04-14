import * as api from './api';
import { Mode, adminNames, bannedInNamesWords, bannedWords, getGamemode, maxTime, multiCharSubstitutions, strictBannedWords, substitutions } from "./config";
import { fishState, uuidPattern } from './globals';
import { FishPlayer } from "./players";
import { Rank } from './ranks';
import { Boolf, PartialFormatString, TagFunction } from './types';

export function logg(msg:string){ Call.sendMessage(msg); }
export function list(ar:unknown[]){ Call.sendMessage(ar.join(' | ')); }
export function keys(obj:Record<string, unknown>){ Call.sendMessage(Object.keys(obj).join(' [scarlet]|[white] ')); }

const storedValues:Record<string, {
	value: unknown;
	dep: unknown[];
}> = {};
/**
 * Stores the output of a function and returns that value
 * instead of running the function again unless any
 * dependencies have changed to improve performance with
 * functions that have expensive computation.
 * @param callback function to run if a dependancy has changed
 * @param dep dependency array of values to monitor
 * @param id arbitrary unique id of the function for storage purposes.
 */
export function memoize<T>(callback: () => T, dep:unknown[], id:number | string):T {
	if(!storedValues[id]){
		storedValues[id] = { value: callback(), dep };
	} else if(dep.some((d, ind) => d !== storedValues[id].dep[ind])){
		//If the value changed
		storedValues[id].value = callback();
		storedValues[id].dep = dep;
	}
	return storedValues[id].value as T;
}


export function formatTime(time:number){

	if(maxTime - (time + Date.now()) < 20000) return "forever";

	const months = Math.floor(time / (30 * 24 * 60 * 60 * 1000));
	const days = Math.floor((time % (30 * 24 * 60 * 60 * 1000)) / (24 * 60 * 60 * 1000));
	const hours = Math.floor((time % (24 * 60 * 60 * 1000)) / (60 * 60 * 1000));
	const minutes = Math.floor((time % (60 * 60 * 1000)) / (60 * 1000));
	const seconds = Math.floor((time % (60 * 1000)) / (1000));

	return [
		months && `${months} months`,
		days && `${days} days`,
		hours && `${hours} hours`,
		minutes && `${minutes} minutes`,
		seconds && `${seconds} seconds`,
	].filter(s => s).join(", ")
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

export function to2DArray<T>(array:T[], width:number){
	if(array.length == 0) return [];
	let output:T[][] = [[]];
	array.forEach(el => {
		if(output.at(-1)!.length >= width){
			output.push([]);
		}
		output.at(-1)!.push(el);
	});
	return output;
}

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
		} else if(input in Color){
			return Color[input];
		} else {
			return null;
		}
	} catch(e){
		return null;
	}
}

export function nearbyEnemyTile(unit:Unit, dist:number){
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

export function setToArray<T>(set:ObjectSet<T> | EntityGroup<T>):T[] {
	const array:T[] = [];
	set.each(item => array.push(item));
	return array;
}

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


export class StringBuilder {
	constructor(public str:string = ""){}
	add(str:string){
		this.str += str;
		return this;
	}
	chunk(str:string){
		if(Strings.stripColors(str).length > 0){
			this.str = this.str + " " + str;
		}
		return this;
	}
}

export class StringIO {
	offset:number = 0;
	constructor(public string:string = ""){}
	read(length:number = 1){
		if(this.offset + length > this.string.length) crash(`Unexpected EOF`);
		return this.string.slice(this.offset, this.offset += length);
	}
	write(str:string){
		this.string += str;
	}
	readString(/** The length of the written length. */lenlen:number = 3){
		const length = parseInt(this.read(lenlen));
		if(length == 0) return null;
		return this.read(length);
	}
	writeString(str:string | null, lenlen:number = 3, truncate = false){
		if(str === null){
			this.string += "0".repeat(lenlen);
		} else if(typeof str !== "string"){
			crash(`Attempted to serialize string ${str}, but it was not a string`);
		} else if(str.length > (10 ** lenlen - 1)){
			if(truncate){
				Log.err(`Cannot write strings with length greater than ${(10 ** lenlen - 1)} (was ${str.length}), truncating`);
				this.string += (10 ** lenlen - 1).toString().padStart(lenlen, "0");
				this.string += str.slice(0, (10 ** lenlen - 1));
			} else {
				crash(`Cannot write strings with length greater than ${(10 ** lenlen - 1)} (was ${str.length})\n String was: "${str}"`);
			}
		} else {
			this.string += str.length.toString().padStart(lenlen, "0");
			this.string += str;
		}
	}
	readEnumString<const T>(options:T[]):T {
		const length = (options.length - 1).toString().length;
		const option = this.readNumber(length);
		return options[option];
	}
	writeEnumString<const T>(value:T, options:T[]){
		const length = (options.length - 1).toString().length;
		const option = options.indexOf(value);
		if(option == -1) crash(`Attempted to write invalid value "${value}" for enum, valid values are (${options.join(", ")})`);
		this.writeNumber(option, length);
	}
	readNumber(size:number = 4){
		let data = this.read(size);
		if(/^0*-\d+$/.test(data)){
			//negative numbers were incorrectly stored in previous versions
			data = "-" + data.split("-")[1];
		}
		if(isNaN(Number(data))) crash(`Attempted to read invalid number: ${data}`);
		return Number(data);
	}
	writeNumber(num:number, size:number = 4, clamp = false){
		if(typeof num != "number") crash(`${num} was not a number!`);
		if(num.toString().length > size){
			if(clamp){
				if(num > (10 ** size) - 1) this.string += (10 ** size) - 1;
				else this.string += num.toString().slice(0, size);
			} else crash(`Cannot write number ${num} with length ${size}: too long`);
		}
		this.string += num.toString().padStart(size, "0");
	}
	readBool(){
		return this.read(1) == "T" ? true : false;
	}
	writeBool(val:boolean){
		this.write(val ? "T" : "F");
	}
	writeArray<T>(array:T[], func:(item:T, str:StringIO) => unknown, lenlen?:number){
		this.writeNumber(array.length, lenlen);
		array.forEach(e => func(e, this));
	}
	readArray<T>(func:(str:StringIO) => T, lenlen?:number):T[] {
		const length = this.readNumber(lenlen);
		const array:T[] = [];
		for(let i = 0; i < length; i ++){
			array[i] = func(this);
		}
		return array;
	}
	expectEOF(){
		if(this.string.length > this.offset) crash(`Expected EOF, but found extra data: "${this.string.slice(this.offset)}"`);
	}
	static read<T>(data:string, func:(str:StringIO) => T):T {
		const str = new StringIO(data);
		try {
			return func(str);
		} catch(err){
			Log.err(`Error while reading compressed data!`);
			Log.err(data);
			throw err;
		}
	}
	static write<T>(data:T, func:(str:StringIO, data:T) => unknown):string {
		const str = new StringIO();
		func(str, data);
		return str.string;
	}
}

export function capitalizeText(text:string):string {
	return text
		.split(" ")
		.map((word, i, arr) =>
			(["a", "an", "the", "in", "and", "of", "it"].includes(word) &&
			i !== 0 && i !== arr.length - 1)?
			word : word[0].toUpperCase() + word.substring(1)
		).join(" ");
}

const pattern = Pattern.compile(`([*\\_~\`|:])`);
export function escapeTextDiscord(text:string):string {
	return pattern.matcher(text).replaceAll("\\\\$1");
}

/**
 * @param strict "chat" is least strict, followed by "strict", and "name" is most strict.
 * @returns 
 */
export function matchFilter(input:string, strict = "chat" as "chat" | "strict" | "name"):false | string {
	//Replace substitutions
	for(const [banned, whitelist] of bannedWords.concat(strict == "strict" || strict == "name" ? strictBannedWords : []).concat(strict == "name" ? bannedInNamesWords : [])){
		for(const text of [input, cleanText(input, false)/*, cleanText(input, true)*/]){
			if(banned instanceof RegExp ? banned.test(text) : text.includes(banned)){
				let modifiedText = text;
				whitelist.forEach(w => modifiedText = modifiedText.replace(new RegExp(w, "g"), "")); //Replace whitelisted words with nothing
				if(banned instanceof RegExp ? banned.test(modifiedText) : modifiedText.includes(banned)) //If the text still matches, fail
					return banned instanceof RegExp ? banned.source.replace(/\\b|\(\?\<\!.+?\)|\(\?\!.+?\)/g, "") : banned; //parsing regex with regex, massive hack
			}
		}
	}
	return false;
}

export function repeatAlternate(a:string, b:string, numARepeats:number){
	return Array.from({length: numARepeats * 2 - 1}, (_, i) => i % 2 ? b : a).join("");
}

export function cleanText(text:string, applyAntiEvasion = false){
	//Replace substitutions
	let replacedText =
		multiCharSubstitutions.reduce((acc, [from, to]) => acc.replace(from, to),
			Strings.stripColors(text)
			.split("").map(c => substitutions[c] ?? c).join("")
		)
		.toLowerCase()
		.trim();
	if(applyAntiEvasion){
		replacedText = replacedText.replace(new RegExp(`[^a-zA-Z]`, "gi"), "");
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
				i[0]
				, i[1]
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
**Server:** ${getGamemode()}`
		);
		return;
	}
	if(to === undefined){ //overload 2
		api.sendModerationMessage(
`${(by as FishPlayer).cleanedName} ${action}
**Server:** ${getGamemode()}`
		);
		return;
	}
	if(to){ //overload 3
		let name:string, uuid:string, ip:string;
		let actor:string = typeof by === "string" ? by : by.name;
		if(to instanceof FishPlayer){
			name = escapeTextDiscord(to.name);
			uuid = to.uuid;
			ip = to.player.ip();
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
**Server:** ${getGamemode()}
**uuid:** \`${uuid}\`
**ip**: \`${ip}\``
		);
		return;
	}
}

/**@returns the number of milliseconds. */
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

/**Prevents Mindustry from displaying color tags in a string by escaping them. Example: turns [scarlet]red to [[scarlet]red. */
export function escapeStringColorsClient(str:string):string {
	return str.replace(/\[/g, "[[");
}

// export function highlightStringColorsClient(str:string):string {
// 	return str.replace(/(?<!\[)\[[a-z0-9#]{2,10}\]/gi, "[gray][$0[]");
// }

/**Prevents Mindustry from displaying color tags in a string by escaping them. Example: turns &bamogus to &&bamogus. */
export function escapeStringColorsServer(str:string):string {
	return str.replace(/&/g, "&&");
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

export function getBlock(block:string):Block | string {
	buildableBlocks ??= Vars.content.blocks().select(isBuildable);
	if(block in Blocks && Blocks[block] instanceof Block && isBuildable(Blocks[block])) return Blocks[block];
	else if(buildableBlocks!.find((t:Block) => t.name.includes(block.toLowerCase()))) return buildableBlocks!.find((t:Block) => t.name.includes(block.toLowerCase()))!;
	else if(buildableBlocks!.find((t:Block) => t.name.replace(/-/g, "").includes(block.toLowerCase().replace(/ /g, "")))) return buildableBlocks!.find((t:Block) => t.name.replace(/-/g, "").includes(block.toLowerCase().replace(/ /g, "")))!;
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

export function parseError(thing:unknown){
	if(thing instanceof Error){
		return thing.toString();
	} else if(typeof thing == "string"){
		return thing;
	} else {
		Log.info("[[FINDTAG]] Unable to parse the following error object");
		Log.info(thing as any);
		return "Unable to parse error object";
	}
}

/** Generates a tag template processor from a function that processes one value at a time. */
export function tagProcessor<T>(
	transformer:(chunk:T, index:number, allStringChunks:readonly string[], allVarChunks:readonly T[]) => string
):TagFunction<T, string> {
	return function(stringChunks:readonly string[], ...varChunks:readonly T[]){
		return String.raw({raw: stringChunks}, ...varChunks.map((chunk, i) => transformer(chunk, i, stringChunks, varChunks)));
	}
}

//third order function ._. warning: causes major confusion
/** Generates a tag template partial processor from a function that processes one value at a time. */
export function tagProcessorPartial<Tin, Tdata>(
	transformer:(chunk:Tin, index:number, data:Tdata, allStringChunks:readonly string[], allVarChunks:readonly Tin[]) => string
):TagFunction<Tin, PartialFormatString<Tdata>> {
	return (stringChunks:readonly string[], ...varChunks:readonly Tin[]) =>
		Object.assign(
			(data:Tdata) => 
				stringChunks.map((chunk, i) => {
					if(stringChunks.length <= i) return chunk;
					return (i - 1) in varChunks ? transformer(varChunks[i - 1], i, data, stringChunks, varChunks) + chunk : chunk;
				}).join(''),
			{
				__partialFormatString: true as const
			}
		)
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
	if(Mode.pvp()) return Team.derelict;
	else return Vars.state.rules.waveTeam;
}

export function neutralGameover(){
	FishPlayer.ignoreGameover(() => {
		Events.fire(new EventType.GameOverEvent(getEnemyTeam()));
	});
}

/** Chooses a random number between 0 and max. */
export function random(max:number):number;
/** Chooses a random number between min and max. */
export function random(min:number, max:number):number;
/** Selects a random element from an array. */
export function random<T>(list:T[]):T;

export function random(arg0:unknown, arg1?:number):any {
	if(typeof arg0 == "number"){
		let max:number, min:number;
		if(arg1 == undefined){
			max = arg0;
			min = 0;
		} else {
			min = arg0;
			max = arg1;
		}
		return Math.random()*(max-min) + min;
	} else if(arg0 instanceof Array){
		return arg0[Math.floor(Math.random() * arg0.length)];
	}
}

export function logHTrip(player:FishPlayer, name:string, message?:string){
	Log.warn(`&yPlayer &b"${player.cleanedName}"&y (&b${player.uuid}&y/&b${player.ip()}&y) tripped &c${name}&y` + (message ? `: ${message}` : ""));
	FishPlayer.messageStaff(`[yellow]Player [blue]"${player.cleanedName}"[] tripped [cyan]${name}[]` + (message ? `: ${message}` : ""));
	api.sendModerationMessage(`Player \`${player.cleanedName}\` (\`${player.uuid}\`/\`${player.ip()}\`) tripped **${name}**${message ? `: ${message}` : ""}\n**Server:** ${Mode.name()}`);
}

export function setType<T>(input:unknown):asserts input is T {}

export function untilForever(){
	return (maxTime - Date.now() - 10000);
}

export function crash(message:string):never {
	throw new Error(message);
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
const successPrefix = "[#48e076]\u2714 ";

export function outputFail(message:string | PartialFormatString, sender:mindustryPlayer | FishPlayer){
	sender.sendMessage(failPrefix + (typeof message == "function" && "__partialFormatString" in message ? message("[yellow]") : message));
}
export function outputSuccess(message:string | PartialFormatString, sender:mindustryPlayer | FishPlayer){
	sender.sendMessage(successPrefix + (typeof message == "function" && "__partialFormatString" in message ? message("[#48e076]") : message));
}
export function outputMessage(message:string | PartialFormatString, sender:mindustryPlayer | FishPlayer){
	sender.sendMessage(((typeof message == "function" && "__partialFormatString" in message ? message(null) : message) + "").replace(/\t/g, "    "));
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
	if(
		(!fishPlayer.hasPerm("bypassChatFilter") || fishPlayer.chatStrictness == "strict")
		&& (filterTripText = matchFilter(message, fishPlayer.chatStrictness))
	){
		if(effects){
			Log.info(`Censored message from player ${player.name}: "${escapeStringColorsServer(message)}"; contained "${filterTripText}"`);
			FishPlayer.messageStaff(`[yellow]Censored message from player ${fishPlayer.cleanedName}: "${message}" contained "${filterTripText}"`);
		}
		message = `I really hope everyone is having a fun time :) <3`;
		highlight ??= `[#f456f]`;
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
