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
Object.defineProperty(exports, "__esModule", { value: true });
exports.commands = void 0;
var commands_1 = require("./commands");
var menus_1 = require("./menus");
var players_1 = require("./players");
var utils_1 = require("./utils");
var ohno_1 = require("./ohno");
var ranks_1 = require("./ranks");
exports.commands = __assign(__assign({ warn: {
        args: ['player:player', 'reason:string?'],
        description: 'Warn a player.',
        perm: commands_1.Perm.mod,
        handler: function (_a) {
            var _b;
            var args = _a.args, sender = _a.sender, outputSuccess = _a.outputSuccess;
            var reason = (_b = args.reason) !== null && _b !== void 0 ? _b : "You have been warned. I suggest you stop what you're doing";
            (0, menus_1.menu)('Warning', reason, [['accept']], args.player);
            (0, utils_1.logAction)('warned', sender, args.player);
            outputSuccess("Warned player \"".concat(args.player.cleanedName, "\" for \"").concat(reason, "\""));
        }
    }, mute: {
        args: ['player:player'],
        description: 'Stops a player from chatting.',
        perm: commands_1.Perm.mod,
        handler: function (_a) {
            var args = _a.args, sender = _a.sender, outputSuccess = _a.outputSuccess;
            if (args.player.muted)
                (0, commands_1.fail)("Player \"".concat(args.player.cleanedName, "\" is already muted."));
            if (!sender.canModerate(args.player))
                (0, commands_1.fail)("You do not have permission to mute this player.");
            args.player.mute(sender);
            (0, utils_1.logAction)('muted', sender, args.player);
            outputSuccess("Muted player \"".concat(args.player.cleanedName, "\"."));
        }
    }, unmute: {
        args: ['player:player'],
        description: 'Unmutes a player',
        perm: commands_1.Perm.mod,
        handler: function (_a) {
            var args = _a.args, sender = _a.sender, outputSuccess = _a.outputSuccess;
            if (!args.player.muted)
                (0, commands_1.fail)("Player \"".concat(args.player.cleanedName, "\" is not muted."));
            args.player.unmute(sender);
            (0, utils_1.logAction)('unmuted', sender, args.player);
            outputSuccess("Unmuted player \"".concat(args.player.cleanedName, "\"."));
        }
    }, kick: {
        args: ['player:player', 'reason:string?'],
        description: 'Kick a player with optional reason.',
        perm: commands_1.Perm.mod,
        handler: function (_a) {
            var _b;
            var args = _a.args, outputSuccess = _a.outputSuccess, sender = _a.sender;
            if (!sender.canModerate(args.player))
                (0, commands_1.fail)("You do not have permission to kick this player.");
            var reason = (_b = args.reason) !== null && _b !== void 0 ? _b : 'A staff member did not like your actions.';
            args.player.player.kick(reason);
            (0, utils_1.logAction)('kicked', sender, args.player);
            outputSuccess("Kicked player \"".concat(args.player.cleanedName, "\" for \"").concat(reason, "\""));
        }
    }, stop: {
        args: ['player:player'],
        description: 'Stops a player.',
        perm: commands_1.Perm.mod,
        handler: function (_a) {
            var args = _a.args, sender = _a.sender;
            if (args.player.stopped)
                (0, commands_1.fail)("Player \"".concat(args.player.name, "\" is already stopped."));
            if (!sender.canModerate(args.player, false))
                (0, commands_1.fail)("You do not have permission to stop this player.");
            args.player.stop(sender);
            (0, utils_1.logAction)('stopped', sender, args.player);
            Call.sendMessage("Player \"".concat(args.player.name, "\" has been stopped."));
        }
    }, free: {
        args: ['player:player'],
        description: 'Frees a player.',
        perm: commands_1.Perm.mod,
        handler: function (_a) {
            var args = _a.args, sender = _a.sender, outputSuccess = _a.outputSuccess, outputFail = _a.outputFail;
            if (args.player.stopped) {
                args.player.free(sender);
                (0, utils_1.logAction)('freed', sender, args.player);
                outputSuccess("Player \"".concat(args.player.name, "\" has been freed."));
            }
            else {
                outputFail("Player \"".concat(args.player.name, "\" is not stopped."));
                ;
            }
        }
    } }, Object.fromEntries(["admin", "mod"].map(function (n) { return [n, {
        args: [],
        description: "This command was moved to /setrank.",
        perm: commands_1.Perm.mod,
        handler: function (_a) {
            var outputFail = _a.outputFail;
            outputFail("This command was moved to /setrank.");
        }
    }]; }))), { setrank: {
        args: ["player:player", "rank:string"],
        description: "Set a player's rank.",
        perm: commands_1.Perm.mod,
        handler: function (_a) {
            var args = _a.args, outputSuccess = _a.outputSuccess, sender = _a.sender;
            var rank = ranks_1.Rank.getByName(args.rank);
            if (rank == null)
                (0, commands_1.fail)("Unknown rank ".concat(args.rank));
            if (rank.level >= sender.rank.level)
                (0, commands_1.fail)("You do not have permission to promote players to rank \"".concat(rank.name, "\", because your current rank is \"").concat(sender.rank.name, "\""));
            if (!sender.canModerate(args.player))
                (0, commands_1.fail)("You do not have permission to modify the rank of player \"".concat(args.player.name, "\""));
            args.player.setRank(rank);
            (0, utils_1.logAction)("set rank to ".concat(rank.name, " for"), sender, args.player);
            outputSuccess("Set rank of player \"".concat(args.player.name, "\" to ").concat(rank.color).concat(rank.name, "[]"));
        }
    }, setflag: {
        args: ["player:player", "roleflag:string", "value:boolean"],
        description: "Set a player's role flags.",
        perm: commands_1.Perm.mod,
        handler: function (_a) {
            var args = _a.args, sender = _a.sender, outputSuccess = _a.outputSuccess;
            var flag = ranks_1.RoleFlag.getByName(args.roleflag);
            if (flag == null)
                (0, commands_1.fail)("Unknown role flag ".concat(args.roleflag));
            if (!sender.canModerate(args.player))
                (0, commands_1.fail)("You do not have permission to modify the role flags of player \"".concat(args.player.name, "\""));
            args.player.setFlag(flag, args.value);
            (0, utils_1.logAction)("set roleflag ".concat(flag.name, " to ").concat(args.value, " for"), sender, args.player);
            outputSuccess("Set role flag ".concat(flag.color).concat(flag.name, "[] of player \"").concat(args.player.name, "\" to ").concat(args.value));
        }
    }, murder: {
        args: [],
        description: 'Kills all ohno units',
        perm: commands_1.Perm.mod,
        customUnauthorizedMessage: "[yellow]You're a [scarlet]monster[].",
        handler: function (_a) {
            var output = _a.output;
            var numOhnos = ohno_1.Ohnos.amount();
            ohno_1.Ohnos.killAll();
            output("[orange]You massacred [cyan]".concat(numOhnos, "[] helpless ohno crawlers."));
        }
    }, stop_offline: {
        args: ["name:string"],
        description: "Stops an offline player.",
        perm: commands_1.Perm.mod,
        handler: function (_a) {
            var args = _a.args, sender = _a.sender, outputFail = _a.outputFail, outputSuccess = _a.outputSuccess;
            var admins = Vars.netServer.admins;
            if (Pattern.matches("[a-zA-Z0-9+/]{22}==", args.name)) {
                var info = admins.getInfoOptional(args.name);
                if (info != null) {
                    var fishP = players_1.FishPlayer.getFromInfo(info);
                    if (sender.canModerate(fishP, true)) {
                        fishP.stop(sender);
                        (0, utils_1.logAction)('stopped', sender, info);
                        outputSuccess("Player \"".concat(info.lastName, "\" was stopped."));
                    }
                    else {
                        outputFail("You do not have permission to stop this player.");
                    }
                }
                return;
            }
            var possiblePlayers = (0, utils_1.setToArray)(admins.searchNames(args.name));
            if (possiblePlayers.length > 20) {
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
            (0, menus_1.menu)("Stop", "Choose a player to stop", possiblePlayers, sender, function (_a) {
                var option = _a.option, sender = _a.sender;
                var fishP = players_1.FishPlayer.getFromInfo(option);
                if (sender.canModerate(fishP, true)) {
                    fishP.stop(sender);
                    (0, utils_1.logAction)('stopped', sender, option);
                    outputSuccess("Player \"".concat(option.lastName, "\" was stopped."));
                }
                else {
                    outputFail("You do not have permission to stop this player.");
                }
            }, true, function (p) { return p.lastName; });
        }
    }, restart: {
        args: [],
        description: "Stops and restarts the server. Do not run when the player count is high.",
        perm: commands_1.Perm.admin,
        handler: function () {
            var now = Date.now();
            var lastRestart = Core.settings.get("lastRestart", "");
            if (lastRestart != "") {
                var numOld = Number(lastRestart);
                if (now - numOld < 600000)
                    (0, commands_1.fail)("You need to wait at least 10 minutes between restarts.");
            }
            Core.settings.put("lastRestart", String(now));
            Core.settings.manualSave();
            var file = Vars.saveDirectory.child('1' + '.' + Vars.saveExtension);
            var restartLoop = function (sec) {
                if (sec === 5) {
                    Call.sendMessage('[green]Game saved. [scarlet]Server restarting in:');
                }
                Call.sendMessage('[scarlet]' + String(sec));
                if (sec <= 0) {
                    Vars.netServer.kickAll(Packets.KickReason.serverRestarting);
                    Core.app.post(function () {
                        SaveIO.save(file);
                        Core.app.exit();
                    });
                    return;
                }
                Timer.schedule(function () {
                    var newSec = sec - 1;
                    restartLoop(newSec);
                }, 1);
            };
            restartLoop(5);
        }
    }, history: {
        args: ["player:player"],
        description: "Shows moderation history for a player.",
        perm: commands_1.Perm.mod,
        handler: function (_a) {
            var args = _a.args, output = _a.output;
            if (args.player.history && args.player.history.length > 0) {
                output("[yellow]_______________Player history_______________\n\n" +
                    args.player.history.map(function (e) {
                        return "".concat(e.by, " [yellow]").concat(e.action, " ").concat(args.player.name, " [white]").concat((0, utils_1.getTimeSinceText)(e.time));
                    }).join("\n"));
            }
            else {
                output("[yellow]No history was found for player ".concat(args.player.name, "."));
            }
        }
    }, save: {
        args: [],
        description: "Saves the game state.",
        perm: commands_1.Perm.mod,
        handler: function (_a) {
            var outputSuccess = _a.outputSuccess;
            players_1.FishPlayer.saveAll();
            var file = Vars.saveDirectory.child('1' + '.' + Vars.saveExtension);
            SaveIO.save(file);
            outputSuccess('Game saved.');
        }
    }, wave: {
        args: ["wave:number"],
        description: "Sets the wave number.",
        perm: commands_1.Perm.admin,
        handler: function (_a) {
            var args = _a.args, outputSuccess = _a.outputSuccess, outputFail = _a.outputFail;
            if (args.wave > 0 && Number.isInteger(args.wave)) {
                Vars.state.wave = args.wave;
                outputSuccess("Set wave to ".concat(Vars.state.wave));
            }
            else {
                outputFail("Wave must be a positive integer.");
            }
        }
    }, label: {
        args: ["time:number", "message:string"],
        description: "Places a label at your position for a specified amount of time.",
        perm: commands_1.Perm.admin,
        handler: function (_a) {
            var args = _a.args, sender = _a.sender, outputSuccess = _a.outputSuccess;
            if (args.time <= 0 || args.time > 3600)
                (0, commands_1.fail)("Time must be a positive number less than 3600.");
            var timeRemaining = args.time;
            var labelx = sender.unit().x;
            var labely = sender.unit().y;
            Timer.schedule(function () {
                if (timeRemaining > 0) {
                    var timeseconds = timeRemaining % 60;
                    var timeminutes = (timeRemaining - timeseconds) / 60;
                    Call.label("".concat(sender.name, "\n\n[white]").concat(args.message, "\n\n[acid]").concat(timeminutes, ":").concat(timeseconds), 1, labelx, labely);
                    timeRemaining--;
                }
            }, 0, 1, args.time);
            outputSuccess("Placed label \"".concat(args.message, "\" for ").concat(args.time, " seconds."));
        }
    }, member: {
        args: ["value:boolean", "player:player"],
        description: "Sets a player's member status.",
        perm: commands_1.Perm.admin,
        handler: function (_a) {
            var args = _a.args, outputSuccess = _a.outputSuccess;
            args.player.setFlag("member", args.value);
            args.player.updateName();
            players_1.FishPlayer.saveAll();
            outputSuccess("Set membership status of player \"".concat(args.player.name, "\" to ").concat(args.value, "."));
        }
    }, ipban: {
        args: [],
        description: "Bans a player's IP.",
        perm: commands_1.Perm.admin,
        handler: function (_a) {
            var sender = _a.sender, outputFail = _a.outputFail, outputSuccess = _a.outputSuccess, execServer = _a.execServer;
            var playerList = [];
            Groups.player.forEach(function (player) {
                if (!player.admin)
                    playerList.push(player);
            });
            (0, menus_1.menu)("IP BAN", "Choose a player to IP ban.", playerList, sender, function (_a) {
                var option = _a.option;
                if (option.admin) {
                    outputFail("Cannot ip ban an admin.");
                }
                else {
                    execServer("ban ip ".concat(option.ip()));
                    (0, utils_1.logAction)("ip-banned", sender, option);
                    outputSuccess("IP-banned player ".concat(option.name, "."));
                }
            }, true, function (opt) { return opt.name; });
        }
    }, kill: {
        args: ["player:player"],
        description: "Kills a player's unit.",
        perm: commands_1.Perm.mod,
        customUnauthorizedMessage: "You do not have the required permission (admin) to execute this command. You may be looking for /die.",
        handler: function (_a) {
            var args = _a.args, sender = _a.sender, outputFail = _a.outputFail, outputSuccess = _a.outputSuccess;
            if (!sender.canModerate(args.player, false))
                (0, commands_1.fail)("You do not have permission to kill the unit of this player.");
            var unit = args.player.unit();
            if (unit) {
                unit.kill();
                outputSuccess("Killed the unit of player \"".concat(args.player.cleanedName, "\"."));
            }
            else {
                outputFail("Player \"".concat(args.player.cleanedName, "\" does not have a unit."));
            }
        }
    }, respawn: {
        args: ["player:player"],
        description: "Forces a player to respawn.",
        perm: commands_1.Perm.mod,
        handler: function (_a) {
            var args = _a.args, sender = _a.sender, outputSuccess = _a.outputSuccess;
            if (!sender.canModerate(args.player, false))
                (0, commands_1.fail)("You do not have permission to respawn this player.");
            args.player.forceRespawn();
            outputSuccess("Respawned player \"".concat(args.player.cleanedName, "\"."));
        }
    }, m: {
        args: ["message:string"],
        description: "Sends a message to muted players only.",
        perm: commands_1.Perm.mod,
        handler: function (_a) {
            var sender = _a.sender, args = _a.args;
            players_1.FishPlayer.messageMuted(sender.player.name, args.message);
        }
    } });
