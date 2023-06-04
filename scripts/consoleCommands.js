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
exports.commands = void 0;
var api_1 = require("./api");
var commands_1 = require("./commands");
var config = require("./config");
var fjsContext = require("./fjsContext");
var globals_1 = require("./globals");
var players_1 = require("./players");
var ranks_1 = require("./ranks");
var utils_1 = require("./utils");
exports.commands = (0, commands_1.consoleCommandList)({
    setrank: {
        args: ["player:player", "rank:string"],
        description: "Set a player's rank.",
        handler: function (_a) {
            var args = _a.args, outputSuccess = _a.outputSuccess;
            var ranks = ranks_1.Rank.getByInput(args.rank);
            if (ranks.length == 0)
                (0, commands_1.fail)("Unknown rank ".concat(args.rank));
            if (ranks.length > 1)
                (0, commands_1.fail)("Ambiguous rank ".concat(args.rank));
            var rank = ranks[0];
            args.player.setRank(rank);
            (0, utils_1.logAction)("set rank to ".concat(rank.name, " for"), "console", args.player);
            outputSuccess("Set rank of player \"".concat(args.player.name, "\" to ").concat(rank.color).concat(rank.name, "[]"));
        }
    },
    setflag: {
        args: ["player:player", "role:string", "value:boolean"],
        description: "Set a player's role flags.",
        handler: function (_a) {
            var args = _a.args, outputSuccess = _a.outputSuccess;
            var flags = ranks_1.RoleFlag.getByInput(args.role);
            if (flags.length == 0)
                (0, commands_1.fail)("Unknown role flag ".concat(args.role));
            if (flags.length > 1)
                (0, commands_1.fail)("Ambiguous role flag ".concat(args.role));
            var flag = flags[0];
            args.player.setFlag(flag, args.value);
            (0, utils_1.logAction)("set roleflag ".concat(flag.name, " to ").concat(args.value, " for"), "console", args.player);
            outputSuccess("Set role flag ".concat(flag.color).concat(flag.name, "[] of player \"").concat(args.player.name, "\" to ").concat(args.value));
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
                outputString.push("Info for player &c\"".concat(player.cleanedName, "\" &lk(").concat(player.name, ")&fr\n\tUUID: &c\"").concat(playerInfo.id, "\"&fr\n\tUSID: &c").concat(player.usid ? "\"".concat(player.usid, "\"") : "unknown", "&fr\n\tall names used: ").concat(playerInfo.names.map(function (n) { return "&c\"".concat(n, "\"&fr"); }).items.join(', '), "\n\tall IPs used: ").concat(playerInfo.ips.map(function (n) { return (n == playerInfo.lastIP ? '&c' : '&w') + n + '&fr'; }).items.join(", "), "\n\tjoined &c").concat(playerInfo.timesJoined, "&fr times, kicked &c").concat(playerInfo.timesKicked, "&fr times\n\trank: &c").concat(player.rank.name, "&fr").concat((player.marked() ? ", &lris marked&fr" : "") + (player.muted ? ", &lris muted&fr" : "") + (player.hasFlag("member") ? ", &lmis member&fr" : "") + (player.autoflagged ? ", &lris autoflagged&fr" : "")));
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
                    output("&lrIP &c\"".concat(args.target, "\" &lrwas banned."));
                }
            }
            else if (Pattern.matches("[a-zA-Z0-9+/]{22}==", args.target)) {
                if (Vars.netServer.admins.isIDBanned(args.target)) {
                    outputFail("UUID &c\"".concat(args.target, "\"&fr is already banned."));
                }
                else {
                    var ip = (_b = Groups.player.find(function (p) { return args.target === p.uuid(); })) === null || _b === void 0 ? void 0 : _b.ip();
                    Vars.netServer.admins.banPlayerID(args.target);
                    if (ip) {
                        Vars.netServer.admins.banPlayerIP(ip);
                        output("&lrUUID &c\"".concat(args.target, "\" &lrwas banned. IP &c\"").concat(ip, "\"&lr was banned."));
                    }
                    else {
                        output("&lrUUID &c\"".concat(args.target, "\" &lrwas banned. Unable to determine ip!."));
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
                    output("&lrIP &c\"".concat(ip, "\"&lr was banned. UUID &c\"").concat(uuid, "\"&lr was banned."));
                }
            }
            Groups.player.each(function (player) {
                if (Vars.netServer.admins.isIDBanned(player.uuid())) {
                    (0, api_1.addStopped)(player.uuid(), 999999999999);
                    player.con.kick(Packets.KickReason.banned);
                    Call.sendMessage("[scarlet] Player [yellow]".concat(player.name, " [scarlet] has been whacked."));
                }
            });
        }
    },
    loadfishplayerdata: {
        args: ["areyousure:boolean", "fishplayerdata:string"],
        description: "Overwrites current fish player data.",
        handler: function (_a) {
            var args = _a.args, output = _a.output;
            if (args.areyousure) {
                var before = Object.keys(players_1.FishPlayer.cachedPlayers).length;
                players_1.FishPlayer.loadAll(args.fishplayerdata);
                output("Loaded fish player data. before:".concat(before, ", after:").concat(Object.keys(players_1.FishPlayer.cachedPlayers).length));
            }
        }
    },
    clearstoredusids: {
        args: ["areyousure:boolean?", "areyoureallysure:boolean?", "areyoureallyreallysure:boolean?"],
        description: "Removes every stored USID.",
        handler: function (_a) {
            var e_3, _b;
            var args = _a.args, output = _a.output;
            if (args.areyousure && args.areyoureallysure && args.areyoureallyreallysure) {
                var total = 0;
                try {
                    for (var _c = __values(Object.entries(players_1.FishPlayer.cachedPlayers)), _d = _c.next(); !_d.done; _d = _c.next()) {
                        var _e = __read(_d.value, 2), uuid = _e[0], fishP = _e[1];
                        total++;
                        fishP.usid = null;
                    }
                }
                catch (e_3_1) { e_3 = { error: e_3_1 }; }
                finally {
                    try {
                        if (_d && !_d.done && (_b = _c.return)) _b.call(_c);
                    }
                    finally { if (e_3) throw e_3.error; }
                }
                players_1.FishPlayer.saveAll();
                output("Removed ".concat(total, " stored USIDs."));
            }
            else {
                output("Are you sure?!?!?!?!?!!");
            }
        }
    },
    update: {
        args: ["branch:string?"],
        description: "Updates the plugin.",
        handler: function (_a) {
            var _b;
            var args = _a.args, output = _a.output, outputSuccess = _a.outputSuccess, outputFail = _a.outputFail;
            var commandsDir = Vars.modDirectory.child("fish-commands");
            if (!commandsDir.exists()) {
                (0, commands_1.fail)("Fish commands directory at path ".concat(commandsDir.absolutePath(), " does not exist!"));
            }
            if (config.localDebug)
                (0, commands_1.fail)("Cannot update in local debug mode.");
            output("Updating...");
            var gitProcess = new ProcessBuilder("git", "pull", "origin", (_b = args.branch) !== null && _b !== void 0 ? _b : "master")
                .directory(commandsDir.file())
                .redirectErrorStream(true)
                .redirectOutput(ProcessBuilder.Redirect.INHERIT)
                .start();
            Timer.schedule(function () {
                gitProcess.waitFor();
                if (gitProcess.exitValue() == 0) {
                    outputSuccess("Updated successfully. Restart to apply changes.");
                }
                else {
                    outputFail("Update failed!");
                }
            }, 0);
        }
    },
    restart: {
        args: ["immediate:boolean?"],
        description: "Restarts the server.",
        handler: function (_a) {
            var args = _a.args, output = _a.output;
            function restartLoop(sec) {
                if (sec > 0) {
                    Call.sendMessage("[scarlet]Server restarting in: ".concat(sec));
                    Timer.schedule(function () { return restartLoop(sec - 1); }, 1);
                }
                else {
                    output("Restarting...");
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
            ;
            Call.sendMessage("[green]Game saved.");
            var time = args.immediate ? 0 : 10;
            Log.info("Restarting in ".concat(time, " seconds..."));
            restartLoop(time);
        }
    },
    rename: {
        args: ["player:player", "newname:string"],
        description: "Changes the name of a player.",
        handler: function (_a) {
            var args = _a.args, outputFail = _a.outputFail, outputSuccess = _a.outputSuccess;
            if (args.player.hasPerm("blockTrolling")) {
                outputFail("Operation aborted: Player ".concat(args.player.name, " is insufficiently trollable."));
            }
            else {
                var oldName = args.player.name;
                args.player.player.name = args.newname;
                outputSuccess("Renamed ".concat(oldName, " to ").concat(args.newname, "."));
            }
        }
    },
    fjs: {
        args: ["js:string"],
        description: "Executes arbitrary javascript code, but has access to fish-commands's variables.",
        handler: function (_a) {
            var args = _a.args;
            fjsContext.runJS(args.js);
        }
    },
    checkmem: {
        args: [],
        description: "Checks memory usage of various objects.",
        handler: function (_a) {
            var output = _a.output;
            output("Memory usage:\nTotal: ".concat(Math.round(Core.app.getJavaHeap() / (Math.pow(2, 10))), " KB\nNumber of cached fish players: ").concat(Object.keys(players_1.FishPlayer.cachedPlayers).length, "\nLength of tilelog entries: ").concat(Math.round(Object.values(globals_1.tileHistory).reduce(function (acc, a) { return acc + a.length; }, 0) / (Math.pow(2, 10))), " KB"));
        }
    }
});
