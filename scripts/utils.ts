
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

/**
 * Returns the amount of time passed since the old time in a readable format.
 */
export function getTimeSinceText(old:number){
	const timePassed = Date.now() - old;

	const hours = Math.floor((timePassed / (1000 * 60 * 60)) % 24);
	const minutes = Math.floor(timePassed / 60000);
	const seconds = Math.floor((timePassed % 60000) / 1000);

	let timeSince = '';
	if(hours) timeSince += `[green]${hours} [lightgray]hrs, `;
	if(minutes) timeSince += `[green]${minutes} [lightgray]mins, `;
	timeSince += `[green]${seconds} [lightgray]secs ago.`;

	return timeSince;
};

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
	let x = Math.floor(unit.x / Vars.tilesize);
	let y = Math.floor(unit.y / Vars.tilesize);
	for(let i = -dist; i <= dist; i ++){
		for(let j = -dist; j <= dist; j ++){
			let build = Vars.world.build(x + i, y + j);
			if(build && build.team != unit.team) return build;
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

export function setToArray<T>(set:ObjectSet<T>):T[] {
	const array:T[] = [];
	set.each(item => array.push(item));
	return array;
}

export function getTeam(team:string):Team | null {
	if(team in Team && Team[team as keyof typeof Team] instanceof Team) return Team[team as keyof typeof Team];
	return null;
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
		} else if(str.length > (10 ** lenlen - 1)){
			if(truncate){
				Log.err(`Cannot write strings with length greater than ${(10 ** lenlen - 1)}`);
				this.string += (10 ** lenlen - 1).toString().padStart(lenlen, "0");
				this.string += str.slice(0, (10 ** lenlen - 1));
			} else {
				throw new Error(`Cannot write strings with length greater than ${(10 ** lenlen - 1)}`);
			}
		} else {
			this.string += str.length.toString().padStart(lenlen, "0");
			this.string += str;
		}
	}
	readNumber(size:number = 4){
		return parseInt(this.read(size));
	}
	writeNumber(num:number, size:number = 4){
		this.string += num.toString().padStart(size, "0");
	}
	readBool(){
		return this.read(1) == "T" ? true : false;
	}
	writeBool(val:boolean){
		this.write(val ? "T" : "F");
	}
	writeArray<T>(array:T[], func:(item:T, str:StringIO) => unknown){
		this.writeNumber(array.length);
		array.forEach(e => func(e, this));
	}
	readArray<T>(func:(str:StringIO) => T):T[] {
		const length = this.readNumber();
		const array:T[] = [];
		for(let i = 0; i < length; i ++){
			array[i] = func(this);
		}
		return array;
	}
	expectEOF(){
		if(this.string.length > this.offset) throw new Error(`Expected EOF, but found extra data: "${this.string.slice(this.offset)}"`);
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
