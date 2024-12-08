import type { PartialFormatString, TagFunction } from './types.js';

const storedValues: Record<string, {
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
export function memoize<T>(callback: () => T, dep: unknown[], id: number | string): T {
	if (!storedValues[id]) {
		storedValues[id] = { value: callback(), dep };
	} else if (dep.some((d, ind) => d !== storedValues[id].dep[ind])) {
		//If the value changed
		storedValues[id].value = callback();
		storedValues[id].dep = dep;
	}
	return storedValues[id].value as T;
}/**
 * Converts a 1D array into a 2D array.
 * @param width the max length of each row.
 * The last row may not be full.
 */

export function to2DArray<T>(array: T[], width: number) {
	if (array.length == 0) return [];
	let output: T[][] = [[]];
	array.forEach(el => {
		if (output.at(-1)!.length >= width) {
			output.push([]);
		}
		output.at(-1)!.push(el);
	});
	return output;
}
export function setToArray<T>(set: ObjectSet<T> | EntityGroup<T>): T[] {
	const array: T[] = [];
	set.each(item => array.push(item));
	return array;
}
export class StringBuilder {
	constructor(public str: string = "") { }
	add(str: string) {
		this.str += str;
		return this;
	}
	chunk(str: string) {
		if (Strings.stripColors(str).length > 0) {
			this.str = this.str + " " + str;
		}
		return this;
	}
}
//I really should have just used bytes instead of a string.
/** Used for serialization to strings. */

export class StringIO {
	offset: number = 0;
	constructor(public string: string = "") { }
	read(length: number = 1) {
		if (this.offset + length > this.string.length) crash(`Unexpected EOF`);
		return this.string.slice(this.offset, this.offset += length);
	}
	write(str: string) {
		this.string += str;
	}
	readString(/** The length of the written length. */ lenlen: number = 3) {
		const length = parseInt(this.read(lenlen));
		if (length == 0) return null;
		return this.read(length);
	}
	writeString(str: string | null, lenlen: number = 3, truncate = false) {
		if (str === null) {
			this.string += "0".repeat(lenlen);
		} else if (typeof str !== "string") {
			crash(`Attempted to serialize string ${str}, but it was not a string`);
		} else if (str.length > (10 ** lenlen - 1)) {
			if (truncate) {
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
	readEnumString<const T>(options: T[]): T {
		const length = (options.length - 1).toString().length;
		const option = this.readNumber(length);
		return options[option];
	}
	writeEnumString<const T>(value: T, options: T[]) {
		const length = (options.length - 1).toString().length;
		const option = options.indexOf(value);
		if (option == -1) crash(`Attempted to write invalid value "${value}" for enum, valid values are (${options.join(", ")})`);
		this.writeNumber(option, length);
	}
	readNumber(size: number = 4) {
		let data = this.read(size);
		if (/^0*-\d+$/.test(data)) {
			//negative numbers were incorrectly stored in previous versions
			data = "-" + data.split("-")[1];
		}
		if (isNaN(Number(data))) crash(`Attempted to read invalid number: ${data}`);
		return Number(data);
	}
	writeNumber(num: number, size: number = 4, clamp = false) {
		if (typeof num != "number") crash(`${num} was not a number!`);
		if (num.toString().length > size) {
			if (clamp) {
				if (num > (10 ** size) - 1) this.string += (10 ** size) - 1;
				else this.string += num.toString().slice(0, size);
			} else crash(`Cannot write number ${num} with length ${size}: too long`);
		}
		this.string += num.toString().padStart(size, "0");
	}
	readBool() {
		return this.read(1) == "T" ? true : false;
	}
	writeBool(val: boolean) {
		this.write(val ? "T" : "F");
	}
	writeArray<T>(array: T[], func: (item: T, str: StringIO) => unknown, lenlen?: number) {
		this.writeNumber(array.length, lenlen);
		array.forEach(e => func(e, this));
	}
	readArray<T>(func: (str: StringIO) => T, lenlen?: number): T[] {
		const length = this.readNumber(lenlen);
		const array: T[] = [];
		for (let i = 0; i < length; i++) {
			array[i] = func(this);
		}
		return array;
	}
	expectEOF() {
		if (this.string.length > this.offset) crash(`Expected EOF, but found extra data: "${this.string.slice(this.offset)}"`);
	}
	static read<T>(data: string, func: (str: StringIO) => T): T {
		const str = new StringIO(data);
		try {
			return func(str);
		} catch (err) {
			Log.err(`Error while reading compressed data!`);
			Log.err(data);
			throw err;
		}
	}
	static write<T>(data: T, func: (str: StringIO, data: T) => unknown): string {
		const str = new StringIO();
		func(str, data);
		return str.string;
	}
}
/** Something that emits events. */

export class EventEmitter<
	/** Mapping between event name and arguments to the handler. */
	EventMapping extends Record<string, unknown[]>
> {
	private listeners: {
		[K in keyof EventMapping]?: ((t: this, ...args: EventMapping[K]) => unknown)[];
	} = {};
	on<EventType extends keyof EventMapping>(event: EventType, callback: (t: this, ...args: EventMapping[EventType]) => unknown): this {
		(this.listeners[event] ??= []).push(callback);
		return this;
	}
	fire<EventType extends keyof EventMapping>(event: EventType, args: EventMapping[EventType]) {
		for (const listener of this.listeners[event] ?? []) {
			listener(this, ...args);
		}
	}
}

export function crash(message: string): never {
	throw new Error(message);
}
/** Best effort title-capitalization of a word. */


export function capitalizeText(text: string): string {
	return text
		.split(" ")
		.map((word, i, arr) => (
			["a", "an", "the", "in", "and", "of", "it"].includes(word) &&
			i !== 0 && i !== arr.length - 1
		) ? word
			: word[0].toUpperCase() + word.substring(1)
		).join(" ");
}
const pattern = Pattern.compile(`([*\\_~\`|:])`);
export function escapeTextDiscord(text: string): string {
	return pattern.matcher(text).replaceAll("\\\\$1");
}
export function repeatAlternate(a: string, b: string, numARepeats: number) {
	return Array.from({ length: numARepeats * 2 - 1 }, (_, i) => i % 2 ? b : a).join("");
}
/** Prevents Mindustry from displaying color tags in a string by escaping them. Example: turns [scarlet]red to [[scarlet]red. */

export function escapeStringColorsClient(str: string): string {
	return str.replace(/\[/g, "[[");
}
// export function highlightStringColorsClient(str:string):string {
// 	return str.replace(/(?<!\[)\[[a-z0-9#]{2,10}\]/gi, "[gray][$0[]");
// }
/** Prevents Mindustry from displaying color tags in a string by escaping them. Example: turns &bamogus to &&bamogus. */

export function escapeStringColorsServer(str: string): string {
	return str.replace(/&/g, "&&");
}
export function parseError(thing: unknown) {
	if (thing instanceof Error) {
		return thing.toString();
	} else if (typeof thing == "string") {
		return thing;
	} else {
		Log.info("[[FINDTAG]] Unable to parse the following error object");
		Log.info(thing as any);
		return "Unable to parse error object";
	}
}
/** Generates a tag template processor from a function that processes one value at a time. */

export function tagProcessor<T>(
	transformer: (chunk: T, index: number, allStringChunks: readonly string[], allVarChunks: readonly T[]) => string
): TagFunction<T, string> {
	return function (stringChunks: readonly string[], ...varChunks: readonly T[]) {
		return String.raw({ raw: stringChunks }, ...varChunks.map((chunk, i) => transformer(chunk, i, stringChunks, varChunks)));
	};
}
//third order function ._. warning: causes major confusion
/** Generates a tag template partial processor from a function that processes one value at a time. */

export function tagProcessorPartial<Tin, Tdata>(
	transformer: (chunk: Tin, index: number, data: Tdata, allStringChunks: readonly string[], allVarChunks: readonly Tin[]) => string
): TagFunction<Tin, PartialFormatString<Tdata>> {
	return (stringChunks: readonly string[], ...varChunks: readonly Tin[]) => Object.assign(
		(data: Tdata) => stringChunks.map((chunk, i) => {
			if (stringChunks.length <= i) return chunk;
			return (i - 1) in varChunks ? transformer(varChunks[i - 1], i, data, stringChunks, varChunks) + chunk : chunk;
		}).join(''),
		{
			__partialFormatString: true as const
		}
	);
}
/** Chooses a random number between 0 and max. */

export function random(max: number): number;
/** Chooses a random number between min and max. */
export function random(min: number, max: number): number;
/** Selects a random element from an array. */
export function random<T>(list: T[]): T;

export function random(arg0: unknown, arg1?: number): any {
	if (typeof arg0 == "number") {
		let max: number, min: number;
		if (arg1 == undefined) {
			max = arg0;
			min = 0;
		} else {
			min = arg0;
			max = arg1;
		}
		return Math.random() * (max - min) + min;
	} else if (arg0 instanceof Array) {
		return arg0[Math.floor(Math.random() * arg0.length)];
	}
}

