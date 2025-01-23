"use strict";
/*
Copyright © BalaM314, 2024. All Rights Reserved.
This file contains many utility functions.
*/
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
exports.addToTileHistory = void 0;
exports.formatTime = formatTime;
exports.formatModeName = formatModeName;
exports.formatTimestamp = formatTimestamp;
exports.formatTimeRelative = formatTimeRelative;
exports.colorBoolean = colorBoolean;
exports.colorBadBoolean = colorBadBoolean;
exports.getColor = getColor;
exports.nearbyEnemyTile = nearbyEnemyTile;
exports.getTeam = getTeam;
exports.getItem = getItem;
exports.matchFilter = matchFilter;
exports.removeFoosChars = removeFoosChars;
exports.cleanText = cleanText;
exports.isImpersonator = isImpersonator;
exports.logAction = logAction;
exports.parseTimeString = parseTimeString;
exports.serverRestartLoop = serverRestartLoop;
exports.isBuildable = isBuildable;
exports.getUnitType = getUnitType;
exports.getMap = getMap;
exports.getBlock = getBlock;
exports.teleportPlayer = teleportPlayer;
exports.logErrors = logErrors;
exports.definitelyRealMemoryCorruption = definitelyRealMemoryCorruption;
exports.getEnemyTeam = getEnemyTeam;
exports.neutralGameover = neutralGameover;
exports.skipWaves = skipWaves;
exports.logHTrip = logHTrip;
exports.setType = setType;
exports.untilForever = untilForever;
exports.colorNumber = colorNumber;
exports.getAntiBotInfo = getAntiBotInfo;
exports.outputFail = outputFail;
exports.outputSuccess = outputSuccess;
exports.outputMessage = outputMessage;
exports.outputConsole = outputConsole;
exports.updateBans = updateBans;
exports.processChat = processChat;
exports.getIPRange = getIPRange;
exports.getHash = getHash;
exports.match = match;
var api = require("./api");
var config_1 = require("./config");
var funcs_1 = require("./funcs");
var globals_1 = require("./globals");
var globals_2 = require("./globals");
var players_1 = require("./players");
function formatTime(time) {
    if (globals_1.maxTime - (time + Date.now()) < 20000)
        return "forever";
    var months = Math.floor(time / (30 * 24 * 60 * 60 * 1000));
    var days = Math.floor((time % (30 * 24 * 60 * 60 * 1000)) / (24 * 60 * 60 * 1000));
    var hours = Math.floor((time % (24 * 60 * 60 * 1000)) / (60 * 60 * 1000));
    var minutes = Math.floor((time % (60 * 60 * 1000)) / (60 * 1000));
    var seconds = Math.floor((time % (60 * 1000)) / (1000));
    return [
        months && "".concat(months, " month").concat(months != 1 ? "s" : ""),
        days && "".concat(days, " day").concat(days != 1 ? "s" : ""),
        hours && "".concat(hours, " hour").concat(hours != 1 ? "s" : ""),
        minutes && "".concat(minutes, " minute").concat(minutes != 1 ? "s" : ""),
        (seconds || time < 1000) && "".concat(seconds, " second").concat(seconds != 1 ? "s" : ""),
    ].filter(Boolean).join(", ");
}
//TODO move this data to be right next to Mode
function formatModeName(name) {
    return {
        "attack": "Attack",
        "survival": "Survival",
        "hexed": "Hexed",
        "pvp": "PVP",
        "sandbox": "Sandbox",
        "hardcore": "Hardcore"
    }[name];
}
function formatTimestamp(time) {
    var date = new Date(time);
    return "".concat(date.toDateString(), ", ").concat(date.toTimeString());
}
function formatTimeRelative(time, raw) {
    var difference = Math.abs(time - Date.now());
    if (difference < 1000)
        return "just now";
    else if (time > Date.now())
        return (raw ? "" : "in ") + formatTime(difference);
    else
        return formatTime(difference) + (raw ? "" : " ago");
}
function colorBoolean(val) {
    return val ? "[green]true[]" : "[red]false[]";
}
function colorBadBoolean(val) {
    return val ? "[red]true[]" : "[green]false[]";
}
/** Attempts to parse a Color from the input. */
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
        else if ((function (input) { return input in Color; })(input)) {
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
/** Searches for an enemy tile near a unit. */
function nearbyEnemyTile(unit, dist) {
    //because the indexer is buggy
    if (dist > 10)
        (0, funcs_1.crash)("nearbyEnemyTile(): dist (".concat(dist, ") is too high!"));
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
/** Attempts to parse a Team from the input. */
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
/** Attempts to parse an Item from the input. */
function getItem(item) {
    if (item in Items && Items[item] instanceof Item)
        return Items[item];
    else if (Vars.content.items().find(function (t) { return t.name.includes(item.toLowerCase()); }))
        return Vars.content.items().find(function (t) { return t.name.includes(item.toLowerCase()); });
    return "\"".concat(item, "\" is not a valid item.");
}
/**
 * @param wordList "chat" is least strict, followed by "strict", and "name" is most strict.
 * @returns a
 */
function matchFilter(input, wordList, aggressive) {
    var e_1, _a, e_2, _b;
    if (wordList === void 0) { wordList = "chat"; }
    if (aggressive === void 0) { aggressive = false; }
    var currentBannedWords = [
        config_1.bannedWords.normal,
        (wordList == "strict" || wordList == "name") && config_1.bannedWords.strict,
        wordList == "name" && config_1.bannedWords.names,
    ].filter(Boolean).flat();
    if (aggressive)
        currentBannedWords.push(["hitler", []]);
    //Replace substitutions
    var variations = [input, cleanText(input, false)];
    if (aggressive)
        variations.push(cleanText(input, true));
    try {
        for (var currentBannedWords_1 = __values(currentBannedWords), currentBannedWords_1_1 = currentBannedWords_1.next(); !currentBannedWords_1_1.done; currentBannedWords_1_1 = currentBannedWords_1.next()) {
            var _c = __read(currentBannedWords_1_1.value, 2), banned = _c[0], whitelist = _c[1];
            var _loop_1 = function (text_1) {
                if (banned instanceof RegExp ? banned.test(text_1) : text_1.includes(banned)) {
                    var modifiedText_1 = text_1;
                    whitelist.forEach(function (w) { return modifiedText_1 = modifiedText_1.replace(new RegExp(w, "g"), ""); }); //Replace whitelisted words with nothing
                    if (banned instanceof RegExp ? banned.test(modifiedText_1) : modifiedText_1.includes(banned)) //If the text still matches, fail
                        return { value: (banned === globals_2.uuidPattern ? "a Mindustry UUID" :
                                banned === globals_2.ipPattern || banned === globals_2.ipPortPattern ? "an IP address" :
                                    //parsing regex with regex, massive hack
                                    banned instanceof RegExp ? banned.source.replace(/\\b|\(\?\<\!.+?\)|\(\?\!.+?\)/g, "") :
                                        banned) };
                }
            };
            try {
                for (var variations_1 = (e_2 = void 0, __values(variations)), variations_1_1 = variations_1.next(); !variations_1_1.done; variations_1_1 = variations_1.next()) {
                    var text_1 = variations_1_1.value;
                    var state_1 = _loop_1(text_1);
                    if (typeof state_1 === "object")
                        return state_1.value;
                }
            }
            catch (e_2_1) { e_2 = { error: e_2_1 }; }
            finally {
                try {
                    if (variations_1_1 && !variations_1_1.done && (_b = variations_1.return)) _b.call(variations_1);
                }
                finally { if (e_2) throw e_2.error; }
            }
        }
    }
    catch (e_1_1) { e_1 = { error: e_1_1 }; }
    finally {
        try {
            if (currentBannedWords_1_1 && !currentBannedWords_1_1.done && (_a = currentBannedWords_1.return)) _a.call(currentBannedWords_1);
        }
        finally { if (e_1) throw e_1.error; }
    }
    return false;
}
var foosPattern = Pattern.compile(/[\u0F80-\u107F]{2}$/.source);
function removeFoosChars(text) {
    return foosPattern.matcher(text).replaceAll("");
}
function cleanText(text, applyAntiEvasion) {
    if (applyAntiEvasion === void 0) { applyAntiEvasion = false; }
    //Replace substitutions
    var replacedText = config_1.multiCharSubstitutions.reduce(function (acc, _a) {
        var _b = __read(_a, 2), from = _b[0], to = _b[1];
        return acc.replace(from, to);
    }, Strings.stripColors(removeFoosChars(text))
        .split("").map(function (c) { var _a; return (_a = config_1.substitutions[c]) !== null && _a !== void 0 ? _a : c; }).join(""))
        .toLowerCase()
        .trim();
    if (applyAntiEvasion) {
        replacedText = replacedText.replace(new RegExp("[^a-zA-Z0-9]", "gi"), "");
    }
    return replacedText;
}
function isImpersonator(name, isAdmin) {
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
        "\uE817", "\uE82C", "\uE88E", "\uE813",
        [/^<.{1,3}>/, "Name contains a prefix such as <a> which is used for role prefixes"],
        [function (replacedText) { return !isAdmin && config_1.adminNames.includes(replacedText.replace(/ /g, "")); }, "One of our admins uses this name"]
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
function logAction(action, by, to, reason, duration) {
    if (by === undefined) { //overload 1
        api.sendModerationMessage("".concat(action, "\n**Server:** ").concat(config_1.Gamemode.name()));
        return;
    }
    if (to === undefined) { //overload 2
        api.sendModerationMessage("".concat(by.cleanedName, " ").concat(action, "\n**Server:** ").concat(config_1.Gamemode.name()));
        return;
    }
    if (to) { //overload 3
        var name = void 0, uuid = void 0, ip = void 0;
        var actor = typeof by === "string" ? by : by.name;
        if (to instanceof players_1.FishPlayer) {
            name = (0, funcs_1.escapeTextDiscord)(to.name);
            uuid = to.uuid;
            ip = to.ip();
        }
        else if (typeof to == "string") {
            if (globals_2.uuidPattern.test(to)) {
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
            name = (0, funcs_1.escapeTextDiscord)(to.lastName);
            uuid = to.id;
            ip = to.lastIP;
        }
        api.sendModerationMessage("".concat(actor, " ").concat(action, " ").concat(name, " ").concat(duration ? "for ".concat(formatTime(duration), " ") : "").concat(reason ? "with reason ".concat((0, funcs_1.escapeTextDiscord)(reason)) : "", "\n**Server:** ").concat(config_1.Gamemode.name(), "\n**uuid:** `").concat(uuid, "`\n**ip**: `").concat(ip, "`"));
        return;
    }
}
/** @returns the number of milliseconds. */
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
        return (globals_1.maxTime - Date.now() - 10000);
    try {
        for (var formats_1 = __values(formats), formats_1_1 = formats_1.next(); !formats_1_1.done; formats_1_1 = formats_1.next()) {
            var _b = __read(formats_1_1.value, 2), pattern = _b[0], mult = _b[1];
            //rhino regex doesn't work
            var matcher = pattern.matcher(str);
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
/** Triggers the restart countdown. Execution always returns from this function. */
function serverRestartLoop(sec) {
    if (sec > 0) {
        if (sec < 15 || sec % 5 == 0)
            Call.sendMessage("[scarlet]Server restarting in: ".concat(sec));
        globals_2.fishState.restartLoopTask = Timer.schedule(function () { return serverRestartLoop(sec - 1); }, 1);
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
function isBuildable(block) {
    return block == Blocks.powerVoid || (block.buildType != Blocks.air.buildType && !(block instanceof ConstructBlock));
}
function getUnitType(type) {
    validUnits !== null && validUnits !== void 0 ? validUnits : (validUnits = Vars.content.units().select(function (u) { return !(u instanceof MissileUnitType || u.internal); }));
    var temp;
    if (temp = validUnits.find(function (u) { return u.name == type; }))
        return temp;
    else if (temp = validUnits.find(function (t) { return t.name.includes(type.toLowerCase()); }))
        return temp;
    return "\"".concat(type, "\" is not a valid unit type.");
}
//TODO refactor this, lots of duped code across multiple select functions
function getMap(name) {
    var e_5, _a;
    if (name == "")
        return "none";
    var mode = Vars.state.rules.mode();
    var maps = Vars.maps.all() /*.select(m => mode.valid(m))*/; //this doesn't work...
    var filters = [
        //m => m.name() === name, //exact match
        function (m) { return m.name().replace(/ /g, "_") === name; }, //exact match with spaces replaced
        function (//exact match with spaces replaced
        m) { return m.name().replace(/ /g, "_").toLowerCase() === name.toLowerCase(); }, //exact match with spaces replaced ignoring case
        function (//exact match with spaces replaced ignoring case
        m) { return m.plainName().replace(/ /g, "_").toLowerCase() === name.toLowerCase(); }, //exact match with spaces replaced ignoring case and colors
        function (//exact match with spaces replaced ignoring case and colors
        m) { return m.plainName().toLowerCase().includes(name.toLowerCase()); }, //partial match ignoring case and colors
        function (//partial match ignoring case and colors
        m) { return m.plainName().replace(/ /g, "_").toLowerCase().includes(name.toLowerCase()); }, //partial match with spaces replaced ignoring case and colors
        function (//partial match with spaces replaced ignoring case and colors
        m) { return m.plainName().replace(/ /g, "").toLowerCase().includes(name.toLowerCase()); }, //partial match with spaces removed ignoring case and colors
        function (//partial match with spaces removed ignoring case and colors
        m) { return m.plainName().replace(/[^a-zA-Z]/gi, "").toLowerCase().includes(name.toLowerCase()); },
    ];
    try {
        for (var filters_2 = __values(filters), filters_2_1 = filters_2.next(); !filters_2_1.done; filters_2_1 = filters_2.next()) {
            var filter = filters_2_1.value;
            var matchingMaps = maps.select(filter);
            if (matchingMaps.size == 1)
                return matchingMaps.get(0);
            else if (matchingMaps.size > 1)
                return "multiple";
            //if empty, go to next filter
        }
    }
    catch (e_5_1) { e_5 = { error: e_5_1 }; }
    finally {
        try {
            if (filters_2_1 && !filters_2_1.done && (_a = filters_2.return)) _a.call(filters_2);
        }
        finally { if (e_5) throw e_5.error; }
    }
    //no filters returned a result
    return "none";
}
var buildableBlocks = null;
var validUnits = null;
function getBlock(block, filter) {
    buildableBlocks !== null && buildableBlocks !== void 0 ? buildableBlocks : (buildableBlocks = Vars.content.blocks().select(isBuildable));
    var check = {
        buildable: function (b) { return isBuildable(b); },
        air: function (b) { return b == Blocks.air || isBuildable(b); },
        all: function (b) { return true; }
    }[filter];
    var out;
    if (block in Blocks && Blocks[block] instanceof Block && check(Blocks[block]))
        return Blocks[block];
    else if (out = Vars.content.blocks().find(function (t) { return t.name.includes(block.toLowerCase()) && check(t); }))
        return out;
    else if (out = Vars.content.blocks().find(function (t) { return t.name.replace(/-/g, "").includes(block.toLowerCase().replace(/ /g, "")) && check(t); }))
        return out;
    else if (block.includes("airblast"))
        return Blocks.blastDrill;
    return "\"".concat(block, "\" is not a valid block.");
}
function teleportPlayer(player, to) {
    Timer.schedule(function () {
        player.unit().set(to.unit().x, to.unit().y);
        Call.setPosition(player.con, to.unit().x, to.unit().y);
        Call.setCameraPosition(player.con, to.unit().x, to.unit().y);
    }, 0, 0.016, 10);
}
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
            Log.err((0, funcs_1.parseError)(err));
        }
    };
}
function definitelyRealMemoryCorruption() {
    Log.info("Triggering a prank: this will cause players to see two error messages claiming to be from a memory corruption, and cause a flickering amount of fissile matter and dormant cysts to be put in the core.");
    players_1.FishPlayer.messageStaff("[gray]<[cyan]staff[gray]> [white]Activating memory corruption prank! (please don't ruin it by telling players what is happening, pretend you dont know)");
    api.sendModerationMessage("Activated memory corruption prank on server ".concat(Vars.state.rules.mode().name()));
    var t1f = false;
    var t2f = false;
    globals_2.fishState.corruption_t1 = Timer.schedule(function () { return Vars.state.rules.defaultTeam.data().cores.first().items.set(Items.dormantCyst, (t1f = t1f !== true) ? 69 : 420); }, 0, 0.4, 600);
    globals_2.fishState.corruption_t2 = Timer.schedule(function () { return Vars.state.rules.defaultTeam.data().cores.first().items.set(Items.fissileMatter, (t2f = t2f !== true) ? 999 : 123); }, 0, 1.5, 200);
    var hexString = Math.floor(Math.random() * 0xFFFFFFFF).toString(16).padStart(8, "0");
    Call.sendMessage("[scarlet]Error: internal server error.");
    Call.sendMessage("[scarlet]Error: memory corruption: mindustry.world.modules.ItemModule@".concat(hexString));
}
function getEnemyTeam() {
    if (config_1.Gamemode.pvp())
        return Team.derelict;
    else
        return Vars.state.rules.waveTeam;
}
function neutralGameover() {
    players_1.FishPlayer.ignoreGameover(function () {
        if (config_1.Gamemode.hexed())
            serverRestartLoop(15);
        else
            Events.fire(new EventType.GameOverEvent(getEnemyTeam()));
    });
}
/** Please validate wavesToSkip to ensure it is not huge */
function skipWaves(wavesToSkip, runIntermediateWaves) {
    if (runIntermediateWaves) {
        for (var i = 0; i < wavesToSkip; i++) {
            Vars.logic.skipWave();
        }
    }
    else {
        Vars.state.wave += wavesToSkip - 1;
        Vars.logic.skipWave();
    }
}
function logHTrip(player, name, message) {
    Log.warn("&yPlayer &b\"".concat(player.cleanedName, "\"&y (&b").concat(player.uuid, "&y/&b").concat(player.ip(), "&y) tripped &c").concat(name, "&y") + (message ? ": ".concat(message) : ""));
    players_1.FishPlayer.messageStaff("[yellow]Player [blue]\"".concat(player.cleanedName, "\"[] tripped [cyan]").concat(name, "[]") + (message ? ": ".concat(message) : ""));
    api.sendModerationMessage("Player `".concat(player.cleanedName, "` (`").concat(player.uuid, "`/`").concat(player.ip(), "`) tripped **").concat(name, "**").concat(message ? ": ".concat(message) : "", "\n**Server:** ").concat(config_1.Gamemode.name()));
}
function setType(input) { }
function untilForever() {
    return (globals_1.maxTime - Date.now() - 10000);
}
function colorNumber(number, getColor, side) {
    if (side === void 0) { side = "client"; }
    return getColor(number) + number.toString() + (side == "client" ? "[]" : "&fr");
}
function getAntiBotInfo(side) {
    var color = side == "client" ? "[acid]" : "&ly";
    var True = side == "client" ? "[red]true[]" : "&lrtrue";
    var False = side == "client" ? "[green]false[]" : "&gfalse";
    return ("".concat(color, "Flag count(last 1 minute period): ").concat(players_1.FishPlayer.flagCount, "\n").concat(color, "Autobanning flagged players: ").concat(players_1.FishPlayer.shouldWhackFlaggedPlayers() ? True : False, "\n").concat(color, "Kicking new players: ").concat(players_1.FishPlayer.shouldKickNewPlayers() ? True : False, "\n").concat(color, "Recent connect packets(last 1 minute period): ").concat(players_1.FishPlayer.playersJoinedRecent, "\n").concat(color, "Override: ").concat(players_1.FishPlayer.antiBotModeOverride ? True : False));
}
var failPrefix = "[scarlet]\u26A0 [yellow]";
var successPrefix = "[#48e076]\uE800 ";
function outputFail(message, sender) {
    sender.sendMessage(failPrefix + (typeof message == "function" && "__partialFormatString" in message ? message("[yellow]") : message));
}
function outputSuccess(message, sender) {
    sender.sendMessage(successPrefix + (typeof message == "function" && "__partialFormatString" in message ? message("[#48e076]") : message));
}
function outputMessage(message, sender) {
    sender.sendMessage(((typeof message == "function" && "__partialFormatString" in message ? message(null) : message) + "").replace(/\t/g, " ".repeat(4)));
}
function outputConsole(message, channel) {
    if (channel === void 0) { channel = Log.info; }
    channel(typeof message == "function" && "__partialFormatString" in message ? message("") : message);
}
function updateBans(message) {
    Groups.player.each(function (player) {
        if (Vars.netServer.admins.isIDBanned(player.uuid())) {
            player.con.kick(Packets.KickReason.banned);
            if (message)
                Call.sendMessage(message(player));
        }
    });
}
function processChat(player, message, effects) {
    if (effects === void 0) { effects = false; }
    var fishPlayer = players_1.FishPlayer.get(player);
    var highlight = fishPlayer.highlight;
    var filterTripText;
    var suspicious = fishPlayer.joinsLessThan(3);
    if ((!fishPlayer.hasPerm("bypassChatFilter") || fishPlayer.chatStrictness == "strict")
        && (filterTripText = matchFilter(message, fishPlayer.chatStrictness, suspicious))) {
        if (effects) {
            if (suspicious && removeFoosChars(message).split(" ")
                .map(function (w) { return w.replace(/[-_.^*,]/g, ""); })
                .some(function (w) { return config_1.bannedWords.autoWhack.includes(w); })) {
                logHTrip(fishPlayer, "bad words in chat", "message: `".concat(message, "`"));
                fishPlayer.muted = true;
                fishPlayer.stop("automod", globals_1.maxTime, "Automatic stop due to suspicious activity", false);
            }
            Log.info("Censored message from player ".concat(player.name, ": \"").concat((0, funcs_1.escapeStringColorsServer)(message), "\"; contained \"").concat(filterTripText, "\""));
            players_1.FishPlayer.messageStaff("[yellow]Censored message from player ".concat(fishPlayer.cleanedName, ": \"").concat(message, "\" contained \"").concat(filterTripText, "\""));
        }
        message = config_1.text.chatFilterReplacement.message();
        highlight !== null && highlight !== void 0 ? highlight : (highlight = config_1.text.chatFilterReplacement.highlight());
    }
    if (message.startsWith("./"))
        message = message.replace("./", "/");
    if (!fishPlayer.hasPerm("chat")) {
        if (effects) {
            players_1.FishPlayer.messageMuted(player.name, message);
            Log.info("<muted>".concat(player.name, ": ").concat(message));
        }
        return null;
    }
    return (highlight !== null && highlight !== void 0 ? highlight : "") + message;
}
exports.addToTileHistory = logErrors("Error while saving a tilelog entry", function (e) {
    var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m, _o, _p, _q, _r, _s, _t, _u, _v, _w, _x, _y, _z, _0;
    var tile, uuid, action, type, time = Date.now();
    if (e instanceof EventType.BlockBuildBeginEvent) {
        tile = e.tile;
        uuid = (_e = (_c = (_b = (_a = e.unit) === null || _a === void 0 ? void 0 : _a.player) === null || _b === void 0 ? void 0 : _b.uuid()) !== null && _c !== void 0 ? _c : (_d = e.unit) === null || _d === void 0 ? void 0 : _d.type.name) !== null && _e !== void 0 ? _e : "unknown";
        if (e.breaking) {
            action = "broke";
            type = (e.tile.build instanceof ConstructBlock.ConstructBuild) ? e.tile.build.previous.name : "unknown";
            if (((_g = (_f = e.unit) === null || _f === void 0 ? void 0 : _f.player) === null || _g === void 0 ? void 0 : _g.uuid()) && ((_h = e.tile.build) === null || _h === void 0 ? void 0 : _h.team) != Team.derelict) {
                var fishP = players_1.FishPlayer.get(e.unit.player);
                //TODO move this code
                fishP.tstats.blocksBroken++;
                fishP.stats.blocksBroken++;
            }
        }
        else {
            action = "built";
            type = (e.tile.build instanceof ConstructBlock.ConstructBuild) ? e.tile.build.current.name : "unknown";
            if ((_k = (_j = e.unit) === null || _j === void 0 ? void 0 : _j.player) === null || _k === void 0 ? void 0 : _k.uuid()) {
                var fishP = players_1.FishPlayer.get(e.unit.player);
                //TODO move this code
                fishP.stats.blocksPlaced++;
            }
        }
    }
    else if (e instanceof EventType.ConfigEvent) {
        tile = e.tile.tile;
        uuid = (_m = (_l = e.player) === null || _l === void 0 ? void 0 : _l.uuid()) !== null && _m !== void 0 ? _m : "unknown";
        action = "configured";
        type = e.tile.block.name;
    }
    else if (e instanceof EventType.BuildRotateEvent) {
        tile = e.build.tile;
        uuid = (_s = (_q = (_p = (_o = e.unit) === null || _o === void 0 ? void 0 : _o.player) === null || _p === void 0 ? void 0 : _p.uuid()) !== null && _q !== void 0 ? _q : (_r = e.unit) === null || _r === void 0 ? void 0 : _r.type.name) !== null && _s !== void 0 ? _s : "unknown";
        action = "rotated";
        type = e.build.block.name;
    }
    else if (e instanceof EventType.UnitDestroyEvent) {
        tile = e.unit.tileOn();
        if (!tile)
            return;
        if (!e.unit.type.playerControllable)
            return;
        uuid = e.unit.isPlayer() ? e.unit.getPlayer().uuid() : (_t = e.unit.lastCommanded) !== null && _t !== void 0 ? _t : "unknown";
        action = "killed";
        type = e.unit.type.name;
    }
    else if (e instanceof EventType.BlockDestroyEvent) {
        if (config_1.Gamemode.attack() && ((_u = e.tile.build) === null || _u === void 0 ? void 0 : _u.team) != Vars.state.rules.defaultTeam)
            return; //Don't log destruction of enemy blocks
        tile = e.tile;
        uuid = "[[something]";
        action = "killed";
        type = (_w = (_v = e.tile.block()) === null || _v === void 0 ? void 0 : _v.name) !== null && _w !== void 0 ? _w : "air";
    }
    else if (e instanceof EventType.PayloadDropEvent) {
        action = "pay-dropped";
        var controller = e.carrier.controller();
        uuid = (_z = (_y = (_x = e.carrier.player) === null || _x === void 0 ? void 0 : _x.uuid()) !== null && _y !== void 0 ? _y : (controller instanceof LogicAI ? "".concat(e.carrier.type.name, " controlled by ").concat(controller.controller.block.name, " at ").concat(controller.controller.tileX(), ",").concat(controller.controller.tileY(), " last accessed by ").concat(e.carrier.getControllerName()) : null)) !== null && _z !== void 0 ? _z : e.carrier.type.name;
        if (e.build) {
            tile = e.build.tile;
            type = e.build.block.name;
        }
        else if (e.unit) {
            tile = e.unit.tileOn();
            if (!tile)
                return;
            type = e.unit.type.name;
        }
        else
            return;
    }
    else if (e instanceof EventType.PickupEvent) {
        action = "picked up";
        if (e.carrier.isPlayer())
            return; //This event would have been handled by actionfilter
        var controller = e.carrier.controller();
        if (!(controller instanceof LogicAI))
            return;
        uuid = "".concat(e.carrier.type.name, " controlled by ").concat(controller.controller.block.name, " at ").concat(controller.controller.tileX(), ",").concat(controller.controller.tileY(), " last accessed by ").concat(e.carrier.getControllerName());
        if (e.build) {
            tile = e.build.tile;
            type = e.build.block.name;
        }
        else if (e.unit) {
            tile = e.unit.tileOn();
            if (!tile)
                return;
            type = e.unit.type.name;
        }
        else
            return;
    }
    else if (e instanceof Object && "pos" in e && "uuid" in e && "action" in e && "type" in e) {
        var pos = void 0;
        (pos = e.pos, uuid = e.uuid, action = e.action, type = e.type);
        tile = (_0 = Vars.world.tile(pos.split(",")[0], pos.split(",")[1])) !== null && _0 !== void 0 ? _0 : (0, funcs_1.crash)("Cannot log ".concat(action, " at ").concat(pos, ": Nonexistent tile"));
    }
    else
        return;
    if (tile == null)
        return;
    [tile, uuid, action, type, time];
    tile.getLinkedTiles(function (t) {
        var pos = "".concat(t.x, ",").concat(t.y);
        var existingData = globals_2.tileHistory[pos] ? funcs_1.StringIO.read(globals_2.tileHistory[pos], function (str) { return str.readArray(function (d) { return ({
            action: d.readString(2),
            uuid: d.readString(3),
            time: d.readNumber(16),
            type: d.readString(2),
        }); }, 1); }) : [];
        existingData.push({
            action: action,
            uuid: uuid,
            time: time,
            type: type
        });
        if (existingData.length >= 9) {
            existingData = existingData.splice(0, 9);
        }
        //Write
        globals_2.tileHistory[t.x + ',' + t.y] = funcs_1.StringIO.write(existingData, function (str, data) { return str.writeArray(data, function (el) {
            str.writeString(el.action, 2);
            str.writeString(el.uuid, 3);
            str.writeNumber(el.time, 16);
            str.writeString(el.type, 2);
        }, 1); });
    });
});
function getIPRange(input, error) {
    if (globals_2.ipRangeCIDRPattern.test(input)) {
        var _a = __read(input.split("/"), 2), ip = _a[0], maskLength = _a[1];
        switch (maskLength) {
            case "24":
                return ip.split(".").slice(0, 3).join(".") + ".";
            case "16":
                return ip.split(".").slice(0, 2).join(".") + ".";
            default:
                error === null || error === void 0 ? void 0 : error("Mindustry does not currently support netmasks other than /16 and /24");
                return null;
        }
    }
    else if (globals_2.ipRangeWildcardPattern.test(input)) {
        //1.2.3.*
        //1.2.*
        var _b = __read(input.split("."), 4), a = _b[0], b = _b[1], c = _b[2], d = _b[3];
        if (c !== "*")
            return "".concat(a, ".").concat(b, ".").concat(c, ".");
        return "".concat(a, ".").concat(b, ".");
    }
    else
        return null;
}
//this brings me physical pain
function getHash(file, algorithm) {
    if (algorithm === void 0) { algorithm = "SHA-1"; }
    try {
        var header = "blob ".concat(file.length(), "\0");
        var fileSHAHeader = Packages.java.nio.charset.StandardCharsets.UTF_8.encode(header);
        var contents = file.readBytes();
        var buffer = Packages.java.nio.ByteBuffer.allocate(fileSHAHeader.remaining() + contents.length);
        buffer.put(fileSHAHeader);
        buffer.put(contents);
        buffer.flip();
        var digest = Packages.java.security.MessageDigest.getInstance(algorithm);
        digest.update(buffer);
        return digest.digest().map(function (byte) {
            return (byte & 0xFF).toString(16).padStart(2, "0");
        }).join("");
    }
    catch (e) {
        Log.err("Cannot generate ".concat(algorithm, ", ").concat(e));
        return undefined;
    }
}
function match(value, clauses, defaultValue) {
    return Object.prototype.hasOwnProperty.call(clauses, value) ? clauses[value] : defaultValue;
}
