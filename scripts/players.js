"use strict";
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
var config = require("./config");
var api = require("./api");
var utils_1 = require("./utils");
var ranks_1 = require("./ranks");
var FishPlayer = exports.FishPlayer = /** @class */ (function () {
    function FishPlayer(_a, player) {
        var uuid = _a.uuid, name = _a.name, _b = _a.muted, muted = _b === void 0 ? false : _b, _c = _a.member, member = _c === void 0 ? false : _c, _d = _a.stopped, stopped = _d === void 0 ? false : _d, _e = _a.highlight, highlight = _e === void 0 ? null : _e, _f = _a.history, history = _f === void 0 ? [] : _f, _g = _a.rainbow, rainbow = _g === void 0 ? null : _g, _h = _a.rank, rank = _h === void 0 ? "player" : _h, usid = _a.usid;
        var _j, _k, _l, _m;
        //Transients
        this.player = null;
        this.pet = "";
        this.watch = false;
        this.activeMenu = { cancelOptionId: -1 };
        this.afk = false;
        this.tileId = false;
        this.tilelog = false;
        this.trail = null;
        this.uuid = (_j = uuid !== null && uuid !== void 0 ? uuid : player === null || player === void 0 ? void 0 : player.uuid()) !== null && _j !== void 0 ? _j : (function () { throw new Error("Attempted to create FishPlayer with no UUID"); })();
        this.name = (_k = name !== null && name !== void 0 ? name : player === null || player === void 0 ? void 0 : player.name) !== null && _k !== void 0 ? _k : "Unnamed player [ERROR]";
        this.muted = muted;
        this.member = member;
        this.stopped = stopped;
        this.highlight = highlight;
        this.history = history;
        this.player = player;
        this.rainbow = rainbow;
        this.cleanedName = Strings.stripColors(this.name);
        this.rank = (_l = ranks_1.Rank.getByName(rank)) !== null && _l !== void 0 ? _l : ranks_1.Rank.new;
        this.usid = (_m = usid !== null && usid !== void 0 ? usid : player === null || player === void 0 ? void 0 : player.usid()) !== null && _m !== void 0 ? _m : null;
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
    FishPlayer.getById = function (id) {
        var _a;
        return (_a = this.cachedPlayers[id]) !== null && _a !== void 0 ? _a : null;
    };
    /**Returns the FishPlayer representing the first online player matching a given name. */
    FishPlayer.getByName = function (name) {
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
    /**Returns the FishPlayers representing all online players matching a given name. */
    FishPlayer.getAllByName = function (name, strict) {
        if (strict === void 0) { strict = true; }
        var players = [];
        //Groups.player doesn't support filter
        Groups.player.each(function (p) {
            var fishP = FishPlayer.get(p);
            if (fishP.cleanedName.includes(name))
                players.push(fishP);
            else if (!strict && fishP.cleanedName.toLowerCase().includes(name))
                players.push(fishP);
        });
        return players;
    };
    FishPlayer.getOneByString = function (str) {
        var e_1, _a;
        var players = this.getAllOnline();
        var matchingPlayers;
        var filters = [
            function (p) { return p.uuid === str; },
            function (p) { return p.player.id.toString() === str; },
            function (p) { return p.name === str; },
            function (p) { return p.cleanedName === str; },
            function (p) { return p.cleanedName.toLowerCase() === str.toLowerCase(); },
            function (p) { return p.name.includes(str); },
            function (p) { return p.cleanedName.includes(str); },
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
    //This method exists only because there is no easy way to turn an entitygroup into an array
    FishPlayer.getAllOnline = function () {
        var players = [];
        Groups.player.each(function (p) { return players.push(FishPlayer.get(p)); });
        return players;
    };
    //#endregion
    //#region eventhandling
    //Contains methods that handle an event and must be called by other code (usually through Events.on).
    /**Must be run on PlayerJoinEvent. */
    FishPlayer.onPlayerJoin = function (player) {
        var _a;
        var _b, _c;
        var fishPlayer = (_a = (_b = this.cachedPlayers)[_c = player.uuid()]) !== null && _a !== void 0 ? _a : (_b[_c] = this.createFromPlayer(player));
        fishPlayer.updateSavedInfoFromPlayer(player);
        if (fishPlayer.validate()) {
            fishPlayer.updateName();
            fishPlayer.updateAdminStatus();
            api.getStopped(player.uuid(), function (stopped) {
                if (fishPlayer.stopped && !stopped)
                    fishPlayer.free("api");
                if (stopped)
                    fishPlayer.stop("api");
            });
        }
    };
    /**Must be run on UnitChangeEvent. */
    FishPlayer.onUnitChange = function (player, unit) {
        //if(unit.spawnedByCore)
        /**
         * unit.spawnedByCore is not set correctly in UnitChangeEvent.
         * This is because the function that fires it(unit.controller(player);)
         * does not seem to run any code, but it actually runs player.unit(unit)
         * which fires the event.
         * This bug should be fixed after v142.
         */
        if ((0, utils_1.isCoreUnitType)(unit.type))
            this.onRespawn(player);
    };
    FishPlayer.onRespawn = function (player) {
        var fishP = this.get(player);
        if (fishP === null || fishP === void 0 ? void 0 : fishP.stopped)
            fishP.stopUnit();
    };
    FishPlayer.forEachPlayer = function (func) {
        var e_2, _a;
        try {
            for (var _b = __values(Object.entries(this.cachedPlayers)), _c = _b.next(); !_c.done; _c = _b.next()) {
                var _d = __read(_c.value, 2), uuid = _d[0], player = _d[1];
                if (player.connected())
                    func(player);
            }
        }
        catch (e_2_1) { e_2 = { error: e_2_1 }; }
        finally {
            try {
                if (_c && !_c.done && (_a = _b.return)) _a.call(_b);
            }
            finally { if (e_2) throw e_2.error; }
        }
    };
    /**Must be called at player join, before updateName(). */
    FishPlayer.prototype.updateSavedInfoFromPlayer = function (player) {
        var _a;
        this.player = player;
        this.name = player.name;
        (_a = this.usid) !== null && _a !== void 0 ? _a : (this.usid = player.usid());
        this.cleanedName = Strings.stripColors(player.name);
    };
    /**Updates the mindustry player's name, using the prefixes of the current rank and  */
    FishPlayer.prototype.updateName = function () {
        if (!this.connected())
            return; //No player, no need to update
        var prefix = '';
        if (this.stopped)
            prefix += config.STOPPED_PREFIX;
        if (this.muted)
            prefix += config.MUTED_PREFIX;
        if (this.afk)
            prefix += config.AFK_PREFIX;
        if (this.member)
            prefix += config.MEMBER_PREFIX;
        prefix += this.rank.prefix;
        if (prefix != "")
            this.player.name = prefix + " " + this.name;
    };
    FishPlayer.prototype.updateAdminStatus = function () {
        if (this.ranksAtLeast(ranks_1.Rank.admin)) {
            Vars.netServer.admins.adminPlayer(this.uuid, this.player.usid());
            this.player.admin = true;
        }
        else {
            Vars.netServer.admins.unAdminPlayer(this.uuid);
            this.player.admin = false;
        }
    };
    FishPlayer.prototype.validate = function () {
        return this.checkName() && this.checkUsid();
    };
    /**Checks if this player's name is allowed. */
    FishPlayer.prototype.checkName = function () {
        var e_3, _a;
        try {
            for (var _b = __values(config.bannedNames), _c = _b.next(); !_c.done; _c = _b.next()) {
                var bannedName = _c.value;
                if (this.name.toLowerCase().includes(bannedName.toLowerCase())) {
                    this.player.kick("[scarlet]\"".concat(this.name, "[scarlet]\" is not an allowed name.\n\nIf you are unable to change it, please download Mindustry from Steam or itch.io."));
                    return false;
                }
            }
        }
        catch (e_3_1) { e_3 = { error: e_3_1 }; }
        finally {
            try {
                if (_c && !_c.done && (_a = _b.return)) _a.call(_b);
            }
            finally { if (e_3) throw e_3.error; }
        }
        return true;
    };
    /**Checks if this player's USID is correct. */
    FishPlayer.prototype.checkUsid = function () {
        if (this.usid != null && this.player.usid() != this.usid) {
            Log.err("&rUSID mismatch for player &c\"".concat(this.cleanedName, "\"&r: stored usid is &c").concat(this.usid, "&r, but they tried to connect with usid &c").concat(this.player.usid(), "&r"));
            if (this.ranksAtLeast(ranks_1.Rank.trusted)) {
                this.player.kick("Authorization failure!");
            }
            return false;
        }
        return true;
    };
    FishPlayer.prototype.displayTrail = function () {
        if (this.trail)
            Call.effect(Fx[this.trail.type], this.player.x, this.player.y, 0, this.trail.color);
    };
    //#endregion
    //#region I/O
    FishPlayer.readLegacy = function (fishPlayerData, player) {
        return new this(JSON.parse(fishPlayerData), player);
    };
    FishPlayer.read = function (version, fishPlayerData, player) {
        var _a, _b, _c, _d, _e, _f;
        switch (version) {
            case 0:
                return new this({
                    uuid: (_a = fishPlayerData.readString(2)) !== null && _a !== void 0 ? _a : (function () { throw new Error("Failed to deserialize FishPlayer: UUID was null."); })(),
                    name: (_b = fishPlayerData.readString(2)) !== null && _b !== void 0 ? _b : "Unnamed player [ERROR]",
                    muted: fishPlayerData.readBool(),
                    member: fishPlayerData.readBool(),
                    stopped: fishPlayerData.readBool(),
                    highlight: fishPlayerData.readString(3),
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
                    usid: fishPlayerData.readString(3)
                }, player);
            case 1:
                return new this({
                    uuid: (_d = fishPlayerData.readString(2)) !== null && _d !== void 0 ? _d : (function () { throw new Error("Failed to deserialize FishPlayer: UUID was null."); })(),
                    name: (_e = fishPlayerData.readString(2)) !== null && _e !== void 0 ? _e : "Unnamed player [ERROR]",
                    muted: fishPlayerData.readBool(),
                    member: fishPlayerData.readBool(),
                    stopped: fishPlayerData.readBool(),
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
                    usid: fishPlayerData.readString(2)
                }, player);
            default: throw new Error("Unknown save version ".concat(version));
        }
    };
    FishPlayer.prototype.write = function (out) {
        var _a, _b;
        out.writeString(this.uuid, 2);
        out.writeString(this.name, 2);
        out.writeBool(this.muted);
        out.writeBool(this.member);
        out.writeBool(this.stopped);
        out.writeString(this.highlight, 2);
        out.writeArray(this.history, function (i, str) {
            str.writeString(i.action, 2);
            str.writeString(i.by, 2);
            str.writeNumber(i.time, 15);
        });
        out.writeNumber((_b = (_a = this.rainbow) === null || _a === void 0 ? void 0 : _a.speed) !== null && _b !== void 0 ? _b : 0, 2);
        out.writeString(this.rank.name, 2);
        out.writeString(this.usid, 2);
    };
    FishPlayer.prototype.writeLegacy = function () {
        var obj = {};
        obj.name = this.name;
        if (this.muted != false)
            obj.muted = this.muted;
        if (this.member != false)
            obj.member = this.member;
        if (this.stopped != false)
            obj.stopped = this.stopped;
        if (this.highlight != null)
            obj.highlight = this.highlight;
        obj.history = this.history;
        if (this.rainbow != null)
            obj.rainbow = this.rainbow;
        if (this.rank != ranks_1.Rank.new)
            obj.rank = this.rank.name;
        obj.usid = this.usid;
        return JSON.stringify(obj);
    };
    /**Saves cached FishPlayers to JSON in Core.settings. */
    FishPlayer.saveAll = function () {
        // this.saveAllLegacy();
        var out = new utils_1.StringIO();
        out.writeNumber(this.saveVersion, 2);
        out.writeArray(Object.entries(this.cachedPlayers)
            .filter(function (_a) {
            var _b = __read(_a, 2), uuid = _b[0], fishP = _b[1];
            return fishP.shouldCache();
        }), function (_a) {
            var _b = __read(_a, 2), uuid = _b[0], player = _b[1];
            return player.write(out);
        });
        Core.settings.put('fish', out.string);
        Core.settings.manualSave();
    };
    FishPlayer.prototype.shouldCache = function () {
        return (this.rank != ranks_1.Rank.new && this.rank != ranks_1.Rank.player) || this.muted || this.member;
    };
    FishPlayer.saveAllLegacy = function () {
        var e_4, _a;
        var playerDatas = [];
        try {
            for (var _b = __values(Object.entries(this.cachedPlayers)), _c = _b.next(); !_c.done; _c = _b.next()) {
                var _d = __read(_c.value, 2), uuid = _d[0], player = _d[1];
                if (player.shouldCache())
                    playerDatas.push("\"".concat(uuid, "\":").concat(player.writeLegacy()));
            }
        }
        catch (e_4_1) { e_4 = { error: e_4_1 }; }
        finally {
            try {
                if (_c && !_c.done && (_a = _b.return)) _a.call(_b);
            }
            finally { if (e_4) throw e_4.error; }
        }
        Core.settings.put('fish', '{' + playerDatas.join(",") + '}');
        Core.settings.manualSave();
    };
    /**Loads cached FishPlayers from JSON in Core.settings. */
    FishPlayer.loadAll = function () {
        var _this = this;
        var string = Core.settings.get('fish', '');
        if (string == "")
            return; //If it's empty, don't try to load anything
        if (string.startsWith("{"))
            return this.loadAllLegacy(string);
        var out = new utils_1.StringIO(string);
        var version = out.readNumber(2);
        out.readArray(function (str) { return FishPlayer.read(version, str, null); })
            .forEach(function (p) { return _this.cachedPlayers[p.uuid] = p; });
        out.expectEOF();
    };
    FishPlayer.loadAllLegacy = function (jsonString) {
        var e_5, _a;
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
        catch (e_5_1) { e_5 = { error: e_5_1 }; }
        finally {
            try {
                if (_c && !_c.done && (_a = _b.return)) _a.call(_b);
            }
            finally { if (e_5) throw e_5.error; }
        }
    };
    //#endregion
    //#region util
    FishPlayer.prototype.connected = function () {
        return this.player && !this.con.hasDisconnected;
    };
    /**
     * @returns whether a player can perform a moderation action on another player.
     * @param strict If false, then the action is also allowed on players of same rank.
     */
    FishPlayer.prototype.canModerate = function (player, strict) {
        if (strict === void 0) { strict = true; }
        if (strict)
            return this.rank.level > player.rank.level || player == this;
        else
            return this.rank.level >= player.rank.level || player == this;
    };
    FishPlayer.prototype.ranksAtLeast = function (rank) {
        return this.rank.level >= rank.level;
    };
    FishPlayer.prototype.unit = function () {
        return this.player.unit();
    };
    FishPlayer.prototype.team = function () {
        return this.player.team();
    };
    Object.defineProperty(FishPlayer.prototype, "con", {
        get: function () {
            return this.player.con;
        },
        enumerable: false,
        configurable: true
    });
    FishPlayer.prototype.sendMessage = function (message) {
        var _a;
        return (_a = this.player) === null || _a === void 0 ? void 0 : _a.sendMessage(message);
    };
    FishPlayer.prototype.setRank = function (rank) {
        this.rank = rank;
        this.updateName();
        this.updateAdminStatus();
        FishPlayer.saveAll();
    };
    FishPlayer.prototype.forceRespawn = function () {
        this.player.clearUnit();
        this.player.checkSpawn();
    };
    //#endregion
    //#region moderation
    /**Records a moderation action taken on a player. */
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
    FishPlayer.prototype.stop = function (by) {
        this.stopped = true;
        this.stopUnit();
        this.updateName();
        this.sendMessage("[scarlet]Oopsy Whoopsie! You've been stopped, and marked as a griefer.");
        if (by instanceof FishPlayer) {
            this.addHistoryEntry({
                action: 'stopped',
                by: by.name,
                time: Date.now(),
            });
            api.addStopped(this.uuid);
        }
        FishPlayer.saveAll();
    };
    FishPlayer.prototype.free = function (by) {
        if (!this.stopped)
            return;
        this.stopped = false;
        this.updateName();
        this.forceRespawn();
        if (by instanceof FishPlayer) {
            this.sendMessage('[yellow]Looks like someone had mercy on you.');
            this.addHistoryEntry({
                action: 'freed',
                by: by.name,
                time: Date.now(),
            });
            api.free(this.uuid);
        }
        FishPlayer.saveAll();
    };
    FishPlayer.prototype.mute = function (by) {
        if (this.muted)
            return;
        this.muted = true;
        this.updateName();
        this.sendMessage("[yellow] Hey! You have been muted. You can still use /msg to send a message to someone.");
        if (by instanceof FishPlayer) {
            this.addHistoryEntry({
                action: 'muted',
                by: by.name,
                time: Date.now(),
            });
        }
        FishPlayer.saveAll();
    };
    FishPlayer.prototype.unmute = function (by) {
        if (!this.muted)
            return;
        this.muted = false;
        this.updateName();
        this.sendMessage("[green]You have been unmuted.");
        if (by instanceof FishPlayer) {
            this.addHistoryEntry({
                action: 'unmuted',
                by: by.name,
                time: Date.now(),
            });
        }
        FishPlayer.saveAll();
    };
    FishPlayer.prototype.stopUnit = function () {
        if (this.connected() && this.unit()) {
            if ((0, utils_1.isCoreUnitType)(this.unit().type)) {
                this.unit().type = UnitTypes.stell;
                this.unit().apply(StatusEffects.disarmed, Number.MAX_SAFE_INTEGER);
            }
            else {
                this.forceRespawn();
                //This will cause FishPlayer.onRespawn to run, calling this function again, but then the player will be in a core unit, which can be safely stell'd
            }
        }
    };
    FishPlayer.cachedPlayers = {};
    FishPlayer.maxHistoryLength = 5;
    FishPlayer.saveVersion = 1;
    return FishPlayer;
}());
