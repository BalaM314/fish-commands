import * as api from './api';
import { adminNames, bannedInNamesWords, bannedWords, getGamemode, maxTime, substitutions } from "./config";
import { fishState } from './globals';
import { FishPlayer } from "./players";
import { Rank } from './ranks';

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
	if(dist > 10) throw new Error(`nearbyEnemyTile(): dist (${dist}) is too high!`);

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

/**
 * This function is necessary due to a bug with UnitChangeEvent. It can be removed in the next release after v142.
 * @deprecated
 * */
export function isCoreUnitType(type:UnitType){
	return [UnitTypes.alpha, UnitTypes.beta, UnitTypes.gamma, UnitTypes.evoke, UnitTypes.incite, UnitTypes.emanate].includes(type);
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
		if(this.offset + length > this.string.length) throw new Error(`Unexpected EOF`);
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
			throw new Error(`Attempted to serialize string ${str}, but it was not a string`);
		} else if(str.length > (10 ** lenlen - 1)){
			if(truncate){
				Log.err(`Cannot write strings with length greater than ${(10 ** lenlen - 1)} (was ${str.length}), truncating`);
				this.string += (10 ** lenlen - 1).toString().padStart(lenlen, "0");
				this.string += str.slice(0, (10 ** lenlen - 1));
			} else {
				throw new Error(`Cannot write strings with length greater than ${(10 ** lenlen - 1)} (was ${str.length})\n String was: "${str}"`);
			}
		} else {
			this.string += str.length.toString().padStart(lenlen, "0");
			this.string += str;
		}
	}
	readNumber(size:number = 4){
		let data = this.read(size);
		if(/^0*-\d+$/.test(data)){
			//negative numbers were incorrectly stored in previous versions
			data = "-" + data.split("-")[1];
		}
		if(isNaN(Number(data))) throw new Error(`Attempted to read invalid number: ${data}`);
		return Number(data);
	}
	writeNumber(num:number, size:number = 4){
		if(typeof num != "number") throw new Error(`${num} was not a number!`);
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
		if(this.string.length > this.offset) throw new Error(`Expected EOF, but found extra data: "${this.string.slice(this.offset)}"`);
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

export function matchFilter(text:string, strict = false):boolean {
	//Replace substitutions
	const replacedText = Strings.stripColors(text).split("").map(char => substitutions[char] ?? char).join("").toLowerCase();
	for(const [word, whitelist] of bannedWords.concat(strict ? bannedInNamesWords : [])){
		if(word instanceof RegExp ? word.test(replacedText) : replacedText.includes(word)){
			let moreReplacedText = replacedText;
			whitelist.forEach(w => moreReplacedText = moreReplacedText.replace(new RegExp(w, "g"), ""));
			if(word instanceof RegExp ? word.test(moreReplacedText) : moreReplacedText.includes(word)) return true;
		}
	}
	return false;
}



export function isImpersonator(name:string, isStaff:boolean):boolean {
	//Replace substitutions
	const replacedText = Strings.stripColors(name).split("").map(char => substitutions[char] ?? char).join("").toLowerCase();
	if(replacedText.includes("server")) return true; //name contains server
	if(/^[ ]*<.{1,3}>/.test(replacedText)) return true; //name starts with <c>, fake role prefix
	if(!isStaff && adminNames.includes(replacedText.trim())) return true;
	return false;
}

export function logAction(action:string):void;
export function logAction(action:string, by:FishPlayer):void;
export function logAction(action:string, by:FishPlayer | string, to:FishPlayer | mindustryPlayerData, reason?:string, duration?:number):void;
export function logAction(action:string, by?:FishPlayer | string, to?:FishPlayer | mindustryPlayerData, reason?:string, duration?:number) {
	if(by === undefined){
		api.sendModerationMessage(
`${action}
**Server:** ${getGamemode()}`
		);
	} else if(to){
		let name:string, uuid:string, ip:string;
		let actor:string = typeof by === "string" ? by : by.name;
		if(to instanceof FishPlayer){
			name = escapeTextDiscord(to.name);
			uuid = to.uuid;
			ip = to.player.ip();
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
	} else {
		api.sendModerationMessage(
`${(by as FishPlayer).cleanedName} ${action}
**Server:** ${getGamemode()}`
		);
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

/**Prevents Mindustry from displaying color tags in a string by escaping them. Example: turns &bamogus to &&bamogus. */
export function escapeStringColorsServer(str:string):string {
	return str.replace(/&/g, "&&");
}

export function serverRestartLoop(sec:number){
	if(sec > 0){
		if(sec < 15 || sec % 5 == 0) Call.sendMessage(`[scarlet]Server restarting in: ${sec}`);
		Timer.schedule(() => serverRestartLoop(sec - 1), 1);
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
	return block.buildType != Blocks.air.buildType && !(block instanceof ConstructBlock);
}

export function getUnitType(type:string):Unit | string {
	validUnits ??= Vars.content.units().select((u:UnitType) => !(u instanceof MissileUnitType || u.internal));
	let temp;
	if(temp = validUnits!.find(u => u.name == type)) return temp;
	else if(temp = validUnits!.find((t:UnitType) => t.name.includes(type.toLowerCase()))) return temp;
	return `"${type}" is not a valid unit type.`;
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
export function tagProcessor(transformer:(chunk:unknown, index:number) => string){
	return function(stringChunks:string[], ...varChunks:string[]){
		return String.raw({raw: stringChunks}, ...varChunks.map(transformer));
	}
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
