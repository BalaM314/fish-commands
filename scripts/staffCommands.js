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
Object.defineProperty(exports, "__esModule", { value: true });
exports.commands = void 0;
var api = require("./api");
var fjsContext = require("./fjsContext");
var commands_1 = require("./commands");
var config_1 = require("./config");
var globals_1 = require("./globals");
var menus_1 = require("./menus");
var players_1 = require("./players");
var ranks_1 = require("./ranks");
var utils_1 = require("./utils");
var spawnedUnits = [];
exports.commands = (0, commands_1.commandList)({
    warn: {
        args: ['player:player', 'message:string?'],
        description: 'Sends the player a warning (menu popup).',
        perm: commands_1.Perm.mod,
        handler: function (_a) {
            var _b;
            var args = _a.args, sender = _a.sender, outputSuccess = _a.outputSuccess, f = _a.f, lastUsedSuccessfullySender = _a.lastUsedSuccessfullySender;
            if (Date.now() - lastUsedSuccessfullySender < 3000)
                (0, commands_1.fail)("This command was run recently and is on cooldown.");
            if (args.player.hasPerm("blockTrolling"))
                (0, commands_1.fail)("Player ".concat(args.player, " is insufficiently trollable."));
            var message = (_b = args.message) !== null && _b !== void 0 ? _b : "You have been warned. I suggest you stop what you're doing";
            (0, menus_1.menu)('Warning', message, ['accept'], args.player);
            (0, utils_1.logAction)('warned', sender, args.player, message);
            outputSuccess(f(templateObject_1 || (templateObject_1 = __makeTemplateObject(["Warned player ", " for \"", "\""], ["Warned player ", " for \"", "\""])), args.player, message));
        }
    },
    mute: {
        args: ['player:player'],
        description: 'Stops a player from chatting.',
        perm: commands_1.Perm.mod,
        handler: function (_a) {
            var args = _a.args, sender = _a.sender, outputSuccess = _a.outputSuccess, f = _a.f;
            if (args.player.muted)
                (0, commands_1.fail)(f(templateObject_2 || (templateObject_2 = __makeTemplateObject(["Player ", " is already muted."], ["Player ", " is already muted."])), args.player));
            if (!sender.canModerate(args.player))
                (0, commands_1.fail)("You do not have permission to mute this player.");
            args.player.mute(sender);
            (0, utils_1.logAction)('muted', sender, args.player);
            outputSuccess(f(templateObject_3 || (templateObject_3 = __makeTemplateObject(["Muted player ", "."], ["Muted player ", "."])), args.player));
        }
    },
    unmute: {
        args: ['player:player'],
        description: 'Unmutes a player',
        perm: commands_1.Perm.mod,
        handler: function (_a) {
            var args = _a.args, sender = _a.sender, outputSuccess = _a.outputSuccess, f = _a.f;
            if (!args.player.muted && args.player.autoflagged)
                (0, commands_1.fail)(f(templateObject_4 || (templateObject_4 = __makeTemplateObject(["Player ", " is not muted, but they are autoflagged. You probably want to free them with /free."], ["Player ", " is not muted, but they are autoflagged. You probably want to free them with /free."])), args.player));
            if (!args.player.muted)
                (0, commands_1.fail)(f(templateObject_5 || (templateObject_5 = __makeTemplateObject(["Player ", " is not muted."], ["Player ", " is not muted."])), args.player));
            args.player.unmute(sender);
            (0, utils_1.logAction)('unmuted', sender, args.player);
            outputSuccess(f(templateObject_6 || (templateObject_6 = __makeTemplateObject(["Unmuted player ", "."], ["Unmuted player ", "."])), args.player));
        }
    },
    kick: {
        args: ['player:player', 'reason:string?'],
        description: 'Kick a player with optional reason.',
        perm: commands_1.Perm.mod,
        handler: function (_a) {
            var _b;
            var args = _a.args, outputSuccess = _a.outputSuccess, f = _a.f, sender = _a.sender;
            if (!sender.canModerate(args.player))
                (0, commands_1.fail)("You do not have permission to kick this player.");
            var reason = (_b = args.reason) !== null && _b !== void 0 ? _b : 'A staff member did not like your actions.';
            args.player.player.kick(reason);
            (0, utils_1.logAction)('kicked', sender, args.player);
            args.player.setPunishedIP(config_1.stopAntiEvadeTime);
            outputSuccess(f(templateObject_7 || (templateObject_7 = __makeTemplateObject(["Kicked player ", " for \"", "\""], ["Kicked player ", " for \"", "\""])), args.player, reason));
        }
    },
    stop: {
        args: ['player:player', "time:time?", "message:string?"],
        description: 'Stops a player.',
        perm: commands_1.Perm.mod,
        handler: function (_a) {
            var _b, _c, _d, _e;
            var args = _a.args, sender = _a.sender, outputSuccess = _a.outputSuccess, f = _a.f;
            if (args.player.marked()) {
                //overload: overwrite stoptime
                if (!args.time)
                    (0, commands_1.fail)(f(templateObject_8 || (templateObject_8 = __makeTemplateObject(["Player ", " is already marked."], ["Player ", " is already marked."])), args.player));
                var previousTime = (0, utils_1.formatTimeRelative)(args.player.unmarkTime, true);
                args.player.updateStopTime(args.time);
                outputSuccess(f(templateObject_9 || (templateObject_9 = __makeTemplateObject(["Player ", "'s stop time has been updated to ", " (was ", ")."], ["Player ", "'s stop time has been updated to ", " (was ", ")."])), args.player, (0, utils_1.formatTime)(args.time), previousTime));
                (0, utils_1.logAction)("updated stop time of", sender, args.player, (_b = args.message) !== null && _b !== void 0 ? _b : undefined, args.time);
                return;
            }
            if (!sender.canModerate(args.player, false))
                (0, commands_1.fail)("You do not have permission to stop this player.");
            var time = (_c = args.time) !== null && _c !== void 0 ? _c : (0, utils_1.untilForever)();
            if (time + Date.now() > config_1.maxTime)
                (0, commands_1.fail)("Error: time too high.");
            args.player.stop(sender, time, (_d = args.message) !== null && _d !== void 0 ? _d : undefined);
            (0, utils_1.logAction)('stopped', sender, args.player, (_e = args.message) !== null && _e !== void 0 ? _e : undefined, time);
            //TODO outputGlobal()
            Call.sendMessage("[orange]Player \"".concat(args.player.name, "[orange]\" has been marked for ").concat((0, utils_1.formatTime)(time)).concat(args.message ? " with reason: [white]".concat(args.message, "[]") : "", "."));
        }
    },
    free: {
        args: ['player:player'],
        description: 'Frees a player.',
        perm: commands_1.Perm.mod,
        handler: function (_a) {
            var args = _a.args, sender = _a.sender, outputSuccess = _a.outputSuccess, outputFail = _a.outputFail, f = _a.f;
            if (args.player.marked()) {
                args.player.free(sender);
                (0, utils_1.logAction)('freed', sender, args.player);
                outputSuccess(f(templateObject_10 || (templateObject_10 = __makeTemplateObject(["Player ", " has been unmarked."], ["Player ", " has been unmarked."])), args.player));
            }
            else if (args.player.autoflagged) {
                args.player.autoflagged = false;
                args.player.sendMessage("[yellow]You have been freed! Enjoy!");
                args.player.updateName();
                args.player.forceRespawn();
                outputSuccess(f(templateObject_11 || (templateObject_11 = __makeTemplateObject(["Player ", " has been unflagged."], ["Player ", " has been unflagged."])), args.player));
            }
            else {
                outputFail(f(templateObject_12 || (templateObject_12 = __makeTemplateObject(["Player ", " is not marked or autoflagged."], ["Player ", " is not marked or autoflagged."])), args.player));
            }
        }
    },
    setrank: {
        args: ["player:player", "rank:rank"],
        description: "Set a player's rank.",
        perm: commands_1.Perm.mod,
        handler: function (_a) {
            var _b = _a.args, rank = _b.rank, player = _b.player, outputSuccess = _a.outputSuccess, f = _a.f, sender = _a.sender;
            if (rank.level >= sender.rank.level)
                (0, commands_1.fail)(f(templateObject_13 || (templateObject_13 = __makeTemplateObject(["You do not have permission to promote players to rank ", ", because your current rank is ", ""], ["You do not have permission to promote players to rank ", ", because your current rank is ", ""])), rank, sender.rank));
            if (!sender.canModerate(player))
                (0, commands_1.fail)("You do not have permission to modify the rank of player ".concat(player));
            if (rank == ranks_1.Rank.pi && !config_1.localDebug)
                (0, commands_1.fail)(f(templateObject_14 || (templateObject_14 = __makeTemplateObject(["Rank ", " is immutable."], ["Rank ", " is immutable."])), rank));
            if (player.immutable() && !config_1.localDebug)
                (0, commands_1.fail)(f(templateObject_15 || (templateObject_15 = __makeTemplateObject(["Player ", " is immutable."], ["Player ", " is immutable."])), player));
            player.setRank(rank);
            (0, utils_1.logAction)("set rank to ".concat(rank.name, " for"), sender, player);
            outputSuccess(f(templateObject_16 || (templateObject_16 = __makeTemplateObject(["Set rank of player ", " to ", ""], ["Set rank of player ", " to ", ""])), player, rank));
        }
    },
    setflag: {
        args: ["player:player", "flag:roleflag", "value:boolean"],
        description: "Set a player's role flags.",
        perm: commands_1.Perm.mod,
        handler: function (_a) {
            var _b = _a.args, flag = _b.flag, player = _b.player, value = _b.value, sender = _a.sender, outputSuccess = _a.outputSuccess, f = _a.f;
            if (!sender.canModerate(player))
                (0, commands_1.fail)(f(templateObject_17 || (templateObject_17 = __makeTemplateObject(["You do not have permission to modify the role flags of player ", ""], ["You do not have permission to modify the role flags of player ", ""])), player));
            if (!sender.hasPerm("admin") && !flag.assignableByModerators)
                (0, commands_1.fail)(f(templateObject_18 || (templateObject_18 = __makeTemplateObject(["You do not have permission to change the value of role flag ", ""], ["You do not have permission to change the value of role flag ", ""])), flag));
            player.setFlag(flag, value);
            (0, utils_1.logAction)("set roleflag ".concat(flag.name, " to ").concat(value, " for"), sender, player);
            outputSuccess(f(templateObject_19 || (templateObject_19 = __makeTemplateObject(["Set role flag ", " of player ", " to ", ""], ["Set role flag ", " of player ", " to ", ""])), flag, player, value));
        }
    },
    murder: {
        args: [],
        description: 'Kills all ohno units',
        perm: commands_1.Perm.mod,
        customUnauthorizedMessage: "[yellow]You're a [scarlet]monster[].",
        handler: function (_a) {
            var output = _a.output, f = _a.f, allCommands = _a.allCommands;
            var Ohnos = allCommands["ohno"].data; //this is not ideal... TODO commit omega shenanigans
            var numOhnos = Ohnos.amount();
            Ohnos.killAll();
            output(f(templateObject_20 || (templateObject_20 = __makeTemplateObject(["[orange]You massacred ", " helpless ohno crawlers."], ["[orange]You massacred ", " helpless ohno crawlers."])), numOhnos));
        }
    },
    stop_offline: {
        args: ["time:time?", "name:string"],
        description: "Stops an offline player.",
        perm: commands_1.Perm.mod,
        handler: function (_a) {
            var _b;
            var args = _a.args, sender = _a.sender, outputFail = _a.outputFail, outputSuccess = _a.outputSuccess, f = _a.f, admins = _a.admins;
            var maxPlayers = 60;
            function stop(option, time) {
                var fishP = players_1.FishPlayer.getFromInfo(option);
                if (sender.canModerate(fishP, true)) {
                    fishP.stop(sender, time);
                    (0, utils_1.logAction)('stopped', sender, option, undefined, time);
                    outputSuccess(f(templateObject_21 || (templateObject_21 = __makeTemplateObject(["Player ", " was marked for ", "."], ["Player ", " was marked for ", "."])), option, (0, utils_1.formatTime)(time)));
                }
                else {
                    outputFail("You do not have permission to stop this player.");
                }
            }
            if (globals_1.uuidPattern.test(args.name)) {
                var info = admins.getInfoOptional(args.name);
                if (info != null) {
                    stop(info, (_b = args.time) !== null && _b !== void 0 ? _b : (0, utils_1.untilForever)());
                }
                else {
                    outputFail(f(templateObject_22 || (templateObject_22 = __makeTemplateObject(["Unknown UUID ", ""], ["Unknown UUID ", ""])), args.name));
                }
                return;
            }
            var possiblePlayers = (0, utils_1.setToArray)(admins.searchNames(args.name));
            if (possiblePlayers.length > maxPlayers) {
                var exactPlayers = (0, utils_1.setToArray)(admins.findByName(args.name));
                if (exactPlayers.length > 0) {
                    possiblePlayers = exactPlayers;
                }
                else {
                    (0, commands_1.fail)('Too many players with that name.');
                }
            }
            else if (possiblePlayers.length == 0) {
                (0, commands_1.fail)("No players with that name were found.");
            }
            function score(data) {
                var fishP = players_1.FishPlayer.getById(data.id);
                if (fishP)
                    return fishP.lastJoined;
                return -data.timesJoined;
            }
            possiblePlayers.sort(function (a, b) { return score(b) - score(a); });
            (0, menus_1.menu)("Stop", "Choose a player to mark", possiblePlayers, sender, function (_a) {
                var optionPlayer = _a.option, sender = _a.sender;
                if (args.time == null) {
                    (0, menus_1.menu)("Stop", "Select stop time", ["2 days", "7 days", "30 days", "forever"], sender, function (_a) {
                        var optionTime = _a.option, sender = _a.sender;
                        var time = optionTime == "2 days" ? 172800000 :
                            optionTime == "7 days" ? 604800000 :
                                optionTime == "30 days" ? 2592000000 :
                                    (config_1.maxTime - Date.now() - 10000);
                        stop(optionPlayer, time);
                    }, false);
                }
                else {
                    stop(optionPlayer, args.time);
                }
            }, true, function (p) { return p.lastName; });
        }
    },
    restart: {
        args: [],
        description: "Stops and restarts the server. Do not run when the player count is high.",
        perm: commands_1.Perm.admin,
        handler: function () {
            (0, utils_1.serverRestartLoop)(30);
        }
    },
    history: {
        args: ["player:player"],
        description: "Shows moderation history for a player.",
        perm: commands_1.Perm.mod,
        handler: function (_a) {
            var args = _a.args, output = _a.output, f = _a.f;
            if (args.player.history && args.player.history.length > 0) {
                output("[yellow]_______________Player history_______________\n\n" +
                    args.player.history.map(function (e) {
                        return "".concat(e.by, " [yellow]").concat(e.action, " ").concat(args.player.name, " [white]").concat((0, utils_1.formatTimeRelative)(e.time));
                    }).join("\n"));
            }
            else {
                output(f(templateObject_23 || (templateObject_23 = __makeTemplateObject(["[yellow]No history was found for player ", "."], ["[yellow]No history was found for player ", "."])), args.player));
            }
        }
    },
    save: {
        args: [],
        description: "Saves the game state.",
        perm: commands_1.Perm.mod,
        handler: function (_a) {
            var outputSuccess = _a.outputSuccess;
            players_1.FishPlayer.saveAll();
            var file = Vars.saveDirectory.child("1.".concat(Vars.saveExtension));
            SaveIO.save(file);
            outputSuccess("Game saved.");
        }
    },
    wave: {
        args: ["wave:number"],
        description: "Sets the wave number.",
        perm: commands_1.Perm.admin,
        handler: function (_a) {
            var args = _a.args, outputSuccess = _a.outputSuccess, outputFail = _a.outputFail, f = _a.f;
            if (args.wave > 0 && Number.isInteger(args.wave)) {
                Vars.state.wave = args.wave;
                outputSuccess(f(templateObject_24 || (templateObject_24 = __makeTemplateObject(["Set wave to ", ""], ["Set wave to ", ""])), Vars.state.wave));
            }
            else {
                outputFail("Wave must be a positive integer.");
            }
        }
    },
    label: {
        args: ["time:number", "message:string"],
        description: "Places a label at your position for a specified amount of time.",
        perm: commands_1.Perm.mod,
        handler: function (_a) {
            var args = _a.args, sender = _a.sender, outputSuccess = _a.outputSuccess, f = _a.f;
            if (args.time <= 0)
                (0, commands_1.fail)("Labels cannot go back in time.");
            if (args.time > 356400)// 99 hours, in seconds
                (0, commands_1.fail)("this seems a little excessive, even for a mod.");

            var timeRemaining = args.time;
            var labelx = sender.unit().x;
            var labely = sender.unit().y;
            Timer.schedule(function () {
                if (timeRemaining > 0) {
                    var timeseconds = timeRemaining % 60;
					if(timeseconds < 10){
						timeseconds = "0" + timeseconds
					}
					var timeminutes =  (((timeRemaining - timeRemaining % 60) / 60) % 60);
                    if(timeminutes < 10){
						timeminutes = "0" + timeminutes
					}
                    var timehours = (timeRemaining - timeRemaining % 3600) / 3600;
                    if(timehours < 10){
                        timehours = "0" + timehours
                    }

                    Call.label("".concat(sender.name, "\n\n[white]").concat(args.message, "\n\n[acid]").concat(timehours, ":").concat(timeminutes, ":").concat(timeseconds), 1, labelx, labely);
                    timeRemaining--;
                }
            }, 0, 1, args.time);
            outputSuccess(f(templateObject_25 || (templateObject_25 = __makeTemplateObject(["Placed label \"", "\" for ", " seconds."], ["Placed label \"", "\" for ", " seconds."])), args.message, args.time));
        }
    },
    member: {
        args: ["value:boolean", "player:player"],
        description: "Sets a player's member status.",
        perm: commands_1.Perm.admin,
        handler: function (_a) {
            var args = _a.args, outputSuccess = _a.outputSuccess, f = _a.f;
            args.player.setFlag("member", args.value);
            outputSuccess(f(templateObject_26 || (templateObject_26 = __makeTemplateObject(["Set membership status of player ", " to ", "."], ["Set membership status of player ", " to ", "."])), args.player, args.value));
        }
    },
    ban: {
        args: ["uuid:uuid?"],
        description: "Bans a player by UUID and IP.",
        perm: commands_1.Perm.admin,
        handler: function (_a) {
            var args = _a.args, sender = _a.sender, outputSuccess = _a.outputSuccess, f = _a.f, admins = _a.admins;
            if (args.uuid) {
                //Overload 1: ban by uuid
                var data_1;
                if ((data_1 = admins.getInfoOptional(args.uuid)) != null && data_1.admin) {
                    (0, commands_1.fail)("Cannot ban an admin.");
                }
                var name = data_1 ? "".concat((0, utils_1.escapeStringColorsClient)(data_1.lastName), " (").concat(args.uuid, "/").concat(data_1.lastIP, ")") : args.uuid;
                (0, menus_1.menu)("Confirm", "Are you sure you want to ban ".concat(name, "?"), ["Yes", "Cancel"], sender, function (_a) {
                    var confirm = _a.option;
                    if (confirm != "Yes")
                        (0, commands_1.fail)("Cancelled.");
                    var uuid = args.uuid;
                    admins.banPlayerID(uuid);
                    if (data_1) {
                        var ip = data_1.lastIP;
                        admins.banPlayerIP(ip);
                        api.ban({ ip: ip, uuid: uuid });
                        Log.info("".concat(uuid, "/").concat(ip, " was banned."));
                        (0, utils_1.logAction)("banned", sender, data_1);
                        outputSuccess(f(templateObject_27 || (templateObject_27 = __makeTemplateObject(["Banned player ", " (", "/", ")"], ["Banned player ", " (", "/", ")"])), (0, utils_1.escapeStringColorsClient)(data_1.lastName), uuid, ip));
                        //TODO add way to specify whether to activate or escape color tags
                    }
                    else {
                        api.ban({ uuid: uuid });
                        Log.info("".concat(uuid, " was banned."));
                        (0, utils_1.logAction)("banned", sender, uuid);
                        outputSuccess(f(templateObject_28 || (templateObject_28 = __makeTemplateObject(["Banned player ", ". [yellow]Unable to determine IP.[]"], ["Banned player ", ". [yellow]Unable to determine IP.[]"])), uuid));
                    }
                    (0, utils_1.updateBans)(function (player) { return "[scarlet]Player [yellow]".concat(player.name, "[scarlet] has been whacked by ").concat(sender.player.name, "."); });
                }, false);
                return;
            }
            //Overload 1: ban by menu
            (0, menus_1.menu)("[scarlet]BAN[]", "Choose a player to ban.", (0, utils_1.setToArray)(Groups.player), sender, function (_a) {
                var option = _a.option;
                if (option.admin)
                    (0, commands_1.fail)("Cannot ban an admin.");
                (0, menus_1.menu)("Confirm", "Are you sure you want to ban ".concat(option.name, "?"), ["Yes", "Cancel"], sender, function (_a) {
                    var confirm = _a.option;
                    if (confirm != "Yes")
                        (0, commands_1.fail)("Cancelled.");
                    admins.banPlayerIP(option.ip()); //this also bans the UUID
                    api.ban({ ip: option.ip(), uuid: option.uuid() });
                    Log.info("".concat(option.ip(), "/").concat(option.uuid(), " was banned."));
                    (0, utils_1.logAction)("banned", sender, option.getInfo());
                    outputSuccess(f(templateObject_29 || (templateObject_29 = __makeTemplateObject(["Banned player ", "."], ["Banned player ", "."])), option));
                    (0, utils_1.updateBans)(function (player) { return "[scarlet]Player [yellow]".concat(player.name, "[scarlet] has been whacked by ").concat(sender.player.name, "."); });
                }, false);
            }, true, function (opt) { return opt.name; });
        }
    },
    ipban: {
        args: [],
        description: "This command was moved to /ban.",
        perm: commands_1.Perm.admin,
        handler: function (_a) {
            (0, commands_1.fail)("This command was moved to [scarlet]/ban[]");
        }
    },
    kill: {
        args: ["player:player"],
        description: "Kills a player's unit.",
        perm: commands_1.Perm.mod,
        handler: function (_a) {
            var args = _a.args, sender = _a.sender, outputFail = _a.outputFail, outputSuccess = _a.outputSuccess, f = _a.f;
            if (!sender.canModerate(args.player, false))
                (0, commands_1.fail)("You do not have permission to kill the unit of this player.");
            var unit = args.player.unit();
            if (unit) {
                unit.kill();
                outputSuccess(f(templateObject_30 || (templateObject_30 = __makeTemplateObject(["Killed the unit of player ", "."], ["Killed the unit of player ", "."])), args.player));
            }
            else {
                outputFail(f(templateObject_31 || (templateObject_31 = __makeTemplateObject(["Player ", " does not have a unit."], ["Player ", " does not have a unit."])), args.player));
            }
        }
    },
    respawn: {
        args: ["player:player"],
        description: "Forces a player to respawn.",
        perm: commands_1.Perm.mod,
        handler: function (_a) {
            var args = _a.args, sender = _a.sender, outputSuccess = _a.outputSuccess, f = _a.f;
            if (!sender.canModerate(args.player, false))
                (0, commands_1.fail)("You do not have permission to respawn this player.");
            args.player.forceRespawn();
            outputSuccess(f(templateObject_32 || (templateObject_32 = __makeTemplateObject(["Respawned player ", "."], ["Respawned player ", "."])), args.player));
        }
    },
    m: {
        args: ["message:string"],
        description: "Sends a message to muted players only.",
        perm: commands_1.Perm.mod,
        handler: function (_a) {
            var sender = _a.sender, args = _a.args;
            players_1.FishPlayer.messageMuted(sender.player.name, args.message);
        }
    },
    info: {
        args: ["target:player"],
        description: "Displays information about an online player. See also /infos",
        perm: commands_1.Perm.none,
        handler: function (_a) {
            var sender = _a.sender, args = _a.args, output = _a.output, f = _a.f;
            var info = args.target.player.info;
            output(f(templateObject_33 || (templateObject_33 = __makeTemplateObject(["[accent]Info for player ", " [gray](", ") (#", ")\n\t[accent]Rank: ", "\n\t[accent]Role flags: ", "\n\t[accent]Stopped: ", "\n\t[accent]marked: ", "\n\t[accent]muted: ", "\n\t[accent]autoflagged: ", "\n\t[accent]times joined / kicked: ", "/", "\n\t[accent]Names used: [[", "]"], ["\\\n[accent]Info for player ", " [gray](", ") (#", ")\n\t[accent]Rank: ", "\n\t[accent]Role flags: ", "\n\t[accent]Stopped: ", "\n\t[accent]marked: ", "\n\t[accent]muted: ", "\n\t[accent]autoflagged: ", "\n\t[accent]times joined / kicked: ", "/", "\n\t[accent]Names used: [[", "]"])), args.target, (0, utils_1.escapeStringColorsClient)(args.target.name), args.target.player.id.toString(), args.target.rank, Array.from(args.target.flags).map(function (f) { return f.coloredName(); }).join(" "), (0, utils_1.colorBadBoolean)(!args.target.hasPerm("play")), args.target.marked() ? "until ".concat((0, utils_1.formatTimeRelative)(args.target.unmarkTime)) : "[green]false", (0, utils_1.colorBadBoolean)(args.target.muted), (0, utils_1.colorBadBoolean)(args.target.autoflagged), info.timesJoined, info.timesKicked, info.names.map(utils_1.escapeStringColorsClient).items.join(", ")));
            if (sender.hasPerm("viewUUIDs"))
                output(f(templateObject_34 || (templateObject_34 = __makeTemplateObject(["\t[#FFAAAA]UUID: ", "\n\t[#FFAAAA]IP: ", ""], ["\\\n\t[#FFAAAA]UUID: ", "\n\t[#FFAAAA]IP: ", ""])), args.target.uuid, args.target.player.ip()));
        }
    },
    spawn: {
        args: ["type:unittype", "x:number?", "y:number?", "team:team?"],
        description: "Spawns a unit of specified type at your position. [scarlet]Usage will be logged.[]",
        perm: commands_1.Perm.admin,
        handler: function (_a) {
            var _b;
            var sender = _a.sender, args = _a.args, outputSuccess = _a.outputSuccess, f = _a.f;
            var x = args.x ? (args.x * 8) : sender.player.x;
            var y = args.y ? (args.y * 8) : sender.player.y;
            var team = (_b = args.team) !== null && _b !== void 0 ? _b : sender.team();
            var unit = args.type.spawn(team, x, y);
            spawnedUnits.push(unit);
            (0, utils_1.logAction)("spawned unit ".concat(args.type.name, " at ").concat(Math.round(x / 8), ", ").concat(Math.round(y / 8)), sender);
            outputSuccess(f(templateObject_35 || (templateObject_35 = __makeTemplateObject(["Spawned unit ", " at (", ", ", ")"], ["Spawned unit ", " at (", ", ", ")"])), args.type, Math.round(x / 8), Math.round(y / 8)));
        }
    },
    setblock: {
        args: ["x:number", "y:number", "block:block", "team:team?", "rotation:number?"],
        description: "Sets the block at a location.",
        perm: commands_1.Perm.admin,
        handler: function (_a) {
            var _b, _c;
            var args = _a.args, sender = _a.sender, outputSuccess = _a.outputSuccess, f = _a.f;
            var team = (_b = args.team) !== null && _b !== void 0 ? _b : sender.team();
            var tile = Vars.world.tile(args.x, args.y);
            if (args.rotation != null && (args.rotation < 0 || args.rotation > 3))
                (0, commands_1.fail)(f(templateObject_36 || (templateObject_36 = __makeTemplateObject(["Invalid rotation ", ""], ["Invalid rotation ", ""])), args.rotation));
            if (tile == null)
                (0, commands_1.fail)(f(templateObject_37 || (templateObject_37 = __makeTemplateObject(["Position (", ", ", ") is out of bounds."], ["Position (", ", ", ") is out of bounds."])), args.x, args.y));
            tile.setNet(args.block, team, (_c = args.rotation) !== null && _c !== void 0 ? _c : 0);
            outputSuccess(f(templateObject_38 || (templateObject_38 = __makeTemplateObject(["Set block at ", ", ", " to ", ""], ["Set block at ", ", ", " to ", ""])), args.x, args.y, args.block));
        }
    },
    exterminate: {
        args: [],
        description: "Removes all spawned units.",
        perm: commands_1.Perm.admin,
        handler: function (_a) {
            var sender = _a.sender, outputSuccess = _a.outputSuccess, f = _a.f;
            var numKilled = 0;
            spawnedUnits.forEach(function (u) {
                if (u.isAdded() && !u.dead) {
                    u.kill();
                    numKilled++;
                }
            });
            (0, utils_1.logAction)("exterminated ".concat(numKilled, " units"), sender);
            outputSuccess(f(templateObject_39 || (templateObject_39 = __makeTemplateObject(["Exterminated ", " units."], ["Exterminated ", " units."])), numKilled));
        }
    },
    js: {
        args: ["javascript:string"],
        description: "Run arbitrary javascript.",
        perm: commands_1.Perm.runJS,
        handler: function (_a) {
            var javascript = _a.args.javascript, output = _a.output, outputFail = _a.outputFail, sender = _a.sender;
            //Additional validation couldn't hurt...
            var playerInfo_AdminUsid = sender.info().adminUsid;
            if (!playerInfo_AdminUsid || playerInfo_AdminUsid != sender.player.usid() || sender.usid != sender.player.usid()) {
                api.sendModerationMessage("# !!!!! /js authentication failed !!!!!\nServer: ".concat((0, config_1.getGamemode)(), " Player: ").concat((0, utils_1.escapeTextDiscord)(sender.cleanedName), "/`").concat(sender.uuid, "`\n<@!709904412033810533>"));
                (0, commands_1.fail)("Authentication failure");
            }
            try {
                var scripts = Vars.mods.getScripts();
                var out = scripts.context.evaluateString(scripts.scope, javascript, "fish-js-console.js", 1);
                if (out instanceof Array) {
                    output("[cyan]Array: [[[]" + out.join(", ") + "[cyan]]");
                }
                else if (out === undefined) {
                    output("[blue]undefined[]");
                }
                else if (out === null) {
                    output("[blue]null[]");
                }
                else if (out instanceof Error) {
                    outputFail((0, utils_1.parseError)(out));
                }
                else if (typeof out == "number") {
                    output("[blue]".concat(out, "[]"));
                }
                else {
                    output(out);
                }
            }
            catch (err) {
                outputFail((0, utils_1.parseError)(err));
            }
        }
    },
    fjs: {
        args: ["javascript:string"],
        description: "Run arbitrary javascript in the fish-commands context.",
        perm: commands_1.Perm.runJS,
        handler: function (_a) {
            var javascript = _a.args.javascript, output = _a.output, outputFail = _a.outputFail, sender = _a.sender;
            //Additional validation couldn't hurt...
            var playerInfo_AdminUsid = sender.info().adminUsid;
            if (!playerInfo_AdminUsid || playerInfo_AdminUsid != sender.player.usid() || sender.usid != sender.player.usid()) {
                api.sendModerationMessage("# !!!!! /js authentication failed !!!!!\nServer: ".concat((0, config_1.getGamemode)(), " Player: ").concat((0, utils_1.escapeTextDiscord)(sender.cleanedName), "/`").concat(sender.uuid, "`\n<@!709904412033810533>"));
                (0, commands_1.fail)("Authentication failure");
            }
            fjsContext.runJS(javascript, output, outputFail);
        }
    },
    antibot: {
        args: ["state:boolean?"],
        description: "Checks anti bot stats, or force enables anti bot mode, MAKE SURE TO TURN IT OFF",
        perm: commands_1.Perm.admin,
        handler: function (_a) {
            var args = _a.args, outputSuccess = _a.outputSuccess, output = _a.output;
            if (args.state !== null) {
                players_1.FishPlayer.antiBotModeOverride = args.state;
                outputSuccess("Set antibot mode override to ".concat((0, utils_1.colorBadBoolean)(args.state), "."));
                if (args.state)
                    output("[scarlet]MAKE SURE TO TURN IT OFF!!!");
            }
            else {
                output("[acid]Antibot status:\n[acid]Enabled: ".concat((0, utils_1.colorBadBoolean)(players_1.FishPlayer.antiBotMode()), "\n").concat((0, utils_1.getAntiBotInfo)("client")));
            }
        }
    },
    chatstrictness: {
        args: ["player:player", "value:string"],
        description: "Sets chat strictness for a player.",
        perm: commands_1.Perm.mod,
        handler: function (_a) {
            var _b = _a.args, player = _b.player, value = _b.value, sender = _a.sender, outputSuccess = _a.outputSuccess, f = _a.f;
            if (!sender.canModerate(player, true))
                (0, commands_1.fail)("You do not have permission to set the chat strictness level of this player.");
            if (!(value == "chat" || value == "strict"))
                (0, commands_1.fail)("Invalid chat strictness level: valid levels are \"chat\", \"strict\"");
            player.chatStrictness = value;
            outputSuccess("Set chat strictness for player ".concat(player, " to \"").concat(value, "\"."));
        }
    },
    emanate: (0, commands_1.command)(function () {
        var unitMapping = {};
        Timer.schedule(function () {
            var e_1, _a;
            try {
                for (var _b = __values(Object.entries(unitMapping)), _c = _b.next(); !_c.done; _c = _b.next()) {
                    var _d = __read(_c.value, 2), uuid = _d[0], unit = _d[1];
                    var fishP = players_1.FishPlayer.getById(uuid);
                    if (!fishP || !fishP.connected() || (unit.getPlayer() != fishP.player)) {
                        delete unitMapping[uuid];
                        unit === null || unit === void 0 ? void 0 : unit.kill();
                    }
                }
            }
            catch (e_1_1) { e_1 = { error: e_1_1 }; }
            finally {
                try {
                    if (_c && !_c.done && (_a = _b.return)) _a.call(_b);
                }
                finally { if (e_1) throw e_1.error; }
            }
        }, 1, 0.5);
        return {
            args: [],
            description: "Puts you in an emanate.",
            perm: commands_1.Perm.admin,
            data: { unitMapping: unitMapping },
            handler: function (_a) {
                var sender = _a.sender, outputSuccess = _a.outputSuccess;
                if (!sender.connected() || !sender.unit().added || sender.unit().dead)
                    (0, commands_1.fail)("You cannot spawn an emanate because you are dead.");
                var emanate = UnitTypes.emanate.spawn(sender.team(), sender.player.x, sender.player.y);
                sender.player.unit(emanate);
                unitMapping[sender.uuid] = emanate;
                (0, utils_1.logAction)("spawned an emanate", sender);
                outputSuccess("Spawned an emanate.");
            }
        };
    }),
    clearfire: {
        args: [],
        description: "Clears all the fires.",
        perm: commands_1.Perm.admin,
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
});
var templateObject_1, templateObject_2, templateObject_3, templateObject_4, templateObject_5, templateObject_6, templateObject_7, templateObject_8, templateObject_9, templateObject_10, templateObject_11, templateObject_12, templateObject_13, templateObject_14, templateObject_15, templateObject_16, templateObject_17, templateObject_18, templateObject_19, templateObject_20, templateObject_21, templateObject_22, templateObject_23, templateObject_24, templateObject_25, templateObject_26, templateObject_27, templateObject_28, templateObject_29, templateObject_30, templateObject_31, templateObject_32, templateObject_33, templateObject_34, templateObject_35, templateObject_36, templateObject_37, templateObject_38, templateObject_39;
