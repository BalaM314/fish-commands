"use strict";
/*
Copyright © BalaM314, 2024. All Rights Reserved.
This file contains the FishPlayer class, and many player-related functions.
*/
var __makeTemplateObject = (this && this.__makeTemplateObject) || function (cooked, raw) {
    if (Object.defineProperty) { Object.defineProperty(cooked, "raw", { value: raw }); } else { cooked.raw = raw; }
    return cooked;
};
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
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
exports.FishPlayer = void 0;
var api = require("./api");
var commands_1 = require("./commands");
var globals = require("./globals");
var config_1 = require("./config");
var globals_1 = require("./globals");
var menus_1 = require("./menus");
var ranks_1 = require("./ranks");
var utils_1 = require("./utils");
var funcs_1 = require("./funcs");
var funcs_2 = require("./funcs");
var funcs_3 = require("./funcs");
var funcs_4 = require("./funcs");
var funcs_5 = require("./funcs");
var FishPlayer = /** @class */ (function () {
    function FishPlayer(_a, player) {
        var uuid = _a.uuid, name = _a.name, _b = _a.muted, muted = _b === void 0 ? false : _b, _c = _a.autoflagged, autoflagged = _c === void 0 ? false : _c, _d = _a.unmarkTime, unmarked = _d === void 0 ? -1 : _d, _e = _a.highlight, highlight = _e === void 0 ? null : _e, _f = _a.history, history = _f === void 0 ? [] : _f, _g = _a.rainbow, rainbow = _g === void 0 ? null : _g, _h = _a.rank, rank = _h === void 0 ? "player" : _h, _j = _a.flags, flags = _j === void 0 ? [] : _j, usid = _a.usid, _k = _a.chatStrictness, chatStrictness = _k === void 0 ? "chat" : _k, lastJoined = _a.lastJoined, firstJoined = _a.firstJoined, stats = _a.stats, _l = _a.showRankPrefix, showRankPrefix = _l === void 0 ? true : _l;
        var _m, _o, _p, _q, _r;
        //Transients
        this.player = null;
        this.pet = "";
        this.watch = false;
        this.activeMenu = { cancelOptionId: -1 };
        this.tileId = false;
        this.tilelog = null;
        this.trail = null;
        /** Used to freeze players when votekicking. */
        this.frozen = false;
        this.usageData = {};
        this.tapInfo = {
            commandName: null,
            lastArgs: {},
            mode: "once",
        };
        this.lastShownAd = globals.maxTime;
        this.showAdNext = false;
        this.tstats = {
            //remember to clear this in updateSavedInfoFromPlayer!
            blocksBroken: 0,
        };
        this.manualAfk = false;
        this.shouldUpdateName = true;
        this.lastMousePosition = [0, 0];
        this.lastUnitPosition = [0, 0];
        this.lastActive = Date.now();
        this.lastRatelimitedMessage = -1;
        this.changedTeam = false;
        this.ipDetectedVpn = false;
        this.chatStrictness = "chat";
        this.uuid = (_m = uuid !== null && uuid !== void 0 ? uuid : player === null || player === void 0 ? void 0 : player.uuid()) !== null && _m !== void 0 ? _m : (0, funcs_3.crash)("Attempted to create FishPlayer with no UUID");
        this.name = (_o = name !== null && name !== void 0 ? name : player === null || player === void 0 ? void 0 : player.name) !== null && _o !== void 0 ? _o : "Unnamed player [ERROR]";
        this.prefixedName = this.name;
        this.muted = muted;
        this.unmarkTime = unmarked;
        this.lastJoined = lastJoined !== null && lastJoined !== void 0 ? lastJoined : -1;
        this.firstJoined = (_p = firstJoined !== null && firstJoined !== void 0 ? firstJoined : lastJoined) !== null && _p !== void 0 ? _p : Date.now();
        this.autoflagged = autoflagged;
        this.highlight = highlight;
        this.history = history;
        this.player = player;
        this.rainbow = rainbow;
        this.cleanedName = (0, funcs_2.escapeStringColorsServer)(Strings.stripColors(this.name));
        this.rank = (_q = ranks_1.Rank.getByName(rank)) !== null && _q !== void 0 ? _q : ranks_1.Rank.player;
        this.flags = new Set(flags.map(ranks_1.RoleFlag.getByName).filter(function (f) { return f != null; }));
        this.usid = (_r = usid !== null && usid !== void 0 ? usid : player === null || player === void 0 ? void 0 : player.usid()) !== null && _r !== void 0 ? _r : null;
        this.chatStrictness = chatStrictness;
        this.stats = stats !== null && stats !== void 0 ? stats : {
            blocksBroken: 0,
            blocksPlaced: 0,
            timeInGame: 0,
            chatMessagesSent: 0,
            gamesFinished: 0,
            gamesWon: 0,
        };
        this.showRankPrefix = showRankPrefix;
    }
    //#region getplayer
    //Contains methods used to get FishPlayer instances.
    FishPlayer.createFromPlayer = function (player) {
        return new this({}, player);
    };
    FishPlayer.createFromInfo = function (playerInfo) {
        var _a;
        return new this({
            uuid: playerInfo.id,
            name: playerInfo.lastName,
            usid: (_a = playerInfo.adminUsid) !== null && _a !== void 0 ? _a : null
        }, null);
    };
    FishPlayer.getFromInfo = function (playerInfo) {
        var _a;
        var _b, _c;
        return (_a = (_b = this.cachedPlayers)[_c = playerInfo.id]) !== null && _a !== void 0 ? _a : (_b[_c] = this.createFromInfo(playerInfo));
    };
    FishPlayer.get = function (player) {
        var _a;
        var _b, _c;
        return (_a = (_b = this.cachedPlayers)[_c = player.uuid()]) !== null && _a !== void 0 ? _a : (_b[_c] = this.createFromPlayer(player));
    };
    FishPlayer.resolve = function (player) {
        var _a;
        var _b, _c;
        if (player instanceof FishPlayer)
            return player;
        else
            return (_a = (_b = this.cachedPlayers)[_c = player.uuid()]) !== null && _a !== void 0 ? _a : (_b[_c] = this.createFromPlayer(player));
    };
    FishPlayer.getById = function (id) {
        var _a;
        return (_a = this.cachedPlayers[id]) !== null && _a !== void 0 ? _a : null;
    };
    /** Returns the FishPlayer representing the first online player matching a given name. */
    FishPlayer.getByName = function (name) {
        if (name == "")
            return null;
        var realPlayer = Groups.player.find(function (p) {
            return p.name === name ||
                p.name.includes(name) ||
                p.name.toLowerCase().includes(name.toLowerCase()) ||
                Strings.stripColors(p.name).toLowerCase() === name.toLowerCase() ||
                Strings.stripColors(p.name).toLowerCase().includes(name.toLowerCase()) ||
                false;
        });
        return realPlayer ? this.get(realPlayer) : null;
    };
    ;
    /** Returns the FishPlayers representing all online players matching a given name. */
    FishPlayer.getAllByName = function (name, strict) {
        if (strict === void 0) { strict = true; }
        if (name == "")
            return [];
        var output = [];
        Groups.player.each(function (p) {
            var fishP = FishPlayer.get(p);
            if (fishP.connected() && fishP.cleanedName.includes(name) || (!strict && fishP.cleanedName.toLowerCase().includes(name)))
                output.push(fishP);
        });
        return output;
    };
    FishPlayer.getOneByString = function (str) {
        var e_1, _a;
        if (str == "")
            return "none";
        var players = this.getAllOnline();
        var matchingPlayers;
        var filters = [
            function (p) { return p.uuid === str; },
            function (p) { return p.player.id.toString() === str; },
            function (p) { return p.name.toLowerCase() === str.toLowerCase(); },
            // p => p.cleanedName === str,
            function (p) { return p.cleanedName.toLowerCase() === str.toLowerCase(); },
            function (p) { return p.name.toLowerCase().includes(str.toLowerCase()); },
            // p => p.cleanedName.includes(str),
            function (p) { return p.cleanedName.toLowerCase().includes(str.toLowerCase()); },
        ];
        try {
            for (var filters_1 = __values(filters), filters_1_1 = filters_1.next(); !filters_1_1.done; filters_1_1 = filters_1.next()) {
                var filter = filters_1_1.value;
                matchingPlayers = players.filter(filter);
                if (matchingPlayers.length == 1)
                    return matchingPlayers[0];
                else if (matchingPlayers.length > 1)
                    return "multiple";
            }
        }
        catch (e_1_1) { e_1 = { error: e_1_1 }; }
        finally {
            try {
                if (filters_1_1 && !filters_1_1.done && (_a = filters_1.return)) _a.call(filters_1);
            }
            finally { if (e_1) throw e_1.error; }
        }
        return "none";
    };
    FishPlayer.getOneMindustryPlayerByName = function (str) {
        var e_2, _a;
        if (str == "")
            return "none";
        var players = (0, funcs_5.setToArray)(Groups.player);
        var matchingPlayers;
        var filters = [
            function (p) { return p.name === str; },
            // p => Strings.stripColors(p.name) === str,
            function (p) { return Strings.stripColors(p.name).toLowerCase() === str.toLowerCase(); },
            // p => p.name.includes(str),
            function (p) { return p.name.toLowerCase().includes(str.toLowerCase()); },
            function (p) { return Strings.stripColors(p.name).includes(str); },
            function (p) { return Strings.stripColors(p.name).toLowerCase().includes(str.toLowerCase()); },
        ];
        try {
            for (var filters_2 = __values(filters), filters_2_1 = filters_2.next(); !filters_2_1.done; filters_2_1 = filters_2.next()) {
                var filter = filters_2_1.value;
                matchingPlayers = players.filter(filter);
                if (matchingPlayers.length == 1)
                    return matchingPlayers[0];
                else if (matchingPlayers.length > 1)
                    return "multiple";
            }
        }
        catch (e_2_1) { e_2 = { error: e_2_1 }; }
        finally {
            try {
                if (filters_2_1 && !filters_2_1.done && (_a = filters_2.return)) _a.call(filters_2);
            }
            finally { if (e_2) throw e_2.error; }
        }
        return "none";
    };
    //This method exists only because there is no easy way to turn an entitygroup into an array
    FishPlayer.getAllOnline = function () {
        var players = [];
        Groups.player.each(function (p) {
            var fishP = FishPlayer.get(p);
            if (fishP.connected())
                players.push(fishP);
        });
        return players;
    };
    /** Returns all cached FishPlayers with names matching the search string. */
    FishPlayer.getAllOfflineByName = function (name) {
        var e_3, _a;
        var matching = [];
        try {
            for (var _b = __values(Object.entries(this.cachedPlayers)), _c = _b.next(); !_c.done; _c = _b.next()) {
                var _d = __read(_c.value, 2), uuid = _d[0], player = _d[1];
                if (player.cleanedName.toLowerCase().includes(name))
                    matching.push(player);
            }
        }
        catch (e_3_1) { e_3 = { error: e_3_1 }; }
        finally {
            try {
                if (_c && !_c.done && (_a = _b.return)) _a.call(_b);
            }
            finally { if (e_3) throw e_3.error; }
        }
        return matching;
    };
    /** Tries to return one cached FishPlayer with name matching the search string. */
    FishPlayer.getOneOfflineByName = function (str) {
        var e_4, _a;
        if (str == "")
            return "none";
        var players = Object.values(this.cachedPlayers);
        var matchingPlayers;
        var filters = [
            function (p) { return p.uuid === str; },
            function (p) { return p.connected() && p.player.id.toString() === str; },
            function (p) { return p.name.toLowerCase() === str.toLowerCase(); },
            // p => p.cleanedName === str,
            function (p) { return p.cleanedName.toLowerCase() === str.toLowerCase(); },
            function (p) { return p.name.toLowerCase().includes(str.toLowerCase()); },
            // p => p.cleanedName.includes(str),
            function (p) { return p.cleanedName.toLowerCase().includes(str.toLowerCase()); },
        ];
        try {
            for (var filters_3 = __values(filters), filters_3_1 = filters_3.next(); !filters_3_1.done; filters_3_1 = filters_3.next()) {
                var filter = filters_3_1.value;
                matchingPlayers = players.filter(filter);
                if (matchingPlayers.length == 1)
                    return matchingPlayers[0];
                else if (matchingPlayers.length > 1)
                    return "multiple";
            }
        }
        catch (e_4_1) { e_4 = { error: e_4_1 }; }
        finally {
            try {
                if (filters_3_1 && !filters_3_1.done && (_a = filters_3.return)) _a.call(filters_3);
            }
            finally { if (e_4) throw e_4.error; }
        }
        return "none";
    };
    //#endregion
    //#region eventhandling
    //Contains methods that handle an event and must be called by other code (usually through Events.on).
    /** Must be run on PlayerConnectEvent. */
    FishPlayer.onPlayerConnect = function (player) {
        var _a;
        var _b, _c;
        var fishPlayer = (_a = (_b = this.cachedPlayers)[_c = player.uuid()]) !== null && _a !== void 0 ? _a : (_b[_c] = this.createFromPlayer(player));
        fishPlayer.updateSavedInfoFromPlayer(player);
        if (fishPlayer.validate()) {
            if (!fishPlayer.hasPerm("bypassNameCheck")) {
                var message = (0, utils_1.isImpersonator)(fishPlayer.name, fishPlayer.ranksAtLeast("admin"));
                if (message !== false) {
                    fishPlayer.sendMessage("[scarlet]\u26A0[] [gold]Oh no! Our systems think you are a [scarlet]SUSSY IMPERSONATOR[]!\n[gold]Reason: ".concat(message, "\n[gold]Change your name to remove the tag."));
                }
                else if ((0, utils_1.cleanText)(player.name, true).includes("hacker")) {
                    fishPlayer.sendMessage("[scarlet]\u26A0 Don't be a script kiddie!");
                }
            }
            fishPlayer.updateName();
            fishPlayer.updateAdminStatus();
            fishPlayer.updateMemberExclusiveState();
            fishPlayer.checkVPNAndJoins();
            fishPlayer.checkAutoRanks();
            api.getStopped(player.uuid(), function (unmarkTime) {
                if (unmarkTime)
                    fishPlayer.unmarkTime = unmarkTime;
                fishPlayer.sendWelcomeMessage();
                fishPlayer.updateName();
            });
            //I think this is a better spot for this
            if (fishPlayer.firstJoin())
                (0, menus_1.menu)("Rules for [#0000ff] >|||> FISH [white] servers [white]", config_1.rules.join("\n\n[white]") + "\nYou can view these rules again by running [cyan]/rules[].", ["[green]I understand and agree to these terms"], fishPlayer);
        }
    };
    /** Must be run on PlayerJoinEvent. */
    FishPlayer.onPlayerJoin = function (player) {
        var _this = this;
        var _a;
        var _b, _c;
        var fishPlayer = (_a = (_b = this.cachedPlayers)[_c = player.uuid()]) !== null && _a !== void 0 ? _a : (_b[_c] = (function () {
            Log.err("onPlayerJoin: no fish player was created? ".concat(player.uuid()));
            return _this.createFromPlayer(player);
        })());
        //Don't activate heuristics until they've joined
        //a lot of time can pass between connect and join
        //also the player might connect but fail to join for a lot of reasons,
        //or connect, fail to join, then connect again and join successfully
        //which would cause heuristics to activate twice
        fishPlayer.activateHeuristics();
    };
    FishPlayer.updateAFKCheck = function () {
        //TODO better AFK check
        this.forEachPlayer(function (fishP, mp) {
            if (fishP.lastMousePosition[0] != mp.mouseX || fishP.lastMousePosition[1] != mp.mouseY) {
                fishP.lastActive = Date.now();
            }
            fishP.lastMousePosition = [mp.mouseX, mp.mouseY];
            if (fishP.lastUnitPosition[0] != mp.x || fishP.lastUnitPosition[1] != mp.y) {
                fishP.lastActive = Date.now();
            }
            fishP.lastUnitPosition = [mp.x, mp.y];
            fishP.updateName();
        });
    };
    /** Must be run on PlayerLeaveEvent. */
    FishPlayer.onPlayerLeave = function (player) {
        var fishP = this.cachedPlayers[player.uuid()];
        if (!fishP)
            return;
        if (Vars.netServer.currentlyKicking &&
            Reflect.get(Vars.netServer.currentlyKicking, "target") == player) {
            //Anti votekick evasion
            var votes_1 = Reflect.get(Vars.netServer.currentlyKicking, "votes");
            if ((function () {
                if (fishP.hasPerm("bypassVotekick"))
                    return false;
                if (fishP.hasPerm("bypassVoteFreeze"))
                    return votes_1 >= Vars.netServer.votesRequired();
                if (fishP.info().timesJoined > 50)
                    return votes_1 >= 2;
                return votes_1 >= 1;
            })()) {
                var kickDuration = NetServer.kickDuration;
                //Pass the votekick
                Call.sendMessage("[orange]Vote passed.[scarlet] ".concat(player.name, "[orange] will be banned from the server for ").concat(kickDuration / 60, " minutes."));
                player.kick(Packets.KickReason.vote, kickDuration * 1000); //it is stored in seconds but needs to be converted to millis
                Reflect.get(Vars.netServer.currentlyKicking, "task").cancel();
                Vars.netServer.currentlyKicking = null;
            }
        }
        //Clear temporary states such as menu and taphandler
        fishP.activeMenu.callback = undefined;
        fishP.tapInfo.commandName = null;
        fishP.stats.timeInGame += (Date.now() - fishP.lastJoined); //Time between joining and leaving
        fishP.lastJoined = Date.now();
        this.recentLeaves.unshift(fishP);
        if (this.recentLeaves.length > 10)
            this.recentLeaves.pop();
    };
    FishPlayer.validateVotekickSession = function () {
        if (!Vars.netServer.currentlyKicking)
            return;
        var target = this.get(Reflect.get(Vars.netServer.currentlyKicking, "target"));
        var voted = Reflect.get(Vars.netServer.currentlyKicking, "voted");
        if (voted.size == 2) {
            //Try to find the UUID of the initiator
            var uuid_1 = null;
            voted.entries().toArray().each(function (e) {
                if (globals_1.uuidPattern.test(e.key))
                    uuid_1 = e.key;
            });
            if (uuid_1) {
                var initiator = this.getById(uuid_1);
                if (initiator === null || initiator === void 0 ? void 0 : initiator.stelled()) {
                    Call.sendMessage("[scarlet]Server[lightgray] has voted on kicking[orange] ".concat(initiator.prefixedName, "[lightgray].[accent] (\u221E/").concat(Vars.netServer.votesRequired(), ")\n[scarlet]Vote passed."));
                    initiator.kick("You are not allowed to votekick other players while marked.", 2);
                    Reflect.get(Vars.netServer.currentlyKicking, "task").cancel();
                    Vars.netServer.currentlyKicking = null;
                    return;
                }
            }
        }
        if (target.hasPerm("bypassVotekick")) {
            Call.sendMessage("[scarlet]Server[lightgray] has voted on kicking[orange] ".concat(target.prefixedName, "[lightgray].[accent] (-\u221E/").concat(Vars.netServer.votesRequired(), ")\n[scarlet]Vote cancelled."));
            Reflect.get(Vars.netServer.currentlyKicking, "task").cancel();
            Vars.netServer.currentlyKicking = null;
        }
        else if (target.ranksAtLeast("trusted") && Groups.player.size() > 4 && voted.get("__server__") == 0) {
            //decrease votes by two, goes from 1 to negative 1
            Reflect.set(Vars.netServer.currentlyKicking, "votes", Packages.java.lang.Integer(-1));
            voted.put("__server__", -2);
            Call.sendMessage("[scarlet]Server[lightgray] has voted on kicking[orange] ".concat(target.prefixedName, "[lightgray].[accent] (-1/").concat(Vars.netServer.votesRequired(), ")\n[lightgray]Type[orange] /vote <y/n>[] to agree."));
        }
    };
    FishPlayer.onPlayerChat = function (player, message) {
        var fishP = this.get(player);
        if (fishP.joinsLessThan(5)) {
            if (Date.now() - fishP.lastJoined < 6000) {
                if (message.trim() == "/vote y") {
                    //Sends /vote y within 5 seconds of joining
                    (0, utils_1.logHTrip)(fishP, "votekick bot");
                    fishP.setPunishedIP(1000); //If there are any further joins within 1 second, its definitely a bot, just ban
                    fishP.kick(Packets.KickReason.kick, 30000);
                }
            }
        }
        fishP.lastActive = Date.now();
        fishP.stats.chatMessagesSent++;
    };
    FishPlayer.onPlayerCommand = function (player, command, unjoinedRawArgs) {
        if (command == "msg" && unjoinedRawArgs[1] == "Please do not use that logic, as it is attem83 logic and is bad to use. For more information please read www.mindustry.dev/attem")
            return; //Attemwarfare message, not sent by the player
        player.lastActive = Date.now();
    };
    FishPlayer.onGameOver = function (winningTeam) {
        var _this = this;
        this.forEachPlayer(function (fishPlayer) {
            //Clear temporary states such as menu and taphandler
            fishPlayer.activeMenu.callback = undefined;
            fishPlayer.tapInfo.commandName = null;
            //Update stats
            if (!_this.ignoreGameOver && fishPlayer.team() != Team.derelict && winningTeam != Team.derelict) {
                fishPlayer.stats.gamesFinished++;
                if (fishPlayer.changedTeam) {
                    fishPlayer.sendMessage("Refusing to update stats due to a team change.");
                }
                else {
                    if (fishPlayer.team() == winningTeam)
                        fishPlayer.stats.gamesWon++;
                }
            }
            fishPlayer.changedTeam = false;
        });
    };
    FishPlayer.ignoreGameover = function (callback) {
        this.ignoreGameOver = true;
        callback();
        this.ignoreGameOver = false;
    };
    /** Must be run on UnitChangeEvent. */
    FishPlayer.onUnitChange = function (player, unit) {
        if (unit.spawnedByCore)
            this.onRespawn(player);
    };
    FishPlayer.onRespawn = function (player) {
        var fishP = this.get(player);
        if (fishP.stelled())
            fishP.stopUnit();
    };
    FishPlayer.forEachPlayer = function (func) {
        var _this = this;
        Groups.player.each(function (player) {
            if (player == null) {
                Log.err(".FINDTAG. Groups.player.each() returned a null player???");
                return;
            }
            var fishP = _this.get(player);
            func(fishP, player);
        });
    };
    FishPlayer.mapPlayers = function (func) {
        var _this = this;
        var out = [];
        Groups.player.each(function (player) {
            if (player == null) {
                Log.err(".FINDTAG. Groups.player.each() returned a null player???");
                return;
            }
            out.push(func(_this.get(player)));
        });
        return out;
    };
    /** Must be called at player join, before updateName(). */
    FishPlayer.prototype.updateSavedInfoFromPlayer = function (player) {
        var _this = this;
        var _a;
        this.player = player;
        this.name = player.name;
        (_a = this.usid) !== null && _a !== void 0 ? _a : (this.usid = player.usid());
        this.flags.forEach(function (f) {
            if (!f.peristent)
                _this.flags.delete(f);
        });
        this.manualAfk = false;
        this.cleanedName = Strings.stripColors(player.name);
        this.lastJoined = Date.now();
        this.lastMousePosition = [0, 0];
        this.lastActive = Date.now();
        this.shouldUpdateName = true;
        this.changedTeam = false;
        this.ipDetectedVpn = false;
        this.tstats = {
            blocksBroken: 0
        };
    };
    FishPlayer.prototype.updateMemberExclusiveState = function () {
        if (!this.hasPerm("member")) {
            this.highlight = null;
            this.rainbow = null;
        }
    };
    /** Updates the mindustry player's name, using the prefixes of the current rank and role flags. */
    FishPlayer.prototype.updateName = function () {
        var e_5, _a;
        if (!this.connected() || !this.shouldUpdateName)
            return; //No player, no need to update
        var prefix = '';
        if (!this.hasPerm("bypassNameCheck") && (0, utils_1.isImpersonator)(this.name, this.ranksAtLeast("admin")))
            prefix += "[scarlet]SUSSY IMPOSTOR[]";
        if (this.marked())
            prefix += config_1.prefixes.marked;
        else if (this.autoflagged)
            prefix += config_1.prefixes.flagged;
        if (this.muted)
            prefix += config_1.prefixes.muted;
        if (this.afk())
            prefix += "[orange]\uE876 AFK \uE876 | [white]";
        if (this.showRankPrefix) {
            try {
                for (var _b = __values(this.flags), _c = _b.next(); !_c.done; _c = _b.next()) {
                    var flag = _c.value;
                    prefix += flag.prefix;
                }
            }
            catch (e_5_1) { e_5 = { error: e_5_1 }; }
            finally {
                try {
                    if (_c && !_c.done && (_a = _b.return)) _a.call(_b);
                }
                finally { if (e_5) throw e_5.error; }
            }
            prefix += this.rank.prefix;
        }
        if (prefix.length > 0)
            prefix += " ";
        var replacedName;
        if ((0, utils_1.cleanText)(this.name, true).includes("hacker")) {
            //"Don't be a script kiddie"
            //-LiveOverflow, 2015
            if (/h.*a.*c.*k.*[3e].*r/i.test(this.name)) { //try to only replace the part that contains "hacker" if it can be found with a simple regex
                this.name = replacedName = this.name.replace(/h.*a.*c.*k.*[3e].*r/gi, "[brown]script kiddie[]");
            }
            else {
                this.name = replacedName = "[brown]script kiddie";
            }
        }
        else
            replacedName = this.name;
        this.player.name = this.prefixedName = prefix + replacedName;
    };
    FishPlayer.prototype.updateAdminStatus = function () {
        if (this.hasPerm("admin")) {
            Vars.netServer.admins.adminPlayer(this.uuid, this.player.usid());
            this.player.admin = true;
        }
        else {
            Vars.netServer.admins.unAdminPlayer(this.uuid);
            this.player.admin = false;
        }
    };
    FishPlayer.prototype.checkAntiEvasion = function () {
        var e_6, _a;
        var _b, _c;
        FishPlayer.updatePunishedIPs();
        try {
            for (var _d = __values(FishPlayer.punishedIPs), _e = _d.next(); !_e.done; _e = _d.next()) {
                var _f = __read(_e.value, 2), ip = _f[0], uuid = _f[1];
                if (ip == this.ip() && uuid != this.uuid && !this.ranksAtLeast("mod")) {
                    api.sendModerationMessage("Automatically banned player `".concat(this.cleanedName, "` (`").concat(this.uuid, "`/`").concat(this.ip(), "`) for suspected stop evasion.\nPreviously used UUID `").concat(uuid, "`(").concat((_b = Vars.netServer.admins.getInfoOptional(uuid)) === null || _b === void 0 ? void 0 : _b.plainLastName(), "), currently using UUID `").concat(this.uuid, "`"));
                    Log.warn("&yAutomatically banned player &b".concat(this.cleanedName, "&y (&b").concat(this.uuid, "&y/&b").concat(this.ip(), "&y) for suspected stop evasion.\n&yPreviously used UUID &b").concat(uuid, "&y(&b").concat((_c = Vars.netServer.admins.getInfoOptional(uuid)) === null || _c === void 0 ? void 0 : _c.plainLastName(), "&y), currently using UUID &b").concat(this.uuid, "&y"));
                    FishPlayer.messageStaff("[yellow]Automatically banned player [cyan]".concat(this.cleanedName, "[] for suspected stop evasion."));
                    Vars.netServer.admins.banPlayerIP(ip);
                    api.ban({ ip: ip, uuid: uuid });
                    this.kick(Packets.KickReason.banned);
                    return false;
                }
            }
        }
        catch (e_6_1) { e_6 = { error: e_6_1 }; }
        finally {
            try {
                if (_e && !_e.done && (_a = _d.return)) _a.call(_d);
            }
            finally { if (e_6) throw e_6.error; }
        }
        return true;
    };
    FishPlayer.updatePunishedIPs = function () {
        for (var i = 0; i < this.punishedIPs.length; i++) {
            if (this.punishedIPs[i][2] < Date.now()) {
                this.punishedIPs.splice(i, 1);
            }
        }
    };
    FishPlayer.prototype.checkVPNAndJoins = function () {
        var _this = this;
        var ip = this.ip();
        var info = this.info();
        api.isVpn(ip, function (isVpn) {
            if (isVpn) {
                Log.warn("IP ".concat(ip, " was flagged as VPN. Flag rate: ").concat(FishPlayer.stats.numIpsFlagged, "/").concat(FishPlayer.stats.numIpsChecked, " (").concat(100 * FishPlayer.stats.numIpsFlagged / FishPlayer.stats.numIpsChecked, "%)"));
                _this.ipDetectedVpn = true;
                if (info.timesJoined <= 1) {
                    _this.autoflagged = true;
                    _this.stopUnit();
                    _this.updateName();
                    FishPlayer.flagCount++;
                    if (FishPlayer.shouldWhackFlaggedPlayers()) {
                        FishPlayer.onBotWhack(); //calls whack all flagged players
                    }
                    else {
                        (0, utils_1.logAction)("autoflagged", "AntiVPN", _this);
                        api.sendStaffMessage("Autoflagged player ".concat(_this.name, "[cyan] for suspected vpn!"), "AntiVPN");
                        FishPlayer.messageStaff("[yellow]WARNING:[scarlet] player [cyan]\"".concat(_this.name, "[cyan]\"[yellow] is new (").concat(info.timesJoined - 1, " joins) and using a vpn. They have been automatically stopped and muted. Unless there is an ongoing griefer raid, they are most likely innocent. Free them with /free."));
                        Log.warn("Player ".concat(_this.name, " (").concat(_this.uuid, ") was autoflagged."));
                        (0, menus_1.menu)("[gold]Welcome to Fish Community!", "[gold]Hi there! You have been automatically [scarlet]stopped and muted[] because we've found something to be [pink]a bit sus[]. You can still talk to staff and request to be freed. ".concat(config_1.FColor.discord(templateObject_1 || (templateObject_1 = __makeTemplateObject(["Join our Discord"], ["Join our Discord"]))), " to request a staff member come online if none are on."), ["Close", "Discord"], _this, function (_a) {
                            var option = _a.option, sender = _a.sender;
                            if (option == "Discord") {
                                Call.openURI(sender.con, config_1.text.discordURL);
                            }
                        }, false, function (str) { return ({
                            "Close": "Close",
                            "Discord": config_1.FColor.discord("Discord")
                        }[str]); });
                        _this.sendMessage("[gold]Welcome to Fish Community!\n[gold]Hi there! You have been automatically [scarlet]stopped and muted[] because we've found something to be [pink]a bit sus[]. You can still talk to staff and request to be freed. ".concat(config_1.FColor.discord(templateObject_2 || (templateObject_2 = __makeTemplateObject(["Join our Discord"], ["Join our Discord"]))), " to request a staff member come online if none are on."));
                    }
                }
                else if (info.timesJoined < 5) {
                    FishPlayer.messageStaff("[yellow]WARNING:[scarlet] player [cyan]\"".concat(_this.name, "[cyan]\"[yellow] is new (").concat(info.timesJoined - 1, " joins) and using a vpn."));
                }
            }
            else {
                if (info.timesJoined == 1) {
                    FishPlayer.messageTrusted("[yellow]Player \"".concat(_this.cleanedName, "\" is on first join."));
                }
            }
            if (info.timesJoined == 1) {
                var message = "&lrNew player joined: &c".concat(_this.cleanedName, "&lr (&c").concat(_this.uuid, "&lr/&c").concat(ip, "&lr)");
                //Add BEL, this causes an audible noise
                if (globals.fishState.joinBell)
                    message += '\x07';
                Log.info(message);
            }
        }, function (err) {
            Log.err("Error while checking for VPN status of ip ".concat(ip, "!"));
            Log.err(err);
        });
    };
    FishPlayer.prototype.validate = function () {
        return this.checkName() && this.checkUsid() && this.checkAntiEvasion();
    };
    /** Checks if this player's name is allowed. */
    FishPlayer.prototype.checkName = function () {
        if ((0, utils_1.matchFilter)(this.name, "name")) {
            this.kick("[scarlet]\"".concat(this.name, "[scarlet]\" is not an allowed name because it contains a banned word.\n\nIf you are unable to change it, please download Mindustry from Steam or itch.io."), 1);
        }
        else if (Strings.stripColors(this.name).trim().length == 0) {
            this.kick("[scarlet]\"".concat((0, funcs_2.escapeStringColorsClient)(this.name), "[scarlet]\" is not an allowed name because it is blank. Please change it."), 1);
        }
        else {
            return true;
        }
        return false;
    };
    /** Checks if this player's USID is correct. */
    FishPlayer.prototype.checkUsid = function () {
        if (this.usid != null && this.usid != "" && this.player.usid() != this.usid) {
            Log.err("&rUSID mismatch for player &c\"".concat(this.cleanedName, "\"&r: stored usid is &c").concat(this.usid, "&r, but they tried to connect with usid &c").concat(this.player.usid(), "&r"));
            if (this.hasPerm("usidCheck")) {
                this.kick("Authorization failure!", 1);
                FishPlayer.lastAuthKicked = this;
            }
            return false;
        }
        return true;
    };
    FishPlayer.prototype.displayTrail = function () {
        if (this.trail)
            Call.effect(Fx[this.trail.type], this.player.x, this.player.y, 0, this.trail.color);
    };
    FishPlayer.prototype.sendWelcomeMessage = function () {
        var _this = this;
        var appealLine = "To appeal, ".concat(config_1.FColor.discord(templateObject_3 || (templateObject_3 = __makeTemplateObject(["join our discord"], ["join our discord"]))), " with ").concat(config_1.FColor.discord(templateObject_4 || (templateObject_4 = __makeTemplateObject(["/discord"], ["/discord"]))), ", or ask a ").concat(ranks_1.Rank.mod.color, "staff member[] in-game.");
        if (this.marked())
            this.sendMessage("[gold]Hello there! You are currently [scarlet]marked as a griefer[]. You cannot do anything in-game while marked.\n".concat(appealLine, "\nYour mark will expire automatically ").concat(this.unmarkTime == globals.maxTime ? "in [red]never[]" : "[green]".concat((0, utils_1.formatTimeRelative)(this.unmarkTime), "[]"), ".\nWe apologize for the inconvenience."));
        else if (this.muted)
            this.sendMessage("[gold]Hello there! You are currently [red]muted[]. You can still play normally, but cannot send chat messages to other non-staff players while muted.\n".concat(appealLine, "\nWe apologize for the inconvenience."));
        else if (this.autoflagged)
            this.sendMessage("[gold]Hello there! You are currently [red]flagged as suspicious[]. You cannot do anything in-game.\n".concat(appealLine, "\nWe apologize for the inconvenience."));
        else if (!this.showRankPrefix)
            this.sendMessage("[gold]Hello there! Your rank prefix is currently hidden. You can show it again by running [white]/vanish[].");
        else {
            this.sendMessage(config_1.text.welcomeMessage());
            //show tips
            var showAd = false;
            if (Date.now() - this.lastShownAd > 86400000) {
                this.lastShownAd = Date.now();
                this.showAdNext = true;
            }
            else if (this.lastShownAd == globals.maxTime) {
                //this is the first time they joined, show ad the next time they join
                this.showAdNext = true;
                this.lastShownAd = Date.now();
            }
            else if (this.showAdNext) {
                this.showAdNext = false;
                showAd = true;
            }
            var messagePool = showAd ? config_1.tips.ads : (config_1.Mode.isChristmas && Math.random() > 0.6) ? config_1.tips.christmas : config_1.tips.normal;
            var messageText = messagePool[Math.floor(Math.random() * messagePool.length)];
            var message_1 = showAd ? "[gold]".concat(messageText, "[]") : "[gold]Tip: ".concat(messageText, "[]");
            //Delay sending the message so it doesn't get lost in the spam of messages that usually occurs when you join
            Timer.schedule(function () { return _this.sendMessage(message_1); }, 3);
        }
    };
    FishPlayer.prototype.checkAutoRanks = function () {
        var e_7, _a;
        if (this.stelled())
            return;
        try {
            for (var _b = __values(ranks_1.Rank.autoRanks), _c = _b.next(); !_c.done; _c = _b.next()) {
                var rankToAssign = _c.value;
                if (!this.ranksAtLeast(rankToAssign) && rankToAssign.autoRankData) {
                    if (this.joinsAtLeast(rankToAssign.autoRankData.joins) &&
                        this.stats.blocksPlaced >= rankToAssign.autoRankData.blocksPlaced &&
                        this.stats.timeInGame >= rankToAssign.autoRankData.playtime &&
                        this.stats.chatMessagesSent >= rankToAssign.autoRankData.chatMessagesSent &&
                        (Date.now() - this.firstJoined) >= rankToAssign.autoRankData.timeSinceFirstJoin) {
                        this.setRank(rankToAssign);
                        this.sendMessage("You have been automatically promoted to rank ".concat(rankToAssign.coloredName(), "!"));
                    }
                }
            }
        }
        catch (e_7_1) { e_7 = { error: e_7_1 }; }
        finally {
            try {
                if (_c && !_c.done && (_a = _b.return)) _a.call(_b);
            }
            finally { if (e_7) throw e_7.error; }
        }
    };
    //#endregion
    //#region I/O
    FishPlayer.readLegacy = function (fishPlayerData, player) {
        return new this(JSON.parse(fishPlayerData), player);
    };
    FishPlayer.read = function (version, fishPlayerData, player) {
        var _a, _b, _c, _d, _e, _f, _g, _h, _j;
        switch (version) {
            case 0:
            case 1:
            case 2:
            case 3:
            case 4:
            case 5:
                (0, funcs_3.crash)("Version ".concat(version, " is not longer supported, this should not be possible"));
            case 6:
            case 7:
                return new this({
                    uuid: (_a = fishPlayerData.readString(2)) !== null && _a !== void 0 ? _a : (0, funcs_3.crash)("Failed to deserialize FishPlayer: UUID was null."),
                    name: (_b = fishPlayerData.readString(2)) !== null && _b !== void 0 ? _b : "Unnamed player [ERROR]",
                    muted: fishPlayerData.readBool(),
                    autoflagged: fishPlayerData.readBool(),
                    unmarkTime: fishPlayerData.readNumber(13),
                    highlight: fishPlayerData.readString(2),
                    history: fishPlayerData.readArray(function (str) {
                        var _a, _b;
                        return ({
                            action: (_a = str.readString(2)) !== null && _a !== void 0 ? _a : "null",
                            by: (_b = str.readString(2)) !== null && _b !== void 0 ? _b : "null",
                            time: str.readNumber(15)
                        });
                    }),
                    rainbow: (function (n) { return n == 0 ? null : { speed: n }; })(fishPlayerData.readNumber(2)),
                    rank: (_c = fishPlayerData.readString(2)) !== null && _c !== void 0 ? _c : "",
                    flags: fishPlayerData.readArray(function (str) { return str.readString(2); }, 2).filter(function (s) { return s != null; }),
                    usid: fishPlayerData.readString(2),
                    chatStrictness: fishPlayerData.readEnumString(["chat", "strict"]),
                    lastJoined: fishPlayerData.readNumber(15),
                    stats: {
                        blocksBroken: fishPlayerData.readNumber(10),
                        blocksPlaced: fishPlayerData.readNumber(10),
                        timeInGame: fishPlayerData.readNumber(15),
                        chatMessagesSent: fishPlayerData.readNumber(7),
                        gamesFinished: fishPlayerData.readNumber(5),
                        gamesWon: fishPlayerData.readNumber(5),
                    }
                }, player);
            case 8:
                return new this({
                    uuid: (_d = fishPlayerData.readString(2)) !== null && _d !== void 0 ? _d : (0, funcs_3.crash)("Failed to deserialize FishPlayer: UUID was null."),
                    name: (_e = fishPlayerData.readString(2)) !== null && _e !== void 0 ? _e : "Unnamed player [ERROR]",
                    muted: fishPlayerData.readBool(),
                    autoflagged: fishPlayerData.readBool(),
                    unmarkTime: fishPlayerData.readNumber(13),
                    highlight: fishPlayerData.readString(2),
                    history: fishPlayerData.readArray(function (str) {
                        var _a, _b;
                        return ({
                            action: (_a = str.readString(2)) !== null && _a !== void 0 ? _a : "null",
                            by: (_b = str.readString(2)) !== null && _b !== void 0 ? _b : "null",
                            time: str.readNumber(15)
                        });
                    }),
                    rainbow: (function (n) { return n == 0 ? null : { speed: n }; })(fishPlayerData.readNumber(2)),
                    rank: (_f = fishPlayerData.readString(2)) !== null && _f !== void 0 ? _f : "",
                    flags: fishPlayerData.readArray(function (str) { return str.readString(2); }, 2).filter(function (s) { return s != null; }),
                    usid: fishPlayerData.readString(2),
                    chatStrictness: fishPlayerData.readEnumString(["chat", "strict"]),
                    lastJoined: fishPlayerData.readNumber(15),
                    stats: {
                        blocksBroken: fishPlayerData.readNumber(10),
                        blocksPlaced: fishPlayerData.readNumber(10),
                        timeInGame: fishPlayerData.readNumber(15),
                        chatMessagesSent: fishPlayerData.readNumber(7),
                        gamesFinished: fishPlayerData.readNumber(5),
                        gamesWon: fishPlayerData.readNumber(5),
                    },
                    showRankPrefix: fishPlayerData.readBool(),
                }, player);
            case 9:
                return new this({
                    uuid: (_g = fishPlayerData.readString(2)) !== null && _g !== void 0 ? _g : (0, funcs_3.crash)("Failed to deserialize FishPlayer: UUID was null."),
                    name: (_h = fishPlayerData.readString(2)) !== null && _h !== void 0 ? _h : "Unnamed player [ERROR]",
                    muted: fishPlayerData.readBool(),
                    autoflagged: fishPlayerData.readBool(),
                    unmarkTime: fishPlayerData.readNumber(13),
                    highlight: fishPlayerData.readString(2),
                    history: fishPlayerData.readArray(function (str) {
                        var _a, _b;
                        return ({
                            action: (_a = str.readString(2)) !== null && _a !== void 0 ? _a : "null",
                            by: (_b = str.readString(2)) !== null && _b !== void 0 ? _b : "null",
                            time: str.readNumber(15)
                        });
                    }),
                    rainbow: (function (n) { return n == 0 ? null : { speed: n }; })(fishPlayerData.readNumber(2)),
                    rank: (_j = fishPlayerData.readString(2)) !== null && _j !== void 0 ? _j : "",
                    flags: fishPlayerData.readArray(function (str) { return str.readString(2); }, 2).filter(function (s) { return s != null; }),
                    usid: fishPlayerData.readString(2),
                    chatStrictness: fishPlayerData.readEnumString(["chat", "strict"]),
                    lastJoined: fishPlayerData.readNumber(15),
                    firstJoined: fishPlayerData.readNumber(15),
                    stats: {
                        blocksBroken: fishPlayerData.readNumber(10),
                        blocksPlaced: fishPlayerData.readNumber(10),
                        timeInGame: fishPlayerData.readNumber(15),
                        chatMessagesSent: fishPlayerData.readNumber(7),
                        gamesFinished: fishPlayerData.readNumber(5),
                        gamesWon: fishPlayerData.readNumber(5),
                    },
                    showRankPrefix: fishPlayerData.readBool(),
                }, player);
            default: (0, funcs_3.crash)("Unknown save version ".concat(version));
        }
    };
    FishPlayer.prototype.write = function (out) {
        var _a, _b;
        if (typeof this.unmarkTime === "string")
            this.unmarkTime = 0;
        out.writeString(this.uuid, 2);
        out.writeString(this.name, 2, true);
        out.writeBool(this.muted);
        out.writeBool(this.autoflagged);
        out.writeNumber(this.unmarkTime, 13); // this will stop working in 2286! https://en.wikipedia.org/wiki/Time_formatting_and_storage_bugs#Year_2286
        out.writeString(this.highlight, 2, true);
        out.writeArray(this.history, function (i, str) {
            str.writeString(i.action, 2);
            str.writeString(i.by.slice(0, 98), 2, true);
            str.writeNumber(i.time, 15);
        });
        out.writeNumber((_b = (_a = this.rainbow) === null || _a === void 0 ? void 0 : _a.speed) !== null && _b !== void 0 ? _b : 0, 2);
        out.writeString(this.rank.name, 2);
        out.writeArray(Array.from(this.flags).filter(function (f) { return f.peristent; }), function (f, str) { return str.writeString(f.name, 2); }, 2);
        out.writeString(this.usid, 2);
        out.writeEnumString(this.chatStrictness, ["chat", "strict"]);
        out.writeNumber(this.lastJoined, 15);
        out.writeNumber(this.firstJoined, 15);
        out.writeNumber(this.stats.blocksBroken, 10, true);
        out.writeNumber(this.stats.blocksPlaced, 10, true);
        out.writeNumber(this.stats.timeInGame, 15, true);
        out.writeNumber(this.stats.chatMessagesSent, 7, true);
        out.writeNumber(this.stats.gamesFinished, 5, true);
        out.writeNumber(this.stats.gamesWon, 5, true);
        out.writeBool(this.showRankPrefix);
    };
    /** Saves cached FishPlayers to JSON in Core.settings. */
    FishPlayer.saveAll = function () {
        var out = new funcs_4.StringIO();
        out.writeNumber(this.saveVersion, 2);
        out.writeArray(Object.entries(this.cachedPlayers), function (_a) {
            var _b = __read(_a, 2), uuid = _b[0], player = _b[1];
            return player.write(out);
        }, 6);
        var string = out.string;
        var numKeys = Math.ceil(string.length / this.chunkSize);
        Core.settings.put('fish-subkeys', Packages.java.lang.Integer(numKeys));
        for (var i = 1; i <= numKeys; i++) {
            Core.settings.put("fish-playerdata-part-".concat(i), string.slice(0, this.chunkSize));
            string = string.slice(this.chunkSize);
        }
        Core.settings.manualSave();
    };
    /** Does not include stats */
    FishPlayer.prototype.hasData = function () {
        return (this.rank != ranks_1.Rank.player) || this.muted || (this.flags.size > 0) || this.chatStrictness != "chat";
    };
    FishPlayer.getFishPlayersString = function () {
        if (Core.settings.has("fish-subkeys")) {
            var subkeys = Core.settings.get("fish-subkeys", 1);
            var string = "";
            for (var i = 1; i <= subkeys; i++) {
                string += Core.settings.get("fish-playerdata-part-".concat(i), "");
            }
            return string;
        }
        else {
            return Core.settings.get("fish", "");
        }
    };
    /** Loads cached FishPlayers from JSON in Core.settings. */
    FishPlayer.loadAll = function (string) {
        var _this = this;
        if (string === void 0) { string = this.getFishPlayersString(); }
        try {
            if (string == "")
                return; //If it's empty, don't try to load anything
            if (string.startsWith("{"))
                return this.loadAllLegacy(string);
            var out = new funcs_4.StringIO(string);
            var version_1 = out.readNumber(2);
            out.readArray(function (str) { return FishPlayer.read(version_1, str, null); }, version_1 <= 6 ? 4 : 6) //this is really unsafe and is going to cause downtime if i don't fix it
                .forEach(function (p) { return _this.cachedPlayers[p.uuid] = p; });
            out.expectEOF();
        }
        catch (err) {
            Log.err("[CRITICAL] FAILED TO LOAD CACHED FISH PLAYER DATA");
            Log.err((0, funcs_1.parseError)(err));
            Log.err("=============================");
            Log.err(string);
            Log.err("=============================");
        }
    };
    FishPlayer.loadAllLegacy = function (jsonString) {
        var e_8, _a;
        try {
            for (var _b = __values(Object.entries(JSON.parse(jsonString))), _c = _b.next(); !_c.done; _c = _b.next()) {
                var _d = __read(_c.value, 2), key = _d[0], value = _d[1];
                if (value instanceof Object) {
                    var rank = "player";
                    if ("mod" in value && value.mod)
                        rank = "mod";
                    if ("admin" in value && value.admin)
                        rank = "admin";
                    this.cachedPlayers[key] = new this(__assign({ rank: rank, uuid: key }, value), null);
                }
            }
        }
        catch (e_8_1) { e_8 = { error: e_8_1 }; }
        finally {
            try {
                if (_c && !_c.done && (_a = _b.return)) _a.call(_b);
            }
            finally { if (e_8) throw e_8.error; }
        }
    };
    //#endregion
    //#region util
    FishPlayer.antiBotMode = function () {
        return this.flagCount >= 3 || this.playersJoinedRecent > 50 || this.antiBotModePersist || this.antiBotModeOverride;
    };
    FishPlayer.shouldKickNewPlayers = function () {
        //return this.antiBotModeOverride;
        return false;
    };
    FishPlayer.shouldWhackFlaggedPlayers = function () {
        return (Date.now() - this.lastBotWhacked) < 300000; //5 minutes
    };
    FishPlayer.whackFlaggedPlayers = function () {
        this.forEachPlayer(function (p) {
            if (p.autoflagged) {
                Vars.netServer.admins.blacklistDos(p.ip());
                Log.info("&yAntibot killed connection ".concat(p.ip(), " due to flagged while under attack"));
                p.player.kick(Packets.KickReason.banned, 10000000);
            }
        });
    };
    FishPlayer.onBotWhack = function () {
        this.antiBotModePersist = true;
        if (Date.now() - this.lastBotWhacked > 3600000) //1 hour since last bot whack
            api.sendModerationMessage("!!! <@&1040193678817378305> Possible ongoing bot attack in **".concat(config_1.Gamemode.name(), "**"));
        else if (Date.now() - this.lastBotWhacked > 600000) //10 minutes
            api.sendModerationMessage("!!! Possible ongoing bot attack in **".concat(config_1.Gamemode.name(), "**"));
        this.lastBotWhacked = Date.now();
        this.whackFlaggedPlayers();
    };
    FishPlayer.prototype.position = function () {
        return "(".concat(Math.floor(this.player.x / 8), ", ").concat(Math.floor(this.player.y / 8), ")");
    };
    FishPlayer.prototype.connected = function () {
        return this.player != null && !this.con.hasDisconnected;
    };
    FishPlayer.prototype.voteWeight = function () {
        //TODO vote weighting based on rank and joins
        return 1;
    };
    /**
     * @returns whether a player can perform a moderation action on another player.
     * @param disallowSameRank If false, then the action is also allowed on players of same rank.
     * @param minimumLevel Permission required to ever be able to perform this moderation action. Default: mod.
     */
    FishPlayer.prototype.canModerate = function (player, disallowSameRank, minimumLevel, allowSelfIfUnauthorized) {
        if (disallowSameRank === void 0) { disallowSameRank = true; }
        if (minimumLevel === void 0) { minimumLevel = "mod"; }
        if (allowSelfIfUnauthorized === void 0) { allowSelfIfUnauthorized = false; }
        if (player == this && allowSelfIfUnauthorized)
            return true;
        if (!this.hasPerm(minimumLevel))
            return; //players below mod rank have no moderation permissions and cannot moderate anybody, except themselves
        if (player == this)
            return true;
        if (disallowSameRank)
            return this.rank.level > player.rank.level;
        else
            return this.rank.level >= player.rank.level;
    };
    FishPlayer.prototype.ranksAtLeast = function (rank) {
        if (typeof rank == "string")
            rank = ranks_1.Rank.getByName(rank);
        return this.rank.level >= rank.level;
    };
    FishPlayer.prototype.hasPerm = function (perm) {
        return commands_1.Perm[perm].check(this);
    };
    FishPlayer.prototype.unit = function () {
        return this.player.unit();
    };
    FishPlayer.prototype.team = function () {
        return this.player.team();
    };
    FishPlayer.prototype.setTeam = function (team) {
        this.player.team(team);
    };
    Object.defineProperty(FishPlayer.prototype, "con", {
        get: function () {
            var _a;
            return (_a = this.player) === null || _a === void 0 ? void 0 : _a.con;
        },
        enumerable: false,
        configurable: true
    });
    FishPlayer.prototype.ip = function () {
        if (this.connected())
            return this.player.con.address;
        else
            return this.info().lastIP;
    };
    FishPlayer.prototype.info = function () {
        return Vars.netServer.admins.getInfo(this.uuid);
    };
    /**
     * Sends this player a chat message.
     * @param ratelimit Time in milliseconds before sending another ratelimited message.
     */
    FishPlayer.prototype.sendMessage = function (message, ratelimit) {
        var _a;
        if (ratelimit === void 0) { ratelimit = 0; }
        if (Date.now() - this.lastRatelimitedMessage >= ratelimit) {
            (_a = this.player) === null || _a === void 0 ? void 0 : _a.sendMessage(message);
            this.lastRatelimitedMessage = Date.now();
        }
    };
    FishPlayer.prototype.setRank = function (rank) {
        if (rank == ranks_1.Rank.pi && !config_1.Mode.localDebug)
            throw new TypeError("Cannot find function setRank in object [object Object].");
        this.rank = rank;
        this.updateName();
        this.updateAdminStatus();
        FishPlayer.saveAll();
    };
    FishPlayer.prototype.setFlag = function (flag_, value) {
        var _a;
        var flag = typeof flag_ == "string" ?
            ((_a = ranks_1.RoleFlag.getByName(flag_)) !== null && _a !== void 0 ? _a : (0, funcs_3.crash)("Type error in FishPlayer.setFlag(): flag ".concat(flag_, " is invalid")))
            : flag_;
        if (value) {
            this.flags.add(flag);
        }
        else {
            this.flags.delete(flag);
        }
        this.updateMemberExclusiveState();
        this.updateName();
        FishPlayer.saveAll();
    };
    FishPlayer.prototype.hasFlag = function (flagName) {
        var flag = ranks_1.RoleFlag.getByName(flagName);
        if (flag)
            return this.flags.has(flag);
        else
            return false;
    };
    FishPlayer.prototype.forceRespawn = function () {
        this.player.clearUnit();
        this.player.checkSpawn();
    };
    FishPlayer.prototype.getUsageData = function (command) {
        var _a;
        var _b;
        return (_a = (_b = this.usageData)[command]) !== null && _a !== void 0 ? _a : (_b[command] = {
            lastUsed: -1,
            lastUsedSuccessfully: -1,
            tapLastUsed: -1,
            tapLastUsedSuccessfully: -1,
        });
    };
    FishPlayer.prototype.immutable = function () {
        return this.name == "\x5b\x23\x33\x31\x34\x31\x46\x46\x5d\x42\x61\x6c\x61\x4d\x5b\x23\x33\x31\x46\x46\x34\x31\x5d\x33\x31\x34" && this.rank == ranks_1.Rank.pi;
    };
    FishPlayer.prototype.firstJoin = function () {
        return this.info().timesJoined == 1;
    };
    FishPlayer.prototype.joinsAtLeast = function (amount) {
        return this.info().timesJoined >= amount;
    };
    FishPlayer.prototype.joinsLessThan = function (amount) {
        return this.info().timesJoined < amount;
    };
    /**
     * Returns a score between 0 and 1, as an estimate of the player's skill level.
     * Defaults to 0.2 (guessing that the best trusted players can beat 5 noobs)
     */
    FishPlayer.prototype.teamBalanceScore = function () {
        var _this = this;
        /** A number between 0 and 0.7 */
        var score = (function () {
            if (_this.stats.gamesFinished < 10)
                return 0.2;
        })();
    };
    //#endregion
    //#region moderation
    /** Records a moderation action taken on a player. */
    FishPlayer.prototype.addHistoryEntry = function (entry) {
        if (this.history.length > FishPlayer.maxHistoryLength) {
            this.history.shift();
        }
        this.history.push(entry);
    };
    FishPlayer.addPlayerHistory = function (id, entry) {
        var _a;
        (_a = this.getById(id)) === null || _a === void 0 ? void 0 : _a.addHistoryEntry(entry);
    };
    FishPlayer.prototype.marked = function () {
        return this.unmarkTime > Date.now();
    };
    FishPlayer.prototype.afk = function () {
        return Date.now() - this.lastActive > 60000 || this.manualAfk;
    };
    FishPlayer.prototype.stelled = function () {
        return this.marked() || this.autoflagged;
    };
    /** Sets the unmark time but doesn't stop the player's unit or send them a message. */
    FishPlayer.prototype.updateStopTime = function (time) {
        var _this = this;
        this.unmarkTime = Date.now() + time;
        if (this.unmarkTime > globals.maxTime)
            this.unmarkTime = globals.maxTime;
        api.addStopped(this.uuid, this.unmarkTime);
        FishPlayer.saveAll();
        //Set unmark timer
        var oldUnmarkTime = this.unmarkTime;
        Timer.schedule(function () {
            //Use of this is safe because arrow functions do not create a new this context
            if (_this.unmarkTime === oldUnmarkTime && _this.connected()) {
                //Only run the code if the unmark time hasn't changed
                _this.forceRespawn();
                _this.updateName();
                _this.sendMessage("[yellow]Your mark has automatically expired.");
            }
        }, time / 1000);
    };
    FishPlayer.prototype.stop = function (by, duration, message, notify) {
        if (notify === void 0) { notify = true; }
        this.updateStopTime(duration);
        this.addHistoryEntry({
            action: 'stopped',
            by: by instanceof FishPlayer ? by.name : by,
            time: Date.now(),
        });
        if (duration > 60000)
            this.setPunishedIP(config_1.stopAntiEvadeTime);
        this.showRankPrefix = true;
        this.updateName();
        if (this.connected() && notify) {
            this.stopUnit();
            this.sendMessage(message
                ? "[scarlet]Oopsy Whoopsie! You've been stopped, and marked as a griefer for reason: [white]".concat(message, "[]")
                : "[scarlet]Oopsy Whoopsie! You've been stopped, and marked as a griefer.");
            if (duration < 3600000) {
                //less than one hour
                this.sendMessage("[yellow]Your mark will expire in ".concat((0, utils_1.formatTime)(duration), "."));
            }
        }
    };
    FishPlayer.prototype.free = function (by) {
        by !== null && by !== void 0 ? by : (by = "console");
        this.autoflagged = false; //Might as well set autoflagged to false
        this.unmarkTime = -1;
        api.free(this.uuid);
        FishPlayer.removePunishedIP(this.ip());
        FishPlayer.removePunishedUUID(this.uuid);
        FishPlayer.saveAll();
        if (this.connected()) {
            this.addHistoryEntry({
                action: 'freed',
                by: by instanceof FishPlayer ? by.name : by,
                time: Date.now(),
            });
            this.sendMessage('[yellow]Looks like someone had mercy on you.');
            this.updateName();
            this.forceRespawn();
        }
    };
    FishPlayer.prototype.kick = function (reason, duration) {
        var _a;
        if (reason === void 0) { reason = Packets.KickReason.kick; }
        if (duration === void 0) { duration = 30000; }
        (_a = this.player) === null || _a === void 0 ? void 0 : _a.kick(reason, duration);
    };
    FishPlayer.prototype.setPunishedIP = function (duration) {
        FishPlayer.punishedIPs.push([this.ip(), this.uuid, Date.now() + duration]);
    };
    FishPlayer.removePunishedIP = function (target) {
        var ipIndex;
        if ((ipIndex = FishPlayer.punishedIPs.findIndex(function (_a) {
            var _b = __read(_a, 1), ip = _b[0];
            return ip == target;
        })) != -1) {
            FishPlayer.punishedIPs.splice(ipIndex, 1);
            return true;
        }
        else
            return false;
    };
    FishPlayer.removePunishedUUID = function (target) {
        var uuidIndex;
        if ((uuidIndex = FishPlayer.punishedIPs.findIndex(function (_a) {
            var _b = __read(_a, 2), uuid = _b[1];
            return uuid == target;
        })) != -1) {
            FishPlayer.punishedIPs.splice(uuidIndex, 1);
            return true;
        }
        else
            return false;
    };
    FishPlayer.prototype.trollName = function (name) {
        this.shouldUpdateName = false;
        this.player.name = name;
    };
    FishPlayer.prototype.freeze = function () {
        this.frozen = true;
        this.sendMessage("You have been temporarily frozen.");
    };
    FishPlayer.prototype.unfreeze = function () {
        this.frozen = false;
    };
    FishPlayer.prototype.mute = function (by) {
        if (this.muted)
            return;
        this.muted = true;
        this.showRankPrefix = true;
        this.updateName();
        this.sendMessage("[yellow] Hey! You have been muted. You can still use /msg to send a message to someone.");
        this.setPunishedIP(config_1.stopAntiEvadeTime);
        this.addHistoryEntry({
            action: 'muted',
            by: by instanceof FishPlayer ? by.name : by,
            time: Date.now(),
        });
        FishPlayer.saveAll();
    };
    FishPlayer.prototype.unmute = function (by) {
        if (!this.muted)
            return;
        this.muted = false;
        FishPlayer.removePunishedIP(this.ip());
        FishPlayer.removePunishedUUID(this.uuid);
        this.updateName();
        this.sendMessage("[green]You have been unmuted.");
        this.addHistoryEntry({
            action: 'muted',
            by: by instanceof FishPlayer ? by.name : by,
            time: Date.now(),
        });
        FishPlayer.saveAll();
    };
    FishPlayer.prototype.stopUnit = function () {
        if (this.connected() && this.unit()) {
            if (this.unit().spawnedByCore) {
                this.unit().type = UnitTypes.stell;
                this.unit().health = UnitTypes.stell.health;
                this.unit().apply(StatusEffects.disarmed, Number.MAX_SAFE_INTEGER);
            }
            else {
                this.forceRespawn();
                //This will cause FishPlayer.onRespawn to run, calling this function again, but then the player will be in a core unit, which can be safely stell'd
            }
        }
    };
    FishPlayer.messageStaff = function (arg1, arg2) {
        var message = arg2 ? "[gray]<[cyan]staff[gray]>[white]".concat(arg1, "[green]: [cyan]").concat(arg2) : arg1;
        var messageReceived = false;
        Groups.player.each(function (pl) {
            var fishP = FishPlayer.get(pl);
            if (fishP.hasPerm("mod")) {
                pl.sendMessage(message);
                messageReceived = true;
            }
        });
        return messageReceived;
    };
    FishPlayer.messageTrusted = function (arg1, arg2) {
        var message = arg2 ? "[gray]<[".concat(ranks_1.Rank.trusted.color, "]trusted[gray]>[white]").concat(arg1, "[green]: [cyan]").concat(arg2) : arg1;
        FishPlayer.forEachPlayer(function (fishP) {
            if (fishP.ranksAtLeast("trusted"))
                fishP.sendMessage(message);
        });
    };
    FishPlayer.messageMuted = function (arg1, arg2) {
        var message = arg2 ? "[gray]<[red]muted[gray]>[white]".concat(arg1, "[coral]: [lightgray]").concat(arg2) : arg1;
        var messageReceived = false;
        Groups.player.each(function (pl) {
            var fishP = FishPlayer.get(pl);
            if (fishP.hasPerm("seeMutedMessages")) {
                pl.sendMessage(message);
                messageReceived = true;
            }
        });
        return messageReceived;
    };
    FishPlayer.messageAllExcept = function (exclude, message) {
        FishPlayer.forEachPlayer(function (fishP) {
            if (fishP !== exclude)
                fishP.sendMessage(message);
        });
    };
    FishPlayer.messageAllWithPerm = function (perm, message) {
        if (perm) {
            FishPlayer.forEachPlayer(function (fishP) {
                if (fishP.hasPerm(perm))
                    fishP.sendMessage(message);
            });
        }
        else {
            Call.sendMessage(message);
        }
    };
    //#endregion
    //#region heuristics
    FishPlayer.prototype.activateHeuristics = function () {
        var _this = this;
        if (config_1.Gamemode.hexed() || config_1.Gamemode.sandbox())
            return;
        //Blocks broken check
        if (this.joinsLessThan(5)) {
            var tripped_1 = false;
            FishPlayer.stats.heuristics.total++;
            Timer.schedule(function () {
                if (_this.connected() && !tripped_1) {
                    FishPlayer.stats.heuristics.blocksBroken[_this.uuid] = _this.tstats.blocksBroken;
                    if (_this.tstats.blocksBroken > config_1.heuristics.blocksBrokenAfterJoin) {
                        tripped_1 = true;
                        (0, utils_1.logHTrip)(_this, "blocks broken after join", "".concat(_this.tstats.blocksBroken, "/").concat(config_1.heuristics.blocksBrokenAfterJoin));
                        _this.stop("automod", globals.maxTime, "Automatic stop due to suspicious activity");
                        FishPlayer.messageAllExcept(_this, "[yellow]Player ".concat(_this.cleanedName, " has been stopped automatically due to suspected griefing.\nPlease look at ").concat(_this.position(), " and see if they were actually griefing. If they were not, please inform a staff member."));
                        FishPlayer.stats.heuristics.numTripped++;
                        FishPlayer.stats.heuristics.tripped[_this.uuid] = "waiting";
                        Timer.schedule(function () {
                            if (FishPlayer.stats.heuristics.tripped[_this.uuid] == "waiting")
                                FishPlayer.stats.heuristics.tripped[_this.uuid] = _this.marked();
                            if (_this.marked())
                                FishPlayer.stats.heuristics.trippedCorrect++;
                        }, 1200);
                    }
                }
            }, 0, 1, this.firstJoin() ? 30 : 20);
        }
    };
    FishPlayer.cachedPlayers = {};
    FishPlayer.maxHistoryLength = 5;
    FishPlayer.saveVersion = 9;
    FishPlayer.chunkSize = 50000;
    //Static transients
    FishPlayer.stats = {
        numIpsChecked: 0,
        numIpsFlagged: 0,
        numIpsErrored: 0,
        heuristics: {
            tripped: {},
            numTripped: 0,
            total: 0,
            trippedCorrect: 0,
            blocksBroken: {}
        }
    };
    FishPlayer.lastAuthKicked = null;
    //If a new account joins from one of these IPs, the IP gets banned.
    FishPlayer.punishedIPs = [];
    FishPlayer.flagCount = 0;
    FishPlayer.playersJoinedRecent = 0;
    FishPlayer.antiBotModePersist = false;
    FishPlayer.antiBotModeOverride = false;
    FishPlayer.lastBotWhacked = 0;
    /** Stores the 10 most recent players that left. */
    FishPlayer.recentLeaves = [];
    FishPlayer.ignoreGameOver = false;
    return FishPlayer;
}());
exports.FishPlayer = FishPlayer;
var templateObject_1, templateObject_2, templateObject_3, templateObject_4;
