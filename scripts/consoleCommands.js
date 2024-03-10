"use strict";
var __makeTemplateObject = (this && this.__makeTemplateObject) || function (cooked, raw) {
    if (Object.defineProperty) { Object.defineProperty(cooked, "raw", { value: raw }); } else { cooked.raw = raw; }
    return cooked;
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
        args: ["player:player", "rank:rank"],
        description: "Set a player's rank.",
        handler: function (_a) {
            var args = _a.args, outputSuccess = _a.outputSuccess, f = _a.f;
            if (args.rank == ranks_1.Rank.pi && !config.localDebug)
                (0, commands_1.fail)(f(templateObject_1 || (templateObject_1 = __makeTemplateObject(["Rank ", " is immutable."], ["Rank ", " is immutable."])), args.rank));
            if (args.player.immutable() && !config.localDebug)
                (0, commands_1.fail)(f(templateObject_2 || (templateObject_2 = __makeTemplateObject(["Player ", " is immutable."], ["Player ", " is immutable."])), args.player));
            args.player.setRank(args.rank);
            (0, utils_1.logAction)("set rank to ".concat(args.rank.name, " for"), "console", args.player);
            outputSuccess(f(templateObject_3 || (templateObject_3 = __makeTemplateObject(["Set rank of player ", " to ", ""], ["Set rank of player ", " to ", ""])), args.player, args.rank));
        }
    },
    admin: {
        args: ["nothing:string?"],
        description: "Use the setrank command instead.",
        handler: function () {
            (0, commands_1.fail)("Use the \"setrank\" command instead. Hint: \"setrank player admin\"");
        }
    },
    setflag: {
        args: ["player:player", "flag:roleflag", "value:boolean"],
        description: "Set a player's role flags.",
        handler: function (_a) {
            var args = _a.args, outputSuccess = _a.outputSuccess, f = _a.f;
            args.player.setFlag(args.flag, args.value);
            (0, utils_1.logAction)("set roleflag ".concat(args.flag.name, " to ").concat(args.value, " for"), "console", args.player);
            outputSuccess(f(templateObject_4 || (templateObject_4 = __makeTemplateObject(["Set role flag ", " of player ", " to ", ""], ["Set role flag ", " of player ", " to ", ""])), args.flag, args.player, args.value));
        }
    },
    savePlayers: {
        args: [],
        description: "Runs FishPlayer.save()",
        handler: function (_a) {
            var outputSuccess = _a.outputSuccess;
            players_1.FishPlayer.saveAll();
            outputSuccess("Successfully wrote fish player data.");
        }
    },
    info: {
        args: ["player:string"],
        description: "Find player info(s). Displays all names and ips of a player.",
        handler: function (_a) {
            var e_1, _b;
            var args = _a.args, output = _a.output, admins = _a.admins;
            var infoList = (0, utils_1.setToArray)(admins.findByName(args.player));
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
            var args = _a.args, output = _a.output, admins = _a.admins;
            var infoList = args.player == "*" ? players_1.FishPlayer.getAllOnline() : players_1.FishPlayer.getAllByName(args.player, false);
            if (infoList.length == 0)
                (0, commands_1.fail)("Nobody with that name could be found.");
            var outputString = [""];
            var _loop_2 = function (player) {
                var playerInfo = admins.getInfo(player.uuid);
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
            var args = _a.args, output = _a.output, admins = _a.admins;
            var blacklist = admins.dosBlacklist;
            if (blacklist.remove(args.ip))
                output("Removed ".concat(args.ip, " from the DOS blacklist."));
            else
                (0, commands_1.fail)("IP address ".concat(args.ip, " is not DOS blacklisted."));
        }
    },
    blacklist: {
        args: ["rich:boolean?"],
        description: "Allows you to view the DOS blacklist.",
        handler: function (_a) {
            var args = _a.args, output = _a.output, admins = _a.admins;
            var blacklist = admins.dosBlacklist;
            if (blacklist.isEmpty())
                (0, commands_1.fail)("The blacklist is empty");
            if (args.rich) {
                var outputString_1 = ["DOS Blacklist:"];
                blacklist.each(function (ip) {
                    var info = admins.findByIP(ip);
                    if (info) {
                        outputString_1.push("IP: &c".concat(ip, "&fr UUID: &c\"").concat(info.id, "\"&fr Last name used: &c\"").concat(info.plainLastName(), "\"&fr"));
                    }
                });
                output(outputString_1.join("\n"));
                output("".concat(blacklist.size, " blacklisted IPs"));
            }
            else {
                output(blacklist.toString());
                output("".concat(blacklist.size, " blacklisted IPs"));
            }
        }
    },
    whack: {
        args: ["target:string"],
        description: "Whacks (ipbans) a player.",
        handler: function (_a) {
            var args = _a.args, output = _a.output, outputFail = _a.outputFail, admins = _a.admins;
            if (globals_1.ipPattern.test(args.target)) {
                //target is an ip
                api.ban({ ip: args.target });
                var info = admins.findByIP(args.target);
                if (info)
                    (0, utils_1.logAction)("whacked", "console", info);
                else
                    (0, utils_1.logAction)("console ip-whacked ".concat(args.target));
                if (admins.isIPBanned(args.target)) {
                    output("IP &c\"".concat(args.target, "\"&fr is already banned. Ban was synced to other servers."));
                }
                else {
                    admins.banPlayerIP(args.target);
                    output("&lrIP &c\"".concat(args.target, "\"&lr was banned. Ban was synced to other servers."));
                }
            }
            else if (globals_1.uuidPattern.test(args.target)) {
                var info = admins.getInfoOptional(args.target);
                if (info)
                    (0, utils_1.logAction)("whacked", "console", info);
                else
                    (0, utils_1.logAction)("console ip-whacked ".concat(args.target));
                api.addStopped(args.target, config.maxTime);
                if (admins.isIDBanned(args.target)) {
                    api.ban({ uuid: args.target });
                    output("UUID &c\"".concat(args.target, "\"&fr is already banned. Ban was synced to other servers."));
                }
                else {
                    admins.banPlayerID(args.target);
                    if (info) {
                        admins.banPlayerIP(info.lastIP);
                        api.ban({ uuid: args.target, ip: info.lastIP });
                        output("&lrUUID &c\"".concat(args.target, "\" &lrwas banned. IP &c\"").concat(info.lastIP, "\"&lr was banned. Ban was synced to other servers."));
                    }
                    else {
                        api.ban({ uuid: args.target });
                        output("&lrUUID &c\"".concat(args.target, "\" &lrwas banned. Ban was synced to other servers. Warning: no stored info for this UUID, player may not exist. Unable to determine IP."));
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
                    admins.banPlayerID(uuid);
                    admins.banPlayerIP(ip);
                    (0, utils_1.logAction)("console whacked ".concat(Strings.stripColors(player.name), " (`").concat(uuid, "`/`").concat(ip, "`)"));
                    api.ban({ uuid: uuid, ip: ip });
                    api.addStopped(player.uuid(), config.maxTime);
                    output("&lrIP &c\"".concat(ip, "\"&lr was banned. UUID &c\"").concat(uuid, "\"&lr was banned. Ban was synced to other servers."));
                }
            }
            (0, utils_1.updateBans)(function (player) { return "[scarlet]Player [yellow]".concat(player.name, "[scarlet] has been whacked."); });
        }
    },
    unwhack: {
        args: ["target:string"],
        description: "Unbans a player.",
        handler: function (_a) {
            var args = _a.args, output = _a.output, admins = _a.admins;
            if (globals_1.ipPattern.test(args.target)) {
                //target is an ip
                if (players_1.FishPlayer.removePunishedIP(args.target)) {
                    output("Removed IP &c\"".concat(args.target, "\"&fr from the anti-evasion list."));
                }
                output("Checking ban status...");
                api.getBanned({ ip: args.target }, function (banned) {
                    if (banned) {
                        api.unban({ ip: args.target });
                        (0, utils_1.logAction)("console unbanned ip `".concat(args.target, "`"));
                        output("IP &c\"".concat(args.target, "\"&fr has been globally unbanned."));
                    }
                    else {
                        output("IP &c\"".concat(args.target, "\"&fr is not globally banned."));
                    }
                    if (admins.isIPBanned(args.target)) {
                        admins.unbanPlayerIP(args.target);
                        output("IP &c\"".concat(args.target, "\"&fr has been locally unbanned."));
                    }
                    else {
                        output("IP &c\"".concat(args.target, "\"&fr was not locally banned."));
                    }
                });
            }
            else if (globals_1.uuidPattern.test(args.target)) {
                if (players_1.FishPlayer.removePunishedUUID(args.target)) {
                    output("Removed UUID &c\"".concat(args.target, "\"&fr from the anti-evasion list."));
                }
                output("Checking ban status...");
                var info_1 = admins.findByIP(args.target);
                api.getBanned({ uuid: args.target }, function (banned) {
                    if (banned) {
                        api.unban({ uuid: args.target });
                        (0, utils_1.logAction)("console unbanned uuid `".concat(args.target, "`"));
                        output("UUID &c\"".concat(args.target, "\"&fr has been globally unbanned."));
                    }
                    else {
                        output("UUID &c\"".concat(args.target, "\"&fr is not globally banned."));
                    }
                    if (admins.isIDBanned(args.target)) {
                        admins.unbanPlayerID(args.target);
                        output("UUID &c\"".concat(args.target, "\"&fr has been locally unbanned."));
                    }
                    else {
                        output("UUID &c\"".concat(args.target, "\"&fr was not locally banned."));
                    }
                    if (info_1) {
                        output("You may also want to consider unbanning the IP \"".concat(info_1.lastIP, "\"."));
                    }
                });
            }
            else {
                (0, commands_1.fail)("Cannot unban by name; please use the info command to find the IP and UUID of the player you are looking for.");
            }
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
            var args = _a.args, outputSuccess = _a.outputSuccess, admins = _a.admins;
            var player = args.player == "last" ? ((_b = players_1.FishPlayer.lastAuthKicked) !== null && _b !== void 0 ? _b : (0, commands_1.fail)("Nobody has been kicked for authorization failure since the last restart.")) :
                (_c = players_1.FishPlayer.getById(args.player)) !== null && _c !== void 0 ? _c : (0, commands_1.fail)(admins.getInfoOptional(args.player)
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
            if (!commandsDir.exists())
                (0, commands_1.fail)("Fish commands directory at path ".concat(commandsDir.absolutePath(), " does not exist!"));
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
            var args = _a.args;
            if (config_1.Mode.pvp()) {
                if (Groups.player.isEmpty()) {
                    Log.info("Restarting immediately as no players are online.");
                    (0, utils_1.serverRestartLoop)(0);
                }
                else if (args.time === -1) {
                    Log.info("&rRestarting in 15 seconds (this will interrupt the current PVP match).&fr");
                    Call.sendMessage("[accent]---[[[coral]+++[]]---\n[accent]Server restart imminent. [green]We'll be back after 15 seconds.[]\n[accent]---[[[coral]+++[]]---");
                    (0, utils_1.serverRestartLoop)(15);
                }
                else {
                    Call.sendMessage("[accent]---[[[coral]+++[]]---\n[accent]Server restart queued. The server will restart after the current match is over.[]\n[accent]---[[[coral]+++[]]---");
                    Log.info("PVP detected, restart will occur at the end of the current match. Run \"restart -1\" to override, but &rthat would interrupt the current pvp match, and players would lose their teams.&fr");
                    globals_1.fishState.restartQueued = true;
                }
            }
            else {
                Call.sendMessage("[accent]---[[[coral]+++[]]---\n[accent]Server restart imminent. [green]We'll be back with 15 seconds of downtime, and all progress will be saved.[]\n[accent]---[[[coral]+++[]]---");
                var time = (_b = args.time) !== null && _b !== void 0 ? _b : 60;
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
                args.player.shouldUpdateName = false;
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
            output("Memory usage:\nTotal: ".concat(Math.round(Core.app.getJavaHeap() / (Math.pow(2, 10))), " KB\nNumber of cached fish players: ").concat(Object.keys(players_1.FishPlayer.cachedPlayers).length, " (has data: ").concat(Object.values(players_1.FishPlayer.cachedPlayers).filter(function (p) { return p.hasData(); }).length, ")\nFish player data string length: ").concat(players_1.FishPlayer.getFishPlayersString.length, " (").concat(Core.settings.getInt("fish-subkeys"), " subkeys)\nLength of tilelog entries: ").concat(Math.round(Object.values(globals_1.tileHistory).reduce(function (acc, a) { return acc + a.length; }, 0) / (Math.pow(2, 10))), " KB"));
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
            var _b = _a.args, uuid = _b.uuid, time = _b.time, outputSuccess = _a.outputSuccess, admins = _a.admins;
            var stopTime = time !== null && time !== void 0 ? time : (config_1.maxTime - Date.now() - 10000);
            var info = admins.getInfoOptional(uuid);
            if (info == null)
                (0, commands_1.fail)("Unknown player ".concat(uuid));
            var fishP = players_1.FishPlayer.getFromInfo(info);
            fishP.stop("console", stopTime);
            (0, utils_1.logAction)('stopped', "console", info, undefined, stopTime);
            outputSuccess("Player \"".concat(info.lastName, "\" was marked for ").concat((0, utils_1.formatTime)(stopTime), "."));
        }
    },
    checkstats: {
        args: [],
        description: "Views statistics related to in-development features.",
        handler: function (_a) {
            var output = _a.output, admins = _a.admins;
            var data = Seq.with.apply(Seq, __spreadArray([], __read(Object.values(players_1.FishPlayer.stats.heuristics.blocksBroken)), false));
            Sort.instance().sort(data);
            var zeroes = data.count(function (i) { return i == 0; });
            output("Blocks broken heuristic:\nTripped: ".concat(players_1.FishPlayer.stats.heuristics.numTripped, "/").concat(players_1.FishPlayer.stats.heuristics.total, "\nMarked within 20 minutes: ").concat(players_1.FishPlayer.stats.heuristics.trippedCorrect, "/").concat(players_1.FishPlayer.stats.heuristics.numTripped, "\n").concat(zeroes, "/").concat(data.size, " (").concat(Mathf.round(zeroes / data.size, 0.0001), ") of players broke 0 blocks\nList of all players that tripped:\n").concat(Object.entries(players_1.FishPlayer.stats.heuristics.tripped).map(function (_a) {
                var _b;
                var _c = __read(_a, 2), uuid = _c[0], tripped = _c[1];
                return "".concat((_b = admins.getInfoOptional(uuid)) === null || _b === void 0 ? void 0 : _b.plainLastName(), " &k(").concat(uuid, ")&fr: ").concat(tripped);
            }).join("\n"), "\nRaw data for blocks tripped: ").concat(data.toString(" ", function (i) { return i.toString(); })));
        }
    },
    clearfire: {
        args: [],
        description: "Clears all the fires.",
        handler: function (_a) {
            var output = _a.output, outputSuccess = _a.outputSuccess;
            output("Removing fires...");
            var totalRemoved = 0;
            Call.sendMessage("[scarlet][[Fire Department]:[yellow] Fires were reported. Trucks are en-route. Removing all fires shortly.");
            Timer.schedule(function () {
                totalRemoved += Groups.fire.size();
                Groups.fire.each(function (f) { return f.remove(); });
                Groups.fire.clear();
            }, 2, 0.1, 40);
            Timer.schedule(function () {
                outputSuccess("Removed ".concat(totalRemoved, " fires."));
                Call.sendMessage("[scarlet][[Fire Department]:[yellow] We've extinguished ".concat(totalRemoved, " fires."));
            }, 6.1);
        }
    },
    status: {
        args: [],
        description: "Displays server status.",
        handler: function (_a) {
            var output = _a.output;
            if (Vars.state.isMenu())
                (0, commands_1.fail)("Status: Server closed.");
            var uptime = Packages.java.lang.management.ManagementFactory.getRuntimeMXBean().getUptime();
            var numStaff = 0;
            players_1.FishPlayer.forEachPlayer(function (p) {
                if (p.ranksAtLeast("mod"))
                    numStaff++;
            });
            output("\nStatus:\nPlaying on map &fi".concat(Vars.state.map.plainName(), "&fr for ").concat((0, utils_1.formatTime)(1000 * Vars.state.tick / 60), "\n").concat(Vars.state.rules.waves ? "Wave &c".concat(Vars.state.wave, "&fr, &c").concat(Math.ceil(Vars.state.wavetime / 60), "&fr seconds until next wave.\n") : "", "&c").concat(Groups.unit.size(), "&fr units, &c").concat(Vars.state.enemies, "&fr enemies, &c").concat(Groups.build.size(), "&fr buildings\nTPS: ").concat((0, utils_1.colorNumber)(Core.graphics.getFramesPerSecond(), function (f) { return f > 58 ? "&g" : f > 30 ? "&y" : f > 10 ? "&r" : "&br&w"; }, "server"), ", Memory: &c").concat(Math.round(Core.app.getJavaHeap() / 1048576), "&fr MB\nServer uptime: ").concat((0, utils_1.formatTime)(uptime), " (since ").concat((0, utils_1.formatTimestamp)(Date.now() - uptime), ")\n").concat([
                globals_1.fishState.restartQueued ? "&lrRestart queued&fr" : "",
                players_1.FishPlayer.antiBotMode() ? "&br&wANTIBOT ACTIVE!&fr" + (0, utils_1.getAntiBotInfo)("server") : "",
            ].filter(function (l) { return l.length > 0; }).join("\n"), "\n").concat((0, utils_1.colorNumber)(Groups.player.size(), function (n) { return n > 0 ? "&c" : "&lr"; }, "server"), " players online, ").concat((0, utils_1.colorNumber)(numStaff, function (n) { return n > 0 ? "&c" : "&lr"; }, "server"), " staff members.\n").concat(players_1.FishPlayer.mapPlayers(function (p) {
                return "\t".concat(p.rank.shortPrefix, " &c").concat(p.uuid, "&fr &c").concat(p.name, "&fr");
            }).join("\n") || "&lrNo players connected.&fr", "\n"));
        }
    },
    tmux: {
        args: ["attach:string"],
        description: "Oopsie",
        handler: function () {
            (0, commands_1.fail)("You are already in the Mindustry server console. Please regain situational awareness before running any further commands.");
        }
    },
    BEGIN: {
        args: ["transaction:string"],
        description: "Oopsie",
        handler: function (_a) {
            var args = _a.args;
            if (args.transaction == "TRANSACTION")
                (0, commands_1.fail)("Not possible :( please download and run locally, and make a backup");
            else
                (0, commands_1.fail)("Command not found. Did you mean \"BEGIN TRANSACTION\"?");
        }
    },
    prune: {
        args: ["confirm:boolean?"],
        description: "Prunes fish player data",
        handler: function (_a) {
            var args = _a.args, admins = _a.admins, outputSuccess = _a.outputSuccess, outputFail = _a.outputFail;
            var playersToPrune = Object.values(players_1.FishPlayer.cachedPlayers)
                .filter(function (player) {
                if (player.hasData())
                    return false;
                var data = admins.getInfoOptional(player.uuid);
                return (!data ||
                    data.timesJoined == 1 ||
                    (data.timesJoined < 10 &&
                        (Date.now() - player.lastJoined) > (30 * 86400 * 1000)));
            });
            if (args.confirm) {
                outputSuccess("Creating backup...");
                var backupScript = Core.settings.getDataDirectory().child("backup.sh");
                if (!backupScript.exists())
                    (0, commands_1.fail)("./backup.sh does not exist! aborting");
                var backupProcess_1 = new ProcessBuilder(backupScript.absolutePath())
                    .directory(Core.settings.getDataDirectory().file())
                    .redirectErrorStream(true)
                    .redirectOutput(ProcessBuilder.Redirect.INHERIT)
                    .start();
                Threads.daemon(function () {
                    backupProcess_1.waitFor();
                    if (backupProcess_1.exitValue() == 0) {
                        outputSuccess("Successfully created a backup.");
                        Core.app.post(function () {
                            playersToPrune.forEach(function (u) { delete players_1.FishPlayer.cachedPlayers[u.uuid]; });
                            outputSuccess("Pruned ".concat(playersToPrune.length, " players."));
                        });
                    }
                    else {
                        outputFail("Backup failed!");
                    }
                });
            }
            else {
                outputSuccess("Pruning would remove fish data for ".concat(playersToPrune.length, " players with no data and (1 join or inactive with <10 joins). (Mindustry data will remain.)\nRun \"prune y\" to prune data."));
            }
        }
    },
    backup: {
        args: [],
        description: "Creates a backup of the settings.bin file.",
        handler: function (_a) {
            var output = _a.output, outputFail = _a.outputFail, outputSuccess = _a.outputSuccess;
            output("Creating backup...");
            var backupScript = Core.settings.getDataDirectory().child("backup.sh");
            if (!backupScript.exists())
                (0, commands_1.fail)("./backup.sh does not exist! aborting");
            var backupProcess = new ProcessBuilder(backupScript.absolutePath())
                .directory(Core.settings.getDataDirectory().file())
                .redirectErrorStream(true)
                .redirectOutput(ProcessBuilder.Redirect.INHERIT)
                .start();
            Threads.daemon(function () {
                backupProcess.waitFor();
                if (backupProcess.exitValue() == 0)
                    outputSuccess("Successfully created a backup.");
                else
                    outputFail("Backup failed!");
            });
        }
    }
});
var templateObject_1, templateObject_2, templateObject_3, templateObject_4;
