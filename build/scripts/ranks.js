"use strict";
/*
Copyright © BalaM314, 2024. All Rights Reserved.
This file contains the definitions for ranks and role flags.
*/
Object.defineProperty(exports, "__esModule", { value: true });
exports.RoleFlag = exports.Rank = void 0;
/** Each player has one rank, which is used to determine their prefix, permissions, and which other players they can perform moderation actions on. */
var Rank = /** @class */ (function () {
    function Rank(name, 
    /** Used to determine whether a rank outranks another. */ level, description, prefix, shortPrefix, color, autoRankData) {
        var _a, _b, _c, _d, _e;
        this.name = name;
        this.level = level;
        this.description = description;
        this.prefix = prefix;
        this.shortPrefix = shortPrefix;
        this.color = color;
        Rank.ranks[name] = this;
        if (autoRankData) {
            this.autoRankData = {
                joins: (_a = autoRankData.joins) !== null && _a !== void 0 ? _a : 0,
                playtime: (_b = autoRankData.playtime) !== null && _b !== void 0 ? _b : 0,
                blocksPlaced: (_c = autoRankData.blocksPlaced) !== null && _c !== void 0 ? _c : 0,
                timeSinceFirstJoin: (_d = autoRankData.timeSinceFirstJoin) !== null && _d !== void 0 ? _d : 0,
                chatMessagesSent: (_e = autoRankData.chatMessagesSent) !== null && _e !== void 0 ? _e : 0,
            };
            Rank.autoRanks.push(this);
        }
    }
    Rank.getByName = function (name) {
        var _a;
        return (_a = Rank.ranks[name]) !== null && _a !== void 0 ? _a : null;
    };
    Rank.getByInput = function (input) {
        return Object.values(Rank.ranks).filter(function (rank) { return rank.name.toLowerCase().includes(input.toLowerCase()); });
    };
    Rank.prototype.coloredName = function () {
        return this.color + this.name + "[]";
    };
    Rank.ranks = {};
    Rank.autoRanks = [];
    Rank.player = new Rank("player", 0, "Ordinary players.", "", "&lk[p]&fr", "");
    Rank.active = new Rank("active", 1, "Assigned automatically to players who have played for some time.", "[black]<[forest]\uE800[]>[]", "&lk[a]&fr", "[forest]", {
        joins: 50,
        playtime: 24 * 60 * 60 * 1000, //24 hours
        blocksPlaced: 5000,
        timeSinceFirstJoin: 24 * 60 * 60 * 1000 * 7, //7 days
    });
    Rank.trusted = new Rank("trusted", 2, "Trusted players who have gained the trust of a mod or admin.", "[black]<[#E67E22]\uE813[]>[]", "&y[T]&fr", "[#E67E22]");
    Rank.mod = new Rank("mod", 3, "Moderators who can mute, stop, and kick players.", "[black]<[#6FFC7C]\uE817[]>[]", "&lg[M]&fr", "[#6FFC7C]");
    Rank.admin = new Rank("admin", 4, "Administrators with the power to ban players.", "[black]<[cyan]\uE82C[]>[]", "&lr[A]&fr", "[#C30202]");
    Rank.manager = new Rank("manager", 10, "Managers have file and console access.", "[black]<[scarlet]\uE88E[]>[]", "&c[E]&fr", "[scarlet]");
    Rank.pi = new Rank("pi", 11, "3.14159265358979323846264338327950288419716 (manager)", "[black]<[#FF8000]\u03C0[]>[]", "&b[+]&fr", "[blue]"); //i want pi rank
    Rank.fish = new Rank("fish", 999, "Owner.", "[blue]>|||>[] ", "&b[F]&fr", "[blue]");
    return Rank;
}());
exports.Rank = Rank;
Object.freeze(Rank.pi); //anti-trolling
/**
 * Role flags are used to determine a player's prefix and permissions.
 * Players can have any combination of the role flags.
 */
var RoleFlag = /** @class */ (function () {
    function RoleFlag(name, prefix, description, color, peristent, assignableByModerators) {
        if (peristent === void 0) { peristent = true; }
        if (assignableByModerators === void 0) { assignableByModerators = true; }
        this.name = name;
        this.prefix = prefix;
        this.description = description;
        this.color = color;
        this.peristent = peristent;
        this.assignableByModerators = assignableByModerators;
        RoleFlag.flags[name] = this;
    }
    RoleFlag.getByName = function (name) {
        var _a;
        return (_a = RoleFlag.flags[name]) !== null && _a !== void 0 ? _a : null;
    };
    RoleFlag.getByInput = function (input) {
        return Object.values(RoleFlag.flags).filter(function (flag) { return flag.name.toLowerCase().includes(input.toLowerCase()); });
    };
    RoleFlag.prototype.coloredName = function () {
        return this.color + this.name + "[]";
    };
    RoleFlag.flags = {};
    RoleFlag.developer = new RoleFlag("developer", "[black]<[#B000FF]\uE80E[]>[]", "Awarded to people who contribute to the server's codebase.", "[#B000FF]", true, false);
    RoleFlag.member = new RoleFlag("member", "[black]<[yellow]\uE809[]>[]", "Awarded to our awesome donors who support the server.", "[pink]", true, false);
    RoleFlag.illusionist = new RoleFlag("illusionist", "", "Assigned to to individuals who have earned access to enhanced visual effect features.", "[lightgrey]", true, true);
    RoleFlag.chief_map_analyst = new RoleFlag("chief map analyst", "[black]<[#5800FF]\uE833[]>[]", "Assigned to the chief map analyst, who oversees map management.", "[#5800FF]", true, true);
    return RoleFlag;
}());
exports.RoleFlag = RoleFlag;
