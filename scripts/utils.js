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
Object.defineProperty(exports, "__esModule", { value: true });
exports.matchFilter = exports.capitalizeText = exports.StringIO = exports.StringBuilder = exports.getTeam = exports.setToArray = exports.isCoreUnitType = exports.nearbyEnemyTile = exports.getColor = exports.to2DArray = exports.getTimeSinceText = exports.memoize = exports.keys = exports.list = exports.logg = void 0;
var config_1 = require("./config");
function logg(msg) { Call.sendMessage(msg); }
exports.logg = logg;
function list(ar) { Call.sendMessage(ar.join(' | ')); }
exports.list = list;
function keys(obj) { Call.sendMessage(Object.keys(obj).join(' [scarlet]|[white] ')); }
exports.keys = keys;
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
}
exports.memoize = memoize;
/**
 * Returns the amount of time passed since the old time in a readable format.
 */
function getTimeSinceText(old) {
    var timePassed = Date.now() - old;
    var hours = Math.floor((timePassed / (1000 * 60 * 60)) % 24);
    var minutes = Math.floor(timePassed / 60000);
    var seconds = Math.floor((timePassed % 60000) / 1000);
    var timeSince = '';
    if (hours)
        timeSince += "[green]".concat(hours, " [lightgray]hrs, ");
    if (minutes)
        timeSince += "[green]".concat(minutes, " [lightgray]mins, ");
    timeSince += "[green]".concat(seconds, " [lightgray]secs ago.");
    return timeSince;
}
exports.getTimeSinceText = getTimeSinceText;
;
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
exports.to2DArray = to2DArray;
function getColor(input) {
    try {
        if (input.includes(',')) {
            var formattedColor = input.split(',');
            var col = {
                r: Number(formattedColor[0]),
                g: Number(formattedColor[1]),
                b: Number(formattedColor[2]),
                a: 255,
            };
            return new Color(col.r, col.g, col.b, col.a);
        }
        else if (input.includes('#')) {
            return Color.valueOf(input);
        }
        else if (input in Color) {
            return Color[input];
        }
        else {
            return null;
        }
    }
    catch (e) {
        return null;
    }
}
exports.getColor = getColor;
function nearbyEnemyTile(unit, dist) {
    var x = Math.floor(unit.x / Vars.tilesize);
    var y = Math.floor(unit.y / Vars.tilesize);
    for (var i = -dist; i <= dist; i++) {
        for (var j = -dist; j <= dist; j++) {
            var build = Vars.world.build(x + i, y + j);
            if (build && build.team != unit.team)
                return build;
        }
    }
    return null;
}
exports.nearbyEnemyTile = nearbyEnemyTile;
/**
 * This function is necessary due to a bug with UnitChangeEvent. It can be removed in the next release after v142.
 * @deprecated
 * */
function isCoreUnitType(type) {
    return [UnitTypes.alpha, UnitTypes.beta, UnitTypes.gamma, UnitTypes.evoke, UnitTypes.incite, UnitTypes.emanate].includes(type);
}
exports.isCoreUnitType = isCoreUnitType;
function setToArray(set) {
    var array = [];
    set.each(function (item) { return array.push(item); });
    return array;
}
exports.setToArray = setToArray;
function getTeam(team) {
    if (team in Team && Team[team] instanceof Team)
        return Team[team];
    return null;
}
exports.getTeam = getTeam;
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
var StringIO = /** @class */ (function () {
    function StringIO(string) {
        if (string === void 0) { string = ""; }
        this.string = string;
        this.offset = 0;
    }
    StringIO.prototype.read = function (length) {
        if (length === void 0) { length = 1; }
        if (this.offset + length > this.string.length)
            throw new Error("Unexpected EOF");
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
        else if (str.length > (Math.pow(10, lenlen) - 1)) {
            if (truncate) {
                Log.err("Cannot write strings with length greater than ".concat((Math.pow(10, lenlen) - 1)));
                this.string += (Math.pow(10, lenlen) - 1).toString().padStart(lenlen, "0");
                this.string += str.slice(0, (Math.pow(10, lenlen) - 1));
            }
            else {
                throw new Error("Cannot write strings with length greater than ".concat((Math.pow(10, lenlen) - 1)));
            }
        }
        else {
            this.string += str.length.toString().padStart(lenlen, "0");
            this.string += str;
        }
    };
    StringIO.prototype.readNumber = function (size) {
        if (size === void 0) { size = 4; }
        return parseInt(this.read(size));
    };
    StringIO.prototype.writeNumber = function (num, size) {
        if (size === void 0) { size = 4; }
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
            throw new Error("Expected EOF, but found extra data: \"".concat(this.string.slice(this.offset), "\""));
    };
    StringIO.read = function (data, func) {
        var str = new StringIO(data);
        return func(str);
    };
    StringIO.write = function (data, func) {
        var str = new StringIO();
        func(str, data);
        return str.string;
    };
    return StringIO;
}());
exports.StringIO = StringIO;
function capitalizeText(text) {
    return text
        .split(" ")
        .map(function (word, i, arr) {
        return (["a", "an", "the", "in", "and", "of", "it"].includes(word) &&
            i !== 0 && i !== arr.length - 1) ?
            word : word[0].toUpperCase() + word.substring(1);
    }).join(" ");
}
exports.capitalizeText = capitalizeText;
function matchFilter(text) {
    var e_1, _a;
    //Replace substitutions
    var replacedText = text.split("").map(function (char) { var _a; return (_a = config_1.substitutions[char]) !== null && _a !== void 0 ? _a : char; }).join("").toLowerCase();
    var _loop_1 = function (word, whitelist) {
        if (replacedText.includes(word)) {
            var moreReplacedText_1 = replacedText;
            whitelist.forEach(function (w) { return moreReplacedText_1 = moreReplacedText_1.replace(new RegExp(w, "g"), ""); });
            Log.info("Text ".concat(replacedText, " found to contain banned word ").concat(word, ", whitelisted words are [").concat(whitelist.join(", "), "], was replaced to ").concat(moreReplacedText_1));
            if (moreReplacedText_1.includes(word))
                return { value: true };
        }
    };
    try {
        for (var bannedWords_1 = __values(config_1.bannedWords), bannedWords_1_1 = bannedWords_1.next(); !bannedWords_1_1.done; bannedWords_1_1 = bannedWords_1.next()) {
            var _b = __read(bannedWords_1_1.value, 2), word = _b[0], whitelist = _b[1];
            var state_1 = _loop_1(word, whitelist);
            if (typeof state_1 === "object")
                return state_1.value;
        }
    }
    catch (e_1_1) { e_1 = { error: e_1_1 }; }
    finally {
        try {
            if (bannedWords_1_1 && !bannedWords_1_1.done && (_a = bannedWords_1.return)) _a.call(bannedWords_1);
        }
        finally { if (e_1) throw e_1.error; }
    }
    return false;
}
exports.matchFilter = matchFilter;
