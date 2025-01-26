"use strict";
var __values = (this && this.__values) || function(o) {
    var s = typeof Symbol === "function" && Symbol.iterator, m = s && o[s], i = 0;
    if (m) return m.call(o);
    if (o && typeof o.length === "number") return {
        next: function () {
            if (o && i >= o.length) o = void 0;
            return { value: o && o[i++], done: !o };
        }
    };
    throw new TypeError(s ? "Object is not iterable." : "Symbol.iterator is not defined.");
};
var __read = (this && this.__read) || function (o, n) {
    var m = typeof Symbol === "function" && o[Symbol.iterator];
    if (!m) return o;
    var i = m.call(o), r, ar = [], e;
    try {
        while ((n === void 0 || n-- > 0) && !(r = i.next()).done) ar.push(r.value);
    }
    catch (error) { e = { error: error }; }
    finally {
        try {
            if (r && !r.done && (m = i["return"])) m.call(i);
        }
        finally { if (e) throw e.error; }
    }
    return ar;
};
var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.EventEmitter = exports.StringIO = exports.StringBuilder = void 0;
exports.memoize = memoize;
exports.to2DArray = to2DArray;
exports.setToArray = setToArray;
exports.crash = crash;
exports.capitalizeText = capitalizeText;
exports.escapeTextDiscord = escapeTextDiscord;
exports.repeatAlternate = repeatAlternate;
exports.escapeStringColorsClient = escapeStringColorsClient;
exports.escapeStringColorsServer = escapeStringColorsServer;
exports.parseError = parseError;
exports.tagProcessor = tagProcessor;
exports.tagProcessorPartial = tagProcessorPartial;
exports.random = random;
var storedValues = {};
/**
 * Stores the output of a function and returns that value
 * instead of running the function again unless any
 * dependencies have changed to improve performance with
 * functions that have expensive computation.
 * @param callback function to run if a dependancy has changed
 * @param dep dependency array of values to monitor
 * @param id arbitrary unique id of the function for storage purposes.
 */
function memoize(callback, dep, id) {
    if (!storedValues[id]) {
        storedValues[id] = { value: callback(), dep: dep };
    }
    else if (dep.some(function (d, ind) { return d !== storedValues[id].dep[ind]; })) {
        //If the value changed
        storedValues[id].value = callback();
        storedValues[id].dep = dep;
    }
    return storedValues[id].value;
} /**
 * Converts a 1D array into a 2D array.
 * @param width the max length of each row.
 * The last row may not be full.
 */
function to2DArray(array, width) {
    if (array.length == 0)
        return [];
    var output = [[]];
    array.forEach(function (el) {
        if (output.at(-1).length >= width) {
            output.push([]);
        }
        output.at(-1).push(el);
    });
    return output;
}
function setToArray(set) {
    var array = [];
    set.each(function (item) { return array.push(item); });
    return array;
}
var StringBuilder = /** @class */ (function () {
    function StringBuilder(str) {
        if (str === void 0) { str = ""; }
        this.str = str;
    }
    StringBuilder.prototype.add = function (str) {
        this.str += str;
        return this;
    };
    StringBuilder.prototype.chunk = function (str) {
        if (Strings.stripColors(str).length > 0) {
            this.str = this.str + " " + str;
        }
        return this;
    };
    return StringBuilder;
}());
exports.StringBuilder = StringBuilder;
//I really should have just used bytes instead of a string.
/** Used for serialization to strings. */
var StringIO = /** @class */ (function () {
    function StringIO(string) {
        if (string === void 0) { string = ""; }
        this.string = string;
        this.offset = 0;
    }
    StringIO.prototype.read = function (length) {
        if (length === void 0) { length = 1; }
        if (this.offset + length > this.string.length)
            crash("Unexpected EOF");
        return this.string.slice(this.offset, this.offset += length);
    };
    StringIO.prototype.write = function (str) {
        this.string += str;
    };
    StringIO.prototype.readString = function (/** The length of the written length. */ lenlen) {
        if (lenlen === void 0) { lenlen = 3; }
        var length = parseInt(this.read(lenlen));
        if (length == 0)
            return null;
        return this.read(length);
    };
    StringIO.prototype.writeString = function (str, lenlen, truncate) {
        if (lenlen === void 0) { lenlen = 3; }
        if (truncate === void 0) { truncate = false; }
        if (str === null) {
            this.string += "0".repeat(lenlen);
        }
        else if (typeof str !== "string") {
            crash("Attempted to serialize string ".concat(str, ", but it was not a string"));
        }
        else if (str.length > (Math.pow(10, lenlen) - 1)) {
            if (truncate) {
                Log.err("Cannot write strings with length greater than ".concat((Math.pow(10, lenlen) - 1), " (was ").concat(str.length, "), truncating"));
                this.string += (Math.pow(10, lenlen) - 1).toString().padStart(lenlen, "0");
                this.string += str.slice(0, (Math.pow(10, lenlen) - 1));
            }
            else {
                crash("Cannot write strings with length greater than ".concat((Math.pow(10, lenlen) - 1), " (was ").concat(str.length, ")\n String was: \"").concat(str, "\""));
            }
        }
        else {
            this.string += str.length.toString().padStart(lenlen, "0");
            this.string += str;
        }
    };
    StringIO.prototype.readEnumString = function (options) {
        var length = (options.length - 1).toString().length;
        var option = this.readNumber(length);
        return options[option];
    };
    StringIO.prototype.writeEnumString = function (value, options) {
        var length = (options.length - 1).toString().length;
        var option = options.indexOf(value);
        if (option == -1)
            crash("Attempted to write invalid value \"".concat(value, "\" for enum, valid values are (").concat(options.join(", "), ")"));
        this.writeNumber(option, length);
    };
    StringIO.prototype.readNumber = function (size) {
        if (size === void 0) { size = 4; }
        var data = this.read(size);
        if (/^0*-\d+$/.test(data)) {
            //negative numbers were incorrectly stored in previous versions
            data = "-" + data.split("-")[1];
        }
        if (isNaN(Number(data)))
            crash("Attempted to read invalid number: ".concat(data));
        return Number(data);
    };
    StringIO.prototype.writeNumber = function (num, size, clamp) {
        if (size === void 0) { size = 4; }
        if (clamp === void 0) { clamp = false; }
        if (typeof num != "number")
            crash("".concat(num, " was not a number!"));
        if (num.toString().length > size) {
            if (clamp) {
                if (num > (Math.pow(10, size)) - 1)
                    this.string += (Math.pow(10, size)) - 1;
                else
                    this.string += num.toString().slice(0, size);
            }
            else
                crash("Cannot write number ".concat(num, " with length ").concat(size, ": too long"));
        }
        this.string += num.toString().padStart(size, "0");
    };
    StringIO.prototype.readBool = function () {
        return this.read(1) == "T" ? true : false;
    };
    StringIO.prototype.writeBool = function (val) {
        this.write(val ? "T" : "F");
    };
    StringIO.prototype.writeArray = function (array, func, lenlen) {
        var _this = this;
        this.writeNumber(array.length, lenlen);
        array.forEach(function (e) { return func(e, _this); });
    };
    StringIO.prototype.readArray = function (func, lenlen) {
        var length = this.readNumber(lenlen);
        var array = [];
        for (var i = 0; i < length; i++) {
            array[i] = func(this);
        }
        return array;
    };
    StringIO.prototype.expectEOF = function () {
        if (this.string.length > this.offset)
            crash("Expected EOF, but found extra data: \"".concat(this.string.slice(this.offset), "\""));
    };
    StringIO.read = function (data, func) {
        var str = new StringIO(data);
        try {
            return func(str);
        }
        catch (err) {
            Log.err("Error while reading compressed data!");
            Log.err(data);
            throw err;
        }
    };
    StringIO.write = function (data, func) {
        var str = new StringIO();
        func(str, data);
        return str.string;
    };
    return StringIO;
}());
exports.StringIO = StringIO;
/** Something that emits events. */
var EventEmitter = /** @class */ (function () {
    function EventEmitter() {
        this.listeners = {};
    }
    EventEmitter.prototype.on = function (event, callback) {
        var _a;
        var _b;
        ((_a = (_b = this.listeners)[event]) !== null && _a !== void 0 ? _a : (_b[event] = [])).push(callback);
        return this;
    };
    EventEmitter.prototype.fire = function (event, args) {
        var e_1, _a;
        var _b;
        try {
            for (var _c = __values((_b = this.listeners[event]) !== null && _b !== void 0 ? _b : []), _d = _c.next(); !_d.done; _d = _c.next()) {
                var listener = _d.value;
                listener.apply(void 0, __spreadArray([this], __read(args), false));
            }
        }
        catch (e_1_1) { e_1 = { error: e_1_1 }; }
        finally {
            try {
                if (_d && !_d.done && (_a = _c.return)) _a.call(_c);
            }
            finally { if (e_1) throw e_1.error; }
        }
    };
    return EventEmitter;
}());
exports.EventEmitter = EventEmitter;
function crash(message) {
    throw new Error(message);
}
/** Best effort title-capitalization of a word. */
function capitalizeText(text) {
    return text
        .split(" ")
        .map(function (word, i, arr) { return (["a", "an", "the", "in", "and", "of", "it", "is"].includes(word) &&
        i !== 0 && i !== arr.length - 1) ? word
        : word[0].toUpperCase() + word.substring(1).toLowerCase(); }).join(" ");
}
var pattern = Pattern.compile("([*\\_~`|:])");
function escapeTextDiscord(text) {
    return pattern.matcher(text).replaceAll("\\\\$1\u200B");
}
function repeatAlternate(a, b, numARepeats) {
    return Array.from({ length: numARepeats * 2 - 1 }, function (_, i) { return i % 2 ? b : a; }).join("");
}
/** Prevents Mindustry from displaying color tags in a string by escaping them. Example: turns [scarlet]red to [[scarlet]red. */
function escapeStringColorsClient(str) {
    return str.replace(/\[/g, "[[");
}
// export function highlightStringColorsClient(str:string):string {
// 	return str.replace(/(?<!\[)\[[a-z0-9#]{2,10}\]/gi, "[gray][$0[]");
// }
/** Prevents Mindustry from displaying color tags in a string by escaping them. Example: turns &bamogus to &&bamogus. */
function escapeStringColorsServer(str) {
    return str.replace(/&/g, "&&");
}
function parseError(thing) {
    if (thing instanceof Error) {
        return thing.toString();
    }
    else if (typeof thing == "string") {
        return thing;
    }
    else {
        Log.info("[[FINDTAG]] Unable to parse the following error object");
        Log.info(thing);
        return "Unable to parse error object";
    }
}
/** Generates a tag template processor from a function that processes one value at a time. */
function tagProcessor(transformer) {
    return function (stringChunks) {
        var varChunks = [];
        for (var _i = 1; _i < arguments.length; _i++) {
            varChunks[_i - 1] = arguments[_i];
        }
        return String.raw.apply(String, __spreadArray([{ raw: stringChunks }], __read(varChunks.map(function (chunk, i) { return transformer(chunk, i, stringChunks, varChunks); })), false));
    };
}
//third order function ._. warning: causes major confusion
/** Generates a tag template partial processor from a function that processes one value at a time. */
function tagProcessorPartial(transformer) {
    return function (stringChunks) {
        var varChunks = [];
        for (var _i = 1; _i < arguments.length; _i++) {
            varChunks[_i - 1] = arguments[_i];
        }
        return Object.assign(function (data) { return stringChunks.map(function (chunk, i) {
            if (stringChunks.length <= i)
                return chunk;
            return (i - 1) in varChunks ? transformer(varChunks[i - 1], i, data, stringChunks, varChunks) + chunk : chunk;
        }).join(''); }, {
            __partialFormatString: true
        });
    };
}
function random(arg0, arg1) {
    if (typeof arg0 == "number") {
        var max = void 0, min = void 0;
        if (arg1 == undefined) {
            max = arg0;
            min = 0;
        }
        else {
            min = arg0;
            max = arg1;
        }
        return Math.random() * (max - min) + min;
    }
    else if (arg0 instanceof Array) {
        return arg0[Math.floor(Math.random() * arg0.length)];
    }
}
