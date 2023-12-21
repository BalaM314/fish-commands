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
exports.colorNumber = exports.crash = exports.untilForever = exports.setType = exports.logHTrip = exports.random = exports.neutralGameover = exports.getEnemyTeam = exports.definitelyRealMemoryCorruption = exports.logErrors = exports.tagProcessor = exports.parseError = exports.teleportPlayer = exports.getBlock = exports.getUnitType = exports.isBuildable = exports.serverRestartLoop = exports.escapeStringColorsServer = exports.escapeStringColorsClient = exports.parseTimeString = exports.logAction = exports.isImpersonator = exports.cleanText = exports.repeatAlternate = exports.matchFilter = exports.escapeTextDiscord = exports.capitalizeText = exports.StringIO = exports.StringBuilder = exports.getTeam = exports.setToArray = exports.nearbyEnemyTile = exports.getColor = exports.to2DArray = exports.colorBadBoolean = exports.colorBoolean = exports.formatTimeRelative = exports.formatTimestamp = exports.formatTime = exports.memoize = exports.keys = exports.list = exports.logg = void 0;
var api = require("./api");
var config_1 = require("./config");
var globals_1 = require("./globals");
var players_1 = require("./players");
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
function formatTime(time) {
    if (config_1.maxTime - (time + Date.now()) < 20000)
        return "forever";
    var months = Math.floor(time / (30 * 24 * 60 * 60 * 1000));
    var days = Math.floor((time % (30 * 24 * 60 * 60 * 1000)) / (24 * 60 * 60 * 1000));
    var hours = Math.floor((time % (24 * 60 * 60 * 1000)) / (60 * 60 * 1000));
    var minutes = Math.floor((time % (60 * 60 * 1000)) / (60 * 1000));
    var seconds = Math.floor((time % (60 * 1000)) / (1000));
    return [
        months && "".concat(months, " months"),
        days && "".concat(days, " days"),
        hours && "".concat(hours, " hours"),
        minutes && "".concat(minutes, " minutes"),
        seconds && "".concat(seconds, " seconds"),
    ].filter(function (s) { return s; }).join(", ");
}
exports.formatTime = formatTime;
function formatTimestamp(time) {
    var date = new Date(time);
    return "".concat(date.toDateString(), ", ").concat(date.toTimeString());
}
exports.formatTimestamp = formatTimestamp;
function formatTimeRelative(time, raw) {
    var difference = Math.abs(time - Date.now());
    if (difference < 1000)
        return "just now";
    else if (time > Date.now())
        return (raw ? "" : "in ") + formatTime(difference);
    else
        return formatTime(difference) + (raw ? "" : " ago");
}
exports.formatTimeRelative = formatTimeRelative;
function colorBoolean(val) {
    return val ? "[green]true[]" : "[red]false[]";
}
exports.colorBoolean = colorBoolean;
function colorBadBoolean(val) {
    return val ? "[red]true[]" : "[green]false[]";
}
exports.colorBadBoolean = colorBadBoolean;
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
    //because the indexer is buggy
    if (dist > 10)
        crash("nearbyEnemyTile(): dist (".concat(dist, ") is too high!"));
    var x = Math.floor(unit.x / Vars.tilesize);
    var y = Math.floor(unit.y / Vars.tilesize);
    for (var i = -dist; i <= dist; i++) {
        for (var j = -dist; j <= dist; j++) {
            var build = Vars.world.build(x + i, y + j);
            if (build && build.team != unit.team && build.team != Team.derelict)
                return build;
        }
    }
    return null;
}
exports.nearbyEnemyTile = nearbyEnemyTile;
function setToArray(set) {
    var array = [];
    set.each(function (item) { return array.push(item); });
    return array;
}
exports.setToArray = setToArray;
function getTeam(team) {
    if (team in Team && Team[team] instanceof Team)
        return Team[team];
    else if (Team.baseTeams.find(function (t) { return t.name.includes(team.toLowerCase()); }))
        return Team.baseTeams.find(function (t) { return t.name.includes(team.toLowerCase()); });
    else if (!isNaN(Number(team)))
        return "\"".concat(team, "\" is not a valid team string. Did you mean \"#").concat(team, "\"?");
    else if (!isNaN(Number(team.slice(1)))) {
        var num = Number(team.slice(1));
        if (num <= 255 && num >= 0 && Number.isInteger(num))
            return Team.all[Number(team.slice(1))];
        else
            return "Team ".concat(team, " is outside the valid range (integers 0-255).");
    }
    return "\"".concat(team, "\" is not a valid team string.");
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
    StringIO.prototype.writeNumber = function (num, size) {
        if (size === void 0) { size = 4; }
        if (typeof num != "number")
            crash("".concat(num, " was not a number!"));
        if (num.toString().length > size)
            crash("Cannot write number ".concat(num, " with length ").concat(size, ": too long"));
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
var pattern = Pattern.compile("([*\\_~`|:])");
function escapeTextDiscord(text) {
    return pattern.matcher(text).replaceAll("\\\\$1");
}
exports.escapeTextDiscord = escapeTextDiscord;
/**
 * @param strict "chat" is least strict, followed by "strict", and "name" is most strict.
 * @returns
 */
function matchFilter(input, strict) {
    var e_1, _a, e_2, _b;
    if (strict === void 0) { strict = "chat"; }
    try {
        //Replace substitutions
        for (var _c = __values(config_1.bannedWords.concat(strict == "strict" ? config_1.strictBannedWords : []).concat(strict == "name" ? config_1.bannedInNamesWords : [])), _d = _c.next(); !_d.done; _d = _c.next()) {
            var _e = __read(_d.value, 2), banned = _e[0], whitelist = _e[1];
            var _loop_1 = function (text) {
                if (banned instanceof RegExp ? banned.test(text) : text.includes(banned)) {
                    var modifiedText_1 = text;
                    whitelist.forEach(function (w) { return modifiedText_1 = modifiedText_1.replace(new RegExp(w, "g"), ""); }); //Replace whitelisted words with nothing
                    if (banned instanceof RegExp ? banned.test(modifiedText_1) : modifiedText_1.includes(banned)) //If the text still matches, fail
                        return { value: banned instanceof RegExp ? banned.source.replace(/\\b|\(\?\<\!.+?\)|\(\?\!.+?\)/g, "") : banned }; //parsing regex with regex, massive hack
                }
            };
            try {
                for (var _f = (e_2 = void 0, __values([input, cleanText(input, false), cleanText(input, true)])), _g = _f.next(); !_g.done; _g = _f.next()) {
                    var text = _g.value;
                    var state_1 = _loop_1(text);
                    if (typeof state_1 === "object")
                        return state_1.value;
                }
            }
            catch (e_2_1) { e_2 = { error: e_2_1 }; }
            finally {
                try {
                    if (_g && !_g.done && (_b = _f.return)) _b.call(_f);
                }
                finally { if (e_2) throw e_2.error; }
            }
        }
    }
    catch (e_1_1) { e_1 = { error: e_1_1 }; }
    finally {
        try {
            if (_d && !_d.done && (_a = _c.return)) _a.call(_c);
        }
        finally { if (e_1) throw e_1.error; }
    }
    return false;
}
exports.matchFilter = matchFilter;
function repeatAlternate(a, b, numARepeats) {
    return Array.from({ length: numARepeats * 2 - 1 }, function (_, i) { return i % 2 ? b : a; }).join("");
}
exports.repeatAlternate = repeatAlternate;
//If there are 3 groups of non alphabetic characters separating alphabetic characters,
//such as: "a_d_m_i" but not "i am a sussy impostor"
//remove all the non alphabetic characters
//this should stop people naming themselves s e r v e r and getting away with it
var alphaChars = "a-z0-9\u00E0-\u00F6\u00F8-\u017F";
var nonAlphaChars = "'a-z0-9\u00E0-\u00F6\u00F8-\u017F";
var antiEvasionRegex = new RegExp(repeatAlternate("[".concat(alphaChars, "]"), "[^".concat(nonAlphaChars, "]"), 4), "i");
function cleanText(text, applyAntiEvasion) {
    if (applyAntiEvasion === void 0) { applyAntiEvasion = false; }
    //Replace substitutions
    var replacedText = config_1.multiCharSubstitutions.reduce(function (acc, _a) {
        var _b = __read(_a, 2), from = _b[0], to = _b[1];
        return acc.replace(from, to);
    }, Strings.stripColors(text)
        .split("").map(function (c) { var _a; return (_a = config_1.substitutions[c]) !== null && _a !== void 0 ? _a : c; }).join(""))
        .toLowerCase()
        .trim();
    if (applyAntiEvasion) {
        if (antiEvasionRegex.test(replacedText)) {
            replacedText = replacedText.replace(new RegExp("[^".concat(nonAlphaChars, "]"), "gi"), "");
        }
    }
    return replacedText;
}
exports.cleanText = cleanText;
function isImpersonator(name, isStaff) {
    var e_3, _a;
    var replacedText = cleanText(name);
    var antiEvasionText = cleanText(name, true);
    //very clean code i know
    var filters = (function (input) {
        return input.map(function (i) {
            return Array.isArray(i)
                ? [
                    typeof i[0] == "string" ? function (replacedText) { return replacedText.includes(i[0]); } :
                        i[0] instanceof RegExp ? function (replacedText) { return i[0].test(replacedText); } :
                            i[0],
                    i[1]
                ]
                : [
                    function (replacedText) { return replacedText.includes(i); },
                    "Name contains disallowed ".concat(i.length == 1 ? "icon" : "word", " ").concat(i)
                ];
        });
    })([
        "server", "admin", "moderator", "staff",
        [">|||>", "Name contains >|||> which is reserved for the server owner"],
        "\uE817", "\uE82C", "\uE88E",
        [/^<.{1,3}>/, "Name contains a prefix such as <a> which is used for role prefixes"],
        [function (replacedText) { return !isStaff && config_1.adminNames.includes(replacedText); }, "One of our admins uses this name"]
    ]);
    try {
        for (var filters_1 = __values(filters), filters_1_1 = filters_1.next(); !filters_1_1.done; filters_1_1 = filters_1.next()) {
            var _b = __read(filters_1_1.value, 2), check = _b[0], message = _b[1];
            if (check(replacedText))
                return message;
            if (check(antiEvasionText))
                return message;
        }
    }
    catch (e_3_1) { e_3 = { error: e_3_1 }; }
    finally {
        try {
            if (filters_1_1 && !filters_1_1.done && (_a = filters_1.return)) _a.call(filters_1);
        }
        finally { if (e_3) throw e_3.error; }
    }
    return false;
}
exports.isImpersonator = isImpersonator;
function logAction(action, by, to, reason, duration) {
    if (by === undefined) { //overload 1
        api.sendModerationMessage("".concat(action, "\n**Server:** ").concat((0, config_1.getGamemode)()));
        return;
    }
    if (to === undefined) { //overload 2
        api.sendModerationMessage("".concat(by.cleanedName, " ").concat(action, "\n**Server:** ").concat((0, config_1.getGamemode)()));
        return;
    }
    if (to) { //overload 3
        var name = void 0, uuid = void 0, ip = void 0;
        var actor = typeof by === "string" ? by : by.name;
        if (to instanceof players_1.FishPlayer) {
            name = escapeTextDiscord(to.name);
            uuid = to.uuid;
            ip = to.player.ip();
        }
        else if (typeof to == "string") {
            if (globals_1.uuidPattern.test(to)) {
                name = "[".concat(to, "]");
                uuid = to;
                ip = "[unknown]";
            }
            else {
                name = to;
                uuid = "[unknown]";
                ip = "[unknown]";
            }
        }
        else {
            name = escapeTextDiscord(to.lastName);
            uuid = to.id;
            ip = to.lastIP;
        }
        api.sendModerationMessage("".concat(actor, " ").concat(action, " ").concat(name, " ").concat(duration ? "for ".concat(formatTime(duration), " ") : "").concat(reason ? "with reason ".concat(escapeTextDiscord(reason)) : "", "\n**Server:** ").concat((0, config_1.getGamemode)(), "\n**uuid:** `").concat(uuid, "`\n**ip**: `").concat(ip, "`"));
        return;
    }
}
exports.logAction = logAction;
/**@returns the number of milliseconds. */
function parseTimeString(str) {
    var e_4, _a;
    var formats = [
        [/(\d+)s/, 1],
        [/(\d+)m/, 60],
        [/(\d+)h/, 3600],
        [/(\d+)d/, 86400],
        [/(\d+)w/, 604800]
    ].map(function (_a) {
        var _b = __read(_a, 2), regex = _b[0], mult = _b[1];
        return [Pattern.compile(regex.source), mult];
    });
    if (str == "forever")
        return (config_1.maxTime - Date.now() - 10000);
    try {
        for (var formats_1 = __values(formats), formats_1_1 = formats_1.next(); !formats_1_1.done; formats_1_1 = formats_1.next()) {
            var _b = __read(formats_1_1.value, 2), pattern_1 = _b[0], mult = _b[1];
            //rhino regex doesn't work
            var matcher = pattern_1.matcher(str);
            if (matcher.matches()) {
                var num = Number(matcher.group(1));
                if (!isNaN(num))
                    return (num * mult) * 1000;
            }
        }
    }
    catch (e_4_1) { e_4 = { error: e_4_1 }; }
    finally {
        try {
            if (formats_1_1 && !formats_1_1.done && (_a = formats_1.return)) _a.call(formats_1);
        }
        finally { if (e_4) throw e_4.error; }
    }
    return null;
}
exports.parseTimeString = parseTimeString;
/**Prevents Mindustry from displaying color tags in a string by escaping them. Example: turns [scarlet]red to [[scarlet]red. */
function escapeStringColorsClient(str) {
    return str.replace(/\[/g, "[[");
}
exports.escapeStringColorsClient = escapeStringColorsClient;
/**Prevents Mindustry from displaying color tags in a string by escaping them. Example: turns &bamogus to &&bamogus. */
function escapeStringColorsServer(str) {
    return str.replace(/&/g, "&&");
}
exports.escapeStringColorsServer = escapeStringColorsServer;
/** Triggers the restart countdown. Execution always returns from this function. */
function serverRestartLoop(sec) {
    if (sec > 0) {
        if (sec < 15 || sec % 5 == 0)
            Call.sendMessage("[scarlet]Server restarting in: ".concat(sec));
        Timer.schedule(function () { return serverRestartLoop(sec - 1); }, 1);
    }
    else {
        Log.info("Restarting...");
        Core.settings.manualSave();
        players_1.FishPlayer.saveAll();
        var file_1 = Vars.saveDirectory.child('1' + '.' + Vars.saveExtension);
        Vars.netServer.kickAll(Packets.KickReason.serverRestarting);
        Core.app.post(function () {
            SaveIO.save(file_1);
            Core.app.exit();
        });
    }
}
exports.serverRestartLoop = serverRestartLoop;
function isBuildable(block) {
    return block == Blocks.powerVoid || (block.buildType != Blocks.air.buildType && !(block instanceof ConstructBlock));
}
exports.isBuildable = isBuildable;
function getUnitType(type) {
    validUnits !== null && validUnits !== void 0 ? validUnits : (validUnits = Vars.content.units().select(function (u) { return !(u instanceof MissileUnitType || u.internal); }));
    var temp;
    if (temp = validUnits.find(function (u) { return u.name == type; }))
        return temp;
    else if (temp = validUnits.find(function (t) { return t.name.includes(type.toLowerCase()); }))
        return temp;
    return "\"".concat(type, "\" is not a valid unit type.");
}
exports.getUnitType = getUnitType;
var buildableBlocks = null;
var validUnits = null;
function getBlock(block) {
    buildableBlocks !== null && buildableBlocks !== void 0 ? buildableBlocks : (buildableBlocks = Vars.content.blocks().select(isBuildable));
    if (block in Blocks && Blocks[block] instanceof Block && isBuildable(Blocks[block]))
        return Blocks[block];
    else if (buildableBlocks.find(function (t) { return t.name.includes(block.toLowerCase()); }))
        return buildableBlocks.find(function (t) { return t.name.includes(block.toLowerCase()); });
    else if (buildableBlocks.find(function (t) { return t.name.replace(/-/g, "").includes(block.toLowerCase().replace(/ /g, "")); }))
        return buildableBlocks.find(function (t) { return t.name.replace(/-/g, "").includes(block.toLowerCase().replace(/ /g, "")); });
    else if (block.includes("airblast"))
        return Blocks.blastDrill;
    return "\"".concat(block, "\" is not a valid block.");
}
exports.getBlock = getBlock;
function teleportPlayer(player, to) {
    Timer.schedule(function () {
        player.unit().set(to.unit().x, to.unit().y);
        Call.setPosition(player.con, to.unit().x, to.unit().y);
        Call.setCameraPosition(player.con, to.unit().x, to.unit().y);
    }, 0, 0.016, 10);
}
exports.teleportPlayer = teleportPlayer;
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
exports.parseError = parseError;
/** Generates a tag template processor from a function that processes one value at a time. */
function tagProcessor(transformer) {
    return function (stringChunks) {
        var varChunks = [];
        for (var _i = 1; _i < arguments.length; _i++) {
            varChunks[_i - 1] = arguments[_i];
        }
        return String.raw.apply(String, __spreadArray([{ raw: stringChunks }], __read(varChunks.map(transformer)), false));
    };
}
exports.tagProcessor = tagProcessor;
function logErrors(message, func) {
    return function () {
        var args = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            args[_i] = arguments[_i];
        }
        try {
            return func.apply(void 0, __spreadArray([], __read(args), false));
        }
        catch (err) {
            Log.err(message);
            Log.err(parseError(err));
        }
    };
}
exports.logErrors = logErrors;
function definitelyRealMemoryCorruption() {
    Log.info("Triggering a prank: this will cause players to see two error messages claiming to be from a memory corruption, and cause a flickering amount of fissile matter and dormant cysts to be put in the core.");
    players_1.FishPlayer.messageStaff("[gray]<[cyan]staff[gray]> [white]Activating memory corruption prank! (please don't ruin it by telling players what is happening, pretend you dont know)");
    api.sendModerationMessage("Activated memory corruption prank on server ".concat(Vars.state.rules.mode().name()));
    var t1f = false;
    var t2f = false;
    globals_1.fishState.corruption_t1 = Timer.schedule(function () { return Vars.state.rules.defaultTeam.data().cores.first().items.set(Items.dormantCyst, (t1f = t1f !== true) ? 69 : 420); }, 0, 0.4, 600);
    globals_1.fishState.corruption_t2 = Timer.schedule(function () { return Vars.state.rules.defaultTeam.data().cores.first().items.set(Items.fissileMatter, (t2f = t2f !== true) ? 999 : 123); }, 0, 1.5, 200);
    var hexString = Math.floor(Math.random() * 0xFFFFFFFF).toString(16).padStart(8, "0");
    Call.sendMessage("[scarlet]Error: internal server error.");
    Call.sendMessage("[scarlet]Error: memory corruption: mindustry.world.modules.ItemModule@".concat(hexString));
}
exports.definitelyRealMemoryCorruption = definitelyRealMemoryCorruption;
function getEnemyTeam() {
    if (config_1.Mode.pvp())
        return Team.derelict;
    else
        return Vars.state.rules.waveTeam;
}
exports.getEnemyTeam = getEnemyTeam;
function neutralGameover() {
    Events.fire(new EventType.GameOverEvent(getEnemyTeam()));
}
exports.neutralGameover = neutralGameover;
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
exports.random = random;
function logHTrip(player, name, message) {
    Log.warn("&yPlayer &b\"".concat(player.cleanedName, "\"&y (&b").concat(player.uuid, "&y/&b").concat(player.ip(), "&y) tripped &c").concat(name, "&y") + (message ? ": ".concat(message) : ""));
    players_1.FishPlayer.messageStaff("[yellow]Player [blue]\"".concat(player.cleanedName, "\"[] ([blue]").concat(player.uuid, "[]/[blue]").concat(player.ip(), "[]) tripped [cyan]").concat(name, "[]") + (message ? ": ".concat(message) : ""));
    api.sendModerationMessage("Player `".concat(player.cleanedName, "` (`").concat(player.uuid, "`/`").concat(player.ip(), "`) tripped **").concat(name, "**").concat(message ? ": ".concat(message) : "", "\n**Server:** ").concat(config_1.Mode.name()));
}
exports.logHTrip = logHTrip;
function setType(input) { }
exports.setType = setType;
function untilForever() {
    return (config_1.maxTime - Date.now() - 10000);
}
exports.untilForever = untilForever;
function crash(message) {
    throw new Error(message);
}
exports.crash = crash;
function colorNumber(number, getColor, side) {
    if (side === void 0) { side = "client"; }
    return getColor(number) + number.toString() + side == "client" ? "[]" : "&fr";
}
exports.colorNumber = colorNumber;
