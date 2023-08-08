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
var api = require("./api");
var commands_1 = require("./commands");
var config = require("./config");
var config_1 = require("./config");
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
                (0, commands_1.fail)("No players found.");
            var outputString = [""];
            var _loop_1 = function (playerInfo) {
                var fishP = players_1.FishPlayer.getById(playerInfo.id);
                outputString.push("Trace info for player &y".concat(playerInfo.id, "&fr / &c\"").concat(Strings.stripColors(playerInfo.lastName), "\" &lk(").concat(playerInfo.lastName, ")&fr\n\tall names used: ").concat(playerInfo.names.map(function (n) { return "&c\"".concat(n, "\"&fr"); }).items.join(', '), "\n\tall IPs used: ").concat(playerInfo.ips.map(function (n) { return (n == playerInfo.lastIP ? '&c' : '&w') + n + '&fr'; }).items.join(", "), "\n\tjoined &c").concat(playerInfo.timesJoined, "&fr times, kicked &c").concat(playerInfo.timesKicked, "&fr times")
                    + (fishP ? "\n\tUSID: &c".concat(fishP.usid, "&fr\n\tRank: &c").concat(fishP.rank.name, "&fr\n\tMarked: ").concat(fishP.marked() ? "&runtil ".concat((0, utils_1.formatTimeRelative)(fishP.unmarkTime)) : fishP.autoflagged ? "&rautoflagged" : "&gfalse", "&fr\n\tMuted: &c").concat(fishP.muted, "&fr")
                        : ""));
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
            if (globals_1.ipPattern.test(args.target)) {
                //target is an ip
                api.ban({ ip: args.target });
                (0, utils_1.logAction)("console ip-whacked ".concat(args.target));
                if (Vars.netServer.admins.isIPBanned(args.target)) {
                    output("IP &c\"".concat(args.target, "\"&fr is already banned. Ban was synced to other servers."));
                }
                else {
                    Vars.netServer.admins.banPlayerIP(args.target);
                    output("&lrIP &c\"".concat(args.target, "\" &lrwas banned. Ban was synced to other servers."));
                }
            }
            else if (globals_1.uuidPattern.test(args.target)) {
                (0, utils_1.logAction)("console whacked ".concat(args.target));
                api.addStopped(args.target, config.maxTime);
                if (Vars.netServer.admins.isIDBanned(args.target)) {
                    api.ban({ uuid: args.target });
                    output("UUID &c\"".concat(args.target, "\"&fr is already banned. Ban was synced to other servers."));
                }
                else {
                    var ip = (_b = Groups.player.find(function (p) { return args.target === p.uuid(); })) === null || _b === void 0 ? void 0 : _b.ip();
                    Vars.netServer.admins.banPlayerID(args.target);
                    if (ip) {
                        Vars.netServer.admins.banPlayerIP(ip);
                        api.ban({ uuid: args.target, ip: ip });
                        output("&lrUUID &c\"".concat(args.target, "\" &lrwas banned. IP &c\"").concat(ip, "\"&lr was banned. Ban was synced to other servers."));
                    }
                    else {
                        api.ban({ uuid: args.target });
                        output("&lrUUID &c\"".concat(args.target, "\" &lrwas banned. Ban was synced to other servers. Unable to determine ip!."));
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
                    if (player.admin)
                        (0, commands_1.fail)("Player &c\"".concat(player.name, "\"&fr is an admin, you probably don't want to ban them."));
                    var ip = player.ip();
                    var uuid = player.uuid();
                    Vars.netServer.admins.banPlayerID(uuid);
                    Vars.netServer.admins.banPlayerIP(ip);
                    (0, utils_1.logAction)("console whacked ".concat(Strings.stripColors(player.name), " (`").concat(uuid, "`/`").concat(ip, "`)"));
                    api.ban({ uuid: uuid, ip: ip });
                    api.addStopped(player.uuid(), config.maxTime);
                    output("&lrIP &c\"".concat(ip, "\"&lr was banned. UUID &c\"").concat(uuid, "\"&lr was banned. Ban was synced to other servers."));
                }
            }
            Groups.player.each(function (player) {
                if (Vars.netServer.admins.isIDBanned(player.uuid())) {
                    api.addStopped(player.uuid(), config.maxTime);
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
    clearallstoredusids: {
        args: ["areyousure:boolean?", "areyoureallysure:boolean?", "areyoureallyreallysure:boolean?"],
        description: "Removes every stored USID. NOT RECOMMENDED.",
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
    resetauth: {
        args: ["player:string"],
        description: "Removes the USID of the player provided, use this if they are getting kicked with the message \"Authorization failure!\". Specify \"last\" to use the last player that got kicked.",
        handler: function (_a) {
            var _b, _c;
            var args = _a.args, outputSuccess = _a.outputSuccess;
            var player = args.player == "last" ? ((_b = players_1.FishPlayer.lastAuthKicked) !== null && _b !== void 0 ? _b : (0, commands_1.fail)("Nobody has been kicked for authorization failure since the last restart.")) :
                (_c = players_1.FishPlayer.getById(args.player)) !== null && _c !== void 0 ? _c : (0, commands_1.fail)(Vars.netServer.admins.getInfoOptional(args.player)
                    ? "Player ".concat(args.player, " has joined the server, but their info was not cached, most likely because they have no rank, so there is no stored USID.")
                    : "Unknown player ".concat(args.player));
            var oldusid = player.usid;
            player.usid = null;
            outputSuccess("Removed the usid of player ".concat(player.name, "/").concat(player.uuid, " (was ").concat(oldusid, ")"));
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
        args: ["time:number?"],
        description: "Restarts the server.",
        handler: function (_a) {
            var _b;
            var args = _a.args, output = _a.output;
            if (Vars.state.rules.mode().name() == "pvp") {
                if (args.time === -1) {
                    Log.info("&rRestarting in 15 seconds (this will interrupt the current PVP match).&fr");
                    Call.sendMessage("[accent]---[[[coral]+++[]]---\n[accent]Server restart imminent. [green]We'll be back after 15 seconds.[]\n[accent]---[[[coral]+++[]]---");
                    (0, utils_1.serverRestartLoop)(15);
                }
                else {
                    Call.sendMessage("[accent]---[[[coral]+++[]]---\n[accent]Server restart queued. The server will restart after the current match is over.[]\n[accent]---[[[coral]+++[]]---");
                    Log.info("PVP detected, restart will occur at the end of the current match. Run \"restart -1\" to override, but &rthat would interrupt the current pvp match, and players would lose their teams.&fr");
                    globals_1.fishState.restarting = true;
                }
            }
            else {
                Call.sendMessage("[accent]---[[[coral]+++[]]---\n[accent]Server restart imminent. [green]We'll be back after 15 seconds, and all progress will be saved.[]\n[accent]---[[[coral]+++[]]---");
                var time = (_b = args.time) !== null && _b !== void 0 ? _b : 10;
                if (time < 0 || time > 100)
                    (0, commands_1.fail)("Invalid time: out of valid range.");
                Log.info("Restarting in ".concat(time, " seconds..."));
                (0, utils_1.serverRestartLoop)(time);
            }
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
    },
    stopplayer: {
        args: ['player:player', "time:time?", "message:string?"],
        description: 'Stops a player.',
        handler: function (_a) {
            var _b, _c, _d;
            var args = _a.args, outputSuccess = _a.outputSuccess;
            if (args.player.marked()) {
                //overload: overwrite stoptime
                if (!args.time)
                    (0, commands_1.fail)("Player \"".concat(args.player.name, "\" is already marked."));
                var previousTime = (0, utils_1.formatTimeRelative)(args.player.unmarkTime, true);
                args.player.updateStopTime(args.time);
                outputSuccess("Player \"".concat(args.player.cleanedName, "\"'s stop time has been updated to ").concat((0, utils_1.formatTime)(args.time), " (was ").concat(previousTime, ")."));
                return;
            }
            var time = (_b = args.time) !== null && _b !== void 0 ? _b : 604800000;
            if (time + Date.now() > config_1.maxTime)
                (0, commands_1.fail)("Error: time too high.");
            args.player.stop("console", time, (_c = args.message) !== null && _c !== void 0 ? _c : undefined);
            (0, utils_1.logAction)('stopped', "console", args.player, (_d = args.message) !== null && _d !== void 0 ? _d : undefined, time);
            Call.sendMessage("[scarlet]Player \"".concat(args.player.name, "[scarlet]\" has been marked for ").concat((0, utils_1.formatTime)(time)).concat(args.message ? " with reason: [white]".concat(args.message, "[]") : "", "."));
        }
    },
    stopoffline: {
        args: ["uuid:uuid", "time:time?"],
        description: "Stops a player by uuid.",
        handler: function (_a) {
            var _b = _a.args, uuid = _b.uuid, time = _b.time, outputSuccess = _a.outputSuccess;
            var stopTime = time !== null && time !== void 0 ? time : (config_1.maxTime - Date.now() - 10000);
            var info = Vars.netServer.admins.getInfoOptional(uuid);
            if (info == null)
                (0, commands_1.fail)("Unknown player ".concat(uuid));
            var fishP = players_1.FishPlayer.getFromInfo(info);
            fishP.stop("console", stopTime);
            (0, utils_1.logAction)('stopped', "console", info, undefined, stopTime);
            outputSuccess("Player \"".concat(info.lastName, "\" was marked for ").concat((0, utils_1.formatTime)(stopTime), "."));
        }
    }
});
