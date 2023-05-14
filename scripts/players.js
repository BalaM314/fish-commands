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
var menus_1 = require("./menus");
var commands_1 = require("./commands");
var FishPlayer = exports.FishPlayer = /** @class */ (function () {
    function FishPlayer(_a, player) {
        var uuid = _a.uuid, name = _a.name, _b = _a.muted, muted = _b === void 0 ? false : _b, _c = _a.member, member = _c === void 0 ? false : _c, _d = _a.stopped, stopped = _d === void 0 ? false : _d, _e = _a.highlight, highlight = _e === void 0 ? null : _e, _f = _a.history, history = _f === void 0 ? [] : _f, _g = _a.rainbow, rainbow = _g === void 0 ? null : _g, _h = _a.rank, rank = _h === void 0 ? "player" : _h, _j = _a.flags, flags = _j === void 0 ? [] : _j, usid = _a.usid;
        var _k, _l, _m, _o;
        //Transients
        this.player = null;
        this.pet = "";
        this.watch = false;
        this.activeMenu = { cancelOptionId: -1 };
        this.tileId = false;
        this.tilelog = null;
        this.trail = null;
        this.uuid = (_k = uuid !== null && uuid !== void 0 ? uuid : player === null || player === void 0 ? void 0 : player.uuid()) !== null && _k !== void 0 ? _k : (function () { throw new Error("Attempted to create FishPlayer with no UUID"); })();
        this.name = (_l = name !== null && name !== void 0 ? name : player === null || player === void 0 ? void 0 : player.name) !== null && _l !== void 0 ? _l : "Unnamed player [ERROR]";
        this.muted = muted;
        this.stopped = stopped;
        this.highlight = highlight;
        this.history = history;
        this.player = player;
        this.rainbow = rainbow;
        this.cleanedName = Strings.stripColors(this.name);
        this.rank = (_m = ranks_1.Rank.getByName(rank)) !== null && _m !== void 0 ? _m : ranks_1.Rank.new;
        this.flags = new Set(flags.map(ranks_1.RoleFlag.getByName).filter(function (f) { return f != null; }));
        if (member)
            this.flags.add(ranks_1.RoleFlag.member);
        if (rank == "developer") {
            this.rank = ranks_1.Rank.admin;
            this.flags.add(ranks_1.RoleFlag.developer);
        }
        this.usid = (_o = usid !== null && usid !== void 0 ? usid : player === null || player === void 0 ? void 0 : player.usid()) !== null && _o !== void 0 ? _o : null;
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
    /**Returns the FishPlayers representing all online players matching a given name. */
    FishPlayer.getAllByName = function (name, strict) {
        if (strict === void 0) { strict = true; }
        var players = [];
        if (name == "")
            return [];
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
        if (str == "")
            return "none";
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
    FishPlayer.getOneMindustryPlayerByName = function (str) {
        var e_2, _a;
        if (str == "")
            return "none";
        var players = (0, utils_1.setToArray)(Groups.player);
        var matchingPlayers;
        var filters = [
            function (p) { return p.name === str; },
            function (p) { return Strings.stripColors(p.name) === str; },
            function (p) { return Strings.stripColors(p.name).toLowerCase() === str.toLowerCase(); },
            function (p) { return p.name.includes(str); },
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
    //#endregion
    //#region eventhandling
    //Contains methods that handle an event and must be called by other code (usually through Events.on).
    /**Must be run on PlayerJoinEvent. */
    FishPlayer.onPlayerJoin = function (player) {
        var _this = this;
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
        var ip = player.ip();
        var info = player.getInfo();
        if (!(ip in this.checkedIps)) {
            api.isVpn(ip, function (isVpn) {
                _this.stats.numIpsChecked++;
                if (isVpn) {
                    _this.stats.numIpsFlagged++;
                    Log.warn("IP ".concat(ip, " was flagged as VPN. Flag rate: ").concat(_this.stats.numIpsFlagged, "/").concat(_this.stats.numIpsChecked, " (").concat(_this.stats.numIpsFlagged / _this.stats.numIpsChecked, ")"));
                    _this.checkedIps[ip] = {
                        ip: ip,
                        uuid: player.uuid(),
                        name: player.name,
                        moderated: false,
                    };
                    if (info.timesJoined <= 1) {
                        fishPlayer.stop("vpn");
                        fishPlayer.mute("vpn");
                        (0, utils_1.logAction)("autoflagged", "AntiVPN", fishPlayer);
                        _this.messageStaff("[yellow]WARNING:[scarlet] player [cyan]\"".concat(player.name, "[cyan]\"[yellow] is new (").concat(info.timesJoined - 1, " joins) and using a vpn. They have been automatically stopped and muted."));
                        Log.warn("Player ".concat(player.name, " (").concat(player.uuid(), ") was muted."));
                        (0, menus_1.menu)("Welcome to Fish Network!", "Hi there! You have been automatically stopped and muted because we've found something to be a bit sus. You can still talk to staff and request to be freed. Join our Discord to request a staff member come online if none are on.", ["Close", "Discord"], fishPlayer, function (_a) {
                            var option = _a.option, sender = _a.sender;
                            if (option == "Discord") {
                                Call.openURI(sender.con, 'https://discord.gg/VpzcYSQ33Y');
                            }
                        }, false, function (o) { return o; });
                    }
                    else if (info.timesJoined < 5) {
                        _this.messageStaff("[yellow]WARNING:[scarlet] player [cyan]\"".concat(player.name, "[cyan]\"[yellow] is new (").concat(info.timesJoined - 1, " joins) and using a vpn."));
                    }
                }
                else {
                    _this.checkedIps[ip] = false;
                }
            }, function (err) {
                Log.err("Error while checking for VPN status of ip ".concat(ip, "!"));
                Log.err(err);
                _this.stats.numIpsErrored++;
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
        var e_3, _a;
        try {
            for (var _b = __values(Object.entries(this.cachedPlayers)), _c = _b.next(); !_c.done; _c = _b.next()) {
                var _d = __read(_c.value, 2), uuid = _d[0], player = _d[1];
                if (player.connected())
                    func(player);
            }
        }
        catch (e_3_1) { e_3 = { error: e_3_1 }; }
        finally {
            try {
                if (_c && !_c.done && (_a = _b.return)) _a.call(_b);
            }
            finally { if (e_3) throw e_3.error; }
        }
    };
    /**Must be called at player join, before updateName(). */
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
        this.cleanedName = Strings.stripColors(player.name);
    };
    /**Updates the mindustry player's name, using the prefixes of the current rank and (TODO) role flags. */
    FishPlayer.prototype.updateName = function () {
        var e_4, _a;
        if (!this.connected())
            return; //No player, no need to update
        var prefix = '';
        if (this.stopped)
            prefix += config.STOPPED_PREFIX;
        if (this.muted)
            prefix += config.MUTED_PREFIX;
        try {
            for (var _b = __values(this.flags), _c = _b.next(); !_c.done; _c = _b.next()) {
                var flag = _c.value;
                prefix += flag.prefix;
            }
        }
        catch (e_4_1) { e_4 = { error: e_4_1 }; }
        finally {
            try {
                if (_c && !_c.done && (_a = _b.return)) _a.call(_b);
            }
            finally { if (e_4) throw e_4.error; }
        }
        prefix += this.rank.prefix;
        if (prefix != "")
            this.player.name = prefix + " " + this.name;
        else
            this.player.name = this.name;
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
    FishPlayer.prototype.validate = function () {
        return this.checkName() && this.checkUsid();
    };
    /**Checks if this player's name is allowed. */
    FishPlayer.prototype.checkName = function () {
        var e_5, _a;
        try {
            for (var _b = __values(config.bannedNames), _c = _b.next(); !_c.done; _c = _b.next()) {
                var bannedName = _c.value;
                if (this.name.toLowerCase().includes(bannedName.toLowerCase())) {
                    this.player.kick("[scarlet]\"".concat(this.name, "[scarlet]\" is not an allowed name.\n\nIf you are unable to change it, please download Mindustry from Steam or itch.io."));
                    return false;
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
        return true;
    };
    /**Checks if this player's USID is correct. */
    FishPlayer.prototype.checkUsid = function () {
        if (this.usid != null && this.usid != "" && this.player.usid() != this.usid) {
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
        var _a, _b, _c, _d, _e, _f, _g, _h, _j;
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
            case 2:
                return new this({
                    uuid: (_g = fishPlayerData.readString(2)) !== null && _g !== void 0 ? _g : (function () { throw new Error("Failed to deserialize FishPlayer: UUID was null."); })(),
                    name: (_h = fishPlayerData.readString(2)) !== null && _h !== void 0 ? _h : "Unnamed player [ERROR]",
                    muted: fishPlayerData.readBool(),
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
                    rank: (_j = fishPlayerData.readString(2)) !== null && _j !== void 0 ? _j : "",
                    flags: fishPlayerData.readArray(function (str) { return str.readString(2); }, 2).filter(function (s) { return s != null; }),
                    usid: fishPlayerData.readString(2)
                }, player);
            default: throw new Error("Unknown save version ".concat(version));
        }
    };
    FishPlayer.prototype.write = function (out) {
        var _a, _b;
        out.writeString(this.uuid, 2);
        out.writeString(this.name, 2, true);
        out.writeBool(this.muted);
        out.writeBool(this.stopped);
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
    };
    /**Saves cached FishPlayers to JSON in Core.settings. */
    FishPlayer.saveAll = function () {
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
        return (this.rank != ranks_1.Rank.new && this.rank != ranks_1.Rank.player) || this.muted || (this.flags.size > 0);
    };
    /**Loads cached FishPlayers from JSON in Core.settings. */
    FishPlayer.loadAll = function (string) {
        var _this = this;
        if (string === void 0) { string = Core.settings.get('fish', ''); }
        try {
            if (string == "")
                return; //If it's empty, don't try to load anything
            if (string.startsWith("{"))
                return this.loadAllLegacy(string);
            var out = new utils_1.StringIO(string);
            var version_1 = out.readNumber(2);
            out.readArray(function (str) { return FishPlayer.read(version_1, str, null); })
                .forEach(function (p) { return _this.cachedPlayers[p.uuid] = p; });
            out.expectEOF();
        }
        catch (err) {
            Log.err("[CRITICAL] FAILED TO LOAD CACHED FISH PLAYER DATA");
            Log.err(err);
            Log.err("=============================");
            Log.err(string);
            Log.err("=============================");
        }
    };
    FishPlayer.loadAllLegacy = function (jsonString) {
        var e_6, _a;
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
        catch (e_6_1) { e_6 = { error: e_6_1 }; }
        finally {
            try {
                if (_c && !_c.done && (_a = _b.return)) _a.call(_b);
            }
            finally { if (e_6) throw e_6.error; }
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
    FishPlayer.prototype.hasPerm = function (perm) {
        return commands_1.Perm[perm].check(this);
    };
    FishPlayer.prototype.unit = function () {
        return this.player.unit();
    };
    FishPlayer.prototype.team = function () {
        return this.player.team();
    };
    Object.defineProperty(FishPlayer.prototype, "con", {
        get: function () {
            var _a;
            return (_a = this.player) === null || _a === void 0 ? void 0 : _a.con;
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
    FishPlayer.prototype.setFlag = function (flag_, value) {
        Log.info("Setting ".concat(flag_, " to ").concat(value));
        var flag = flag_ instanceof ranks_1.RoleFlag ? flag_ : ranks_1.RoleFlag.getByName(flag_);
        if (flag) {
            if (value) {
                this.flags.add(flag);
            }
            else {
                this.flags.delete(flag);
            }
            this.updateName();
        }
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
        if (!this.connected())
            return;
        this.stopUnit();
        this.updateName();
        if (FishPlayer.checkedIps[this.player.ip()])
            FishPlayer.checkedIps[this.player.ip()].moderated = true;
        this.sendMessage("[scarlet]Oopsy Whoopsie! You've been stopped, and marked as a griefer.");
        if (by instanceof FishPlayer) {
            this.addHistoryEntry({
                action: 'stopped',
                by: by.name,
                time: Date.now(),
            });
            api.addStopped(this.uuid);
        }
        else if (by === "vpn") {
            this.addHistoryEntry({
                action: 'stopped',
                by: by,
                time: Date.now(),
            });
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
        if (FishPlayer.checkedIps[this.player.ip()] !== false)
            FishPlayer.checkedIps[this.player.ip()].moderated = true;
        this.updateName();
        this.sendMessage("[yellow] Hey! You have been muted. You can still use /msg to send a message to someone.");
        if (by instanceof FishPlayer) {
            this.addHistoryEntry({
                action: 'muted',
                by: by.name,
                time: Date.now(),
            });
        }
        else if (by === "vpn") {
            this.addHistoryEntry({
                action: 'muted',
                by: by,
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
        Groups.player.forEach(function (pl) {
            var fishP = FishPlayer.get(pl);
            if (fishP.ranksAtLeast(ranks_1.Rank.mod)) {
                pl.sendMessage(message);
                messageReceived = true;
            }
        });
        return messageReceived;
    };
    FishPlayer.messageMuted = function (arg1, arg2) {
        var message = arg2 ? "[gray]<[red]muted[gray]>[white]".concat(arg1, "[coral]: [lightgray]").concat(arg2) : arg1;
        var messageReceived = false;
        Groups.player.forEach(function (pl) {
            var fishP = FishPlayer.get(pl);
            if (fishP.ranksAtLeast(ranks_1.Rank.mod) || fishP.muted) {
                pl.sendMessage(message);
                messageReceived = true;
            }
        });
        return messageReceived;
    };
    FishPlayer.cachedPlayers = {};
    FishPlayer.maxHistoryLength = 5;
    FishPlayer.saveVersion = 2;
    //Static transients
    FishPlayer.stats = {
        numIpsChecked: 0,
        numIpsFlagged: 0,
        numIpsErrored: 0,
    };
    //Added temporarily as part of antiVPN testing.
    FishPlayer.checkedIps = {};
    return FishPlayer;
}());
