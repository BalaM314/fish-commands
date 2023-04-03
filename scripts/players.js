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
var FishPlayer = /** @class */ (function () {
    function FishPlayer(_a, player) {
        var name = _a.name, _b = _a.muted, muted = _b === void 0 ? false : _b, _c = _a.member, member = _c === void 0 ? false : _c, _d = _a.stopped, stopped = _d === void 0 ? false : _d, _e = _a.highlight, highlight = _e === void 0 ? null : _e, _f = _a.history, history = _f === void 0 ? [] : _f, _g = _a.rainbow, rainbow = _g === void 0 ? null : _g, _h = _a.rank, rank = _h === void 0 ? "player" : _h, usid = _a.usid;
        var _j, _k, _l;
        //Transients
        this.player = null;
        this.pet = "";
        this.watch = false;
        this.activeMenu = { cancelOptionId: -1 };
        this.afk = false;
        this.tileId = false;
        this.tilelog = false;
        this.trail = null;
        this.name = (_j = name !== null && name !== void 0 ? name : player === null || player === void 0 ? void 0 : player.name) !== null && _j !== void 0 ? _j : "Unnamed player [ERROR]";
        this.muted = muted;
        this.member = member;
        this.stopped = stopped;
        this.highlight = highlight;
        this.history = history;
        this.player = player;
        this.rainbow = rainbow;
        this.cleanedName = Strings.stripColors(this.name);
        this.rank = (_k = ranks_1.Rank.getByName(rank)) !== null && _k !== void 0 ? _k : ranks_1.Rank.player;
        this.usid = (_l = usid !== null && usid !== void 0 ? usid : player === null || player === void 0 ? void 0 : player.usid()) !== null && _l !== void 0 ? _l : null;
    }
    //#region getplayer
    //Contains methods used to get FishPlayer instances.
    FishPlayer.createFromPlayer = function (player) {
        return new this({
            name: player.name
        }, player);
    };
    FishPlayer.createFromInfo = function (playerInfo) {
        var _a;
        return new this({
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
        var e_1, _a;
        try {
            for (var _b = __values(Object.entries(this.cachedPlayers)), _c = _b.next(); !_c.done; _c = _b.next()) {
                var _d = __read(_c.value, 2), uuid = _d[0], player = _d[1];
                if (player.connected())
                    func(player);
            }
        }
        catch (e_1_1) { e_1 = { error: e_1_1 }; }
        finally {
            try {
                if (_c && !_c.done && (_a = _b.return)) _a.call(_b);
            }
            finally { if (e_1) throw e_1.error; }
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
        this.player.name = prefix + this.name;
    };
    FishPlayer.prototype.updateAdminStatus = function () {
        Log.info("Updating admin status of player ".concat(this.name));
        Log.info("Rank: ".concat(this.rank.name, ", is admin: ").concat(this.ranksAtLeast(ranks_1.Rank.admin)));
        if (this.ranksAtLeast(ranks_1.Rank.admin)) {
            Vars.netServer.admins.adminPlayer(this.uuid(), this.player.usid());
            this.player.admin = true;
        }
        else {
            Vars.netServer.admins.unAdminPlayer(this.uuid());
            this.player.admin = false;
        }
    };
    FishPlayer.prototype.validate = function () {
        return this.checkName() && this.checkUsid();
    };
    /**Checks if this player's name is allowed. */
    FishPlayer.prototype.checkName = function () {
        var e_2, _a;
        try {
            for (var _b = __values(config.bannedNames), _c = _b.next(); !_c.done; _c = _b.next()) {
                var bannedName = _c.value;
                if (this.name.toLowerCase().includes(bannedName)) {
                    this.player.kick("[scarlet]\"".concat(this.name, "[scarlet]\" is not an allowed name.\n\nIf you are unable to change it, please download Mindustry from Steam or itch.io."));
                    return false;
                }
            }
        }
        catch (e_2_1) { e_2 = { error: e_2_1 }; }
        finally {
            try {
                if (_c && !_c.done && (_a = _b.return)) _a.call(_b);
            }
            finally { if (e_2) throw e_2.error; }
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
    //#endregion
    //#region I/O
    FishPlayer.read = function (fishPlayerData, player) {
        return new this(JSON.parse(fishPlayerData), player);
    };
    FishPlayer.prototype.write = function () {
        return JSON.stringify({
            name: this.name,
            muted: this.muted,
            member: this.member,
            stopped: this.stopped,
            highlight: this.highlight,
            history: this.history,
            rainbow: this.rainbow,
            rank: this.rank.name,
            usid: this.usid,
        });
    };
    /**Saves cached FishPlayers to JSON in Core.settings. */
    FishPlayer.saveAll = function () {
        var e_3, _a;
        //Temporary implementation
        var playerDatas = [];
        try {
            for (var _b = __values(Object.entries(this.cachedPlayers)), _c = _b.next(); !_c.done; _c = _b.next()) {
                var _d = __read(_c.value, 2), uuid = _d[0], player = _d[1];
                if ((player.rank != ranks_1.Rank.player) || player.member)
                    playerDatas.push("\"".concat(uuid, "\":").concat(player.write()));
            }
        }
        catch (e_3_1) { e_3 = { error: e_3_1 }; }
        finally {
            try {
                if (_c && !_c.done && (_a = _b.return)) _a.call(_b);
            }
            finally { if (e_3) throw e_3.error; }
        }
        Core.settings.put('fish', '{' + playerDatas.join(",") + '}');
        Core.settings.manualSave();
    };
    /**Loads cached FishPlayers from JSON in Core.settings. */
    FishPlayer.loadAll = function () {
        var e_4, _a;
        //Temporary implementation
        var jsonString = Core.settings.get('fish', '');
        if (jsonString == "")
            return;
        try {
            for (var _b = __values(Object.entries(JSON.parse(jsonString))), _c = _b.next(); !_c.done; _c = _b.next()) {
                var _d = __read(_c.value, 2), key = _d[0], value = _d[1];
                if (value instanceof Object) {
                    var rank = "player";
                    if ("mod" in value)
                        rank = "mod";
                    if ("admin" in value)
                        rank = "admin";
                    this.cachedPlayers[key] = new this(__assign({ rank: rank }, value), null);
                }
            }
        }
        catch (e_4_1) { e_4 = { error: e_4_1 }; }
        finally {
            try {
                if (_c && !_c.done && (_a = _b.return)) _a.call(_b);
            }
            finally { if (e_4) throw e_4.error; }
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
    FishPlayer.prototype.uuid = function () {
        return this.player.uuid();
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
            api.addStopped(this.uuid());
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
            api.free(this.uuid());
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
    return FishPlayer;
}());
exports.FishPlayer = FishPlayer;
