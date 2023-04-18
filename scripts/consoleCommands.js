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
Object.defineProperty(exports, "__esModule", { value: true });
exports.commands = void 0;
var players_1 = require("./players");
var ranks_1 = require("./ranks");
var utils_1 = require("./utils");
var commands_1 = require("./commands");
exports.commands = {
    setrank: {
        args: ["player:player", "rank:string"],
        description: "Set a player's rank.",
        handler: function (_a) {
            var args = _a.args, outputSuccess = _a.outputSuccess;
            var rank = ranks_1.Rank.getByName(args.rank);
            if (rank == null)
                (0, commands_1.fail)("Unknown rank ".concat(args.rank));
            args.player.setRank(rank);
            outputSuccess("Set rank of player \"".concat(args.player.name, "\" to ").concat(rank.name));
        }
    },
    savePlayers: {
        args: [],
        description: "Runs FishPlayer.save()",
        handler: function () {
            players_1.FishPlayer.saveAll();
        }
    },
    info: {
        args: ["player:string"],
        description: "Find player info(s). Displays all names and ips of a player.",
        handler: function (_a) {
            var e_1, _b;
            var args = _a.args, output = _a.output;
            var infoList = (0, utils_1.setToArray)(Vars.netServer.admins.findByName(args.player));
            if (infoList.length == 0)
                (0, commands_1.fail)("Nobody with that name could be found.");
            var outputString = [""];
            var _loop_1 = function (playerInfo) {
                var fishP = players_1.FishPlayer.getById(playerInfo.id);
                outputString.push("Trace info for player &y".concat(playerInfo.id, "&fr / &c\"").concat(Strings.stripColors(playerInfo.lastName), "\" &lk(").concat(playerInfo.lastName, ")&fr\n\tall names used: ").concat(playerInfo.names.map(function (n) { return "&c\"".concat(n, "\"&fr"); }).items.join(', '), "\n\tall IPs used: ").concat(playerInfo.ips.map(function (n) { return (n == playerInfo.lastIP ? '&c' : '&w') + n + '&fr'; }).items.join(", "), "\n\tjoined &c").concat(playerInfo.timesJoined, "&fr times, kicked &c").concat(playerInfo.timesKicked, "&fr times\n\tUSID: &c").concat((fishP === null || fishP === void 0 ? void 0 : fishP.usid) ? "\"".concat(fishP.usid, "\"") : "unknown", "&fr"));
            };
            try {
                for (var infoList_1 = __values(infoList), infoList_1_1 = infoList_1.next(); !infoList_1_1.done; infoList_1_1 = infoList_1.next()) {
                    var playerInfo = infoList_1_1.value;
                    _loop_1(playerInfo);
                }
            }
            catch (e_1_1) { e_1 = { error: e_1_1 }; }
            finally {
                try {
                    if (infoList_1_1 && !infoList_1_1.done && (_b = infoList_1.return)) _b.call(infoList_1);
                }
                finally { if (e_1) throw e_1.error; }
            }
            output(outputString.join("\n"));
        }
    },
    infoonline: {
        args: ["player:string"],
        description: "Display information about an online player.",
        handler: function (_a) {
            var e_2, _b;
            var args = _a.args, output = _a.output;
            var infoList = args.player == "*" ? players_1.FishPlayer.getAllOnline() : players_1.FishPlayer.getAllByName(args.player, false);
            if (infoList.length == 0)
                (0, commands_1.fail)("Nobody with that name could be found.");
            var outputString = [""];
            var _loop_2 = function (player) {
                var playerInfo = Vars.netServer.admins.getInfo(player.uuid);
                outputString.push("Info for player &c\"".concat(player.cleanedName, "\" &lk(").concat(player.name, ")&fr\n\tUUID: &c\"").concat(playerInfo.id, "\"&fr\n\tUSID: &c").concat(player.usid ? "\"".concat(player.usid, "\"") : "unknown", "&fr\n\tall names used: ").concat(playerInfo.names.map(function (n) { return "&c\"".concat(n, "\"&fr"); }).items.join(', '), "\n\tall IPs used: ").concat(playerInfo.ips.map(function (n) { return (n == playerInfo.lastIP ? '&c' : '&w') + n + '&fr'; }).items.join(", "), "\n\tjoined &c").concat(playerInfo.timesJoined, "&fr times, kicked &c").concat(playerInfo.timesKicked, "&fr times\n\trank: &c").concat(player.rank.name, "&fr").concat((player.stopped ? ", &lris stopped&fr" : "") + (player.muted ? ", &lris muted&fr" : "") + (player.member ? ", &lmis member&fr" : "")));
            };
            try {
                for (var infoList_2 = __values(infoList), infoList_2_1 = infoList_2.next(); !infoList_2_1.done; infoList_2_1 = infoList_2.next()) {
                    var player = infoList_2_1.value;
                    _loop_2(player);
                }
            }
            catch (e_2_1) { e_2 = { error: e_2_1 }; }
            finally {
                try {
                    if (infoList_2_1 && !infoList_2_1.done && (_b = infoList_2.return)) _b.call(infoList_2);
                }
                finally { if (e_2) throw e_2.error; }
            }
            output(outputString.join("\n"));
        }
    },
    unblacklist: {
        args: ["ip:string"],
        description: "Unblacklists an ip from the DOS blacklist.",
        handler: function (_a) {
            var args = _a.args, output = _a.output;
            var blacklist = Vars.netServer.admins.dosBlacklist;
            if (blacklist.remove(args.ip))
                output("Removed ".concat(args.ip, " from the DOS blacklist."));
            else
                (0, commands_1.fail)("IP address ".concat(args.ip, " is not DOS blacklisted."));
        }
    },
    blacklist: {
        args: [],
        description: "Allows you to view the DOS blacklist.",
        handler: function (_a) {
            var output = _a.output;
            var blacklist = Vars.netServer.admins.dosBlacklist;
            if (blacklist.isEmpty()) {
                output("The blacklist is empty");
                return;
            }
            var outputString = ["DOS Blacklist:"];
            blacklist.each(function (ip) {
                Vars.netServer.admins.findByName(ip).each(function (data) {
                    return outputString.push("IP: &c".concat(ip, "&fr UUID: &c\"").concat(data.id, "\"&fr Last name used: &c\"").concat(data.plainLastName(), "\"&fr"));
                });
            });
            output(outputString.join("\n"));
        }
    },
    whack: {
        args: ["target:string"],
        description: "Whacks (ipbans) a player.",
        handler: function (_a) {
            var _b;
            var args = _a.args, output = _a.output, outputFail = _a.outputFail;
            if (Pattern.matches("^\\d{1,3}\\.\\d{1,3}\\.\\d{1,3}\\.\\d{1,3}$", args.target)) {
                //target is an ip
                if (Vars.netServer.admins.isIPBanned(args.target)) {
                    outputFail("IP &c\"".concat(args.target, "\"&fr is already banned."));
                }
                else {
                    Vars.netServer.admins.banPlayerIP(args.target);
                    output("IP &c\"".concat(args.target, "\" &lrwas banned."));
                }
            }
            else if (Pattern.matches("[a-zA-Z0-9+/]{22}==", args.target)) {
                if (Vars.netServer.admins.isIDBanned(args.target)) {
                    outputFail("UUID &c\"".concat(args.target, "\"&lr is already banned."));
                }
                else {
                    var ip = (_b = Groups.player.find(function (p) { return args.target === p.uuid(); })) === null || _b === void 0 ? void 0 : _b.ip();
                    Vars.netServer.admins.banPlayerID(args.target);
                    if (ip) {
                        Vars.netServer.admins.banPlayerIP(ip);
                        output("UUID &c\"".concat(args.target, "\" &lrwas banned. IP &c\"").concat(ip, "\"&lr was banned."));
                    }
                    else {
                        output("UUID &c\"".concat(args.target, "\" &lrwas banned. Unable to determine ip!."));
                    }
                }
            }
            else {
                var player = players_1.FishPlayer.getOneMindustryPlayerByName(args.target);
                if (player === "none") {
                    outputFail("Could not find a player name matching &c\"".concat(args.target, "\""));
                }
                else if (player === "multiple") {
                    outputFail("Name &c\"".concat(args.target, "\"&fr could refer to more than one player."));
                }
                else {
                    var ip = player.ip();
                    var uuid = player.uuid();
                    Vars.netServer.admins.banPlayerID(uuid);
                    Vars.netServer.admins.banPlayerIP(ip);
                    output("IP &c\"".concat(ip, "\"&lr was banned. UUID &c\"").concat(uuid, "\"&lr was banned."));
                }
            }
            Groups.player.each(function (player) {
                if (Vars.netServer.admins.isIDBanned(player.uuid())) {
                    player.con.kick(Packets.KickReason.banned);
                }
            });
        }
    }
};
