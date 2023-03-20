"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.commands = void 0;
var commands_1 = require("./commands");
var menus_1 = require("./menus");
var players_1 = require("./players");
var stopped = require('./stopped');
var ohno = require('./ohno');
var utils = require('./utils');
exports.commands = {
    warn: {
        args: ['player:player', 'reason:string?'],
        description: 'Warn a player.',
        level: commands_1.PermissionsLevel.mod,
        handler: function (_a) {
            var _b;
            var args = _a.args, outputSuccess = _a.outputSuccess;
            var reason = (_b = args.reason) !== null && _b !== void 0 ? _b : "You have been warned. I suggest you stop what you're doing";
            (0, menus_1.menu)('Warning', reason, [['accept']], args.player);
            outputSuccess("Warned player \"".concat(args.player.name, "\" for \"").concat(reason, "\""));
        }
    },
    mute: {
        args: ['player:player'],
        description: 'Stops a player from chatting.',
        level: commands_1.PermissionsLevel.mod,
        handler: function (_a) {
            var args = _a.args, sender = _a.sender, outputSuccess = _a.outputSuccess, outputFail = _a.outputFail;
            if (args.player.muted) {
                outputFail("Player \"".concat(args.player.name, "\" is already muted."));
                return;
            }
            if (args.player.admin) {
                outputFail("Player \"".concat(args.player.name, "\" is an admin."));
                return;
            }
            args.player.muted = true;
            args.player.updateName();
            outputSuccess("Muted player \"".concat(args.player.name, "\"."));
            args.player.player.sendMessage("[yellow] Hey! You have been muted. You can still use /msg to send a message to someone.");
            args.player.addHistoryEntry({
                action: 'unmuted',
                by: sender.name,
                time: Date.now(),
            });
            players_1.FishPlayer.saveAll();
        }
    },
    unmute: {
        args: ['player:player'],
        description: 'Unmutes a player',
        level: commands_1.PermissionsLevel.mod,
        handler: function (_a) {
            var args = _a.args, sender = _a.sender, outputSuccess = _a.outputSuccess, outputFail = _a.outputFail;
            if (args.player.muted) {
                args.player.muted = false;
                args.player.updateName();
                outputSuccess("Unmuted player \"".concat(args.player.name, "\"."));
                args.player.player.sendMessage("[green]You have been unmuted.");
                args.player.addHistoryEntry({
                    action: 'unmuted',
                    by: sender.name,
                    time: Date.now(),
                });
            }
            else {
                outputFail("Player \"".concat(args.player.name, "\" is not muted."));
            }
        }
    },
    kick: {
        args: ['player:player', 'reason:string?'],
        description: 'Kick a player with optional reason.',
        level: commands_1.PermissionsLevel.mod,
        handler: function (_a) {
            var _b;
            var args = _a.args, outputSuccess = _a.outputSuccess, outputFail = _a.outputFail;
            if (args.player.admin || args.player.mod) {
                //if(args.player.rank.level >= sender.rank.level)
                outputFail('You do not have permission to kick this player.');
            }
            else {
                var reason = (_b = args.reason) !== null && _b !== void 0 ? _b : 'A staff member did not like your actions.';
                args.player.player.kick(reason);
                outputSuccess("Kicked player \"".concat(args.player.name, "\" for \"").concat(reason, "\""));
            }
        }
    },
    stop: {
        args: ['player:player'],
        description: 'Stops a player.',
        level: commands_1.PermissionsLevel.mod,
        handler: function (_a) {
            var args = _a.args, sender = _a.sender, outputSuccess = _a.outputSuccess, outputFail = _a.outputFail;
            if (args.player.stopped) {
                outputFail("Player \"".concat(args.player.name, "\" is already stopped."));
            }
            else {
                args.player.stop(sender);
                outputSuccess("Player \"".concat(args.player.name, "\" has been stopped."));
            }
        }
    },
    free: {
        args: ['player:player'],
        description: 'Frees a player.',
        level: commands_1.PermissionsLevel.mod,
        handler: function (_a) {
            var args = _a.args, sender = _a.sender, outputSuccess = _a.outputSuccess, outputFail = _a.outputFail;
            if (args.player.stopped) {
                args.player.free(sender);
                outputSuccess("Player \"".concat(args.player.name, "\" has been freed."));
            }
            else {
                outputFail("Player \"".concat(args.player.name, "\" is not stopped."));
                ;
            }
        }
    },
    mod: {
        args: ['action:string', 'player:player', 'tellPlayer:boolean?'],
        description: "Add or remove a player's mod status.",
        level: commands_1.PermissionsLevel.admin,
        handler: function (_a) {
            var args = _a.args, outputSuccess = _a.outputSuccess, outputFail = _a.outputFail;
            switch (args["add/remove"]) {
                case "add":
                case "a":
                case "give":
                case "promote":
                    if (args.player.mod == true) {
                        outputFail("".concat(args.player.name, " is already a Moderator."));
                    }
                    else {
                        args.player.mod = true;
                        outputSuccess("".concat(args.player.name, " [#48e076] is now ranked Moderator."));
                        args.player.sendMessage('[yellow] Your rank is now [#48e076]Moderator.[yellow] Use [acid]"/help mod"[yellow] to see available commands.');
                        args.player.updateName();
                        players_1.FishPlayer.saveAll();
                    }
                    break;
                case "remove":
                case "rm":
                case "r":
                case "demote":
                    if (args.player.admin) {
                        outputFail("".concat(args.player.name, " is an Admin."));
                    }
                    else if (!args.player.mod) {
                        outputFail("".concat(args.player.name, " is not a Moderator."));
                    }
                    else {
                        args.player.mod = false;
                        args.player.updateName();
                        players_1.FishPlayer.saveAll();
                        if (args.tellPlayer) {
                            args.player.sendMessage('[scarlet] You are now no longer a Moderator.');
                        }
                        outputSuccess("".concat(args.player.name, " [#48e076]is no longer a moderator."));
                    }
                    break;
                default:
                    outputFail("Invalid argument. [yellow]Usage: \"/mod <add|remove> <player>\"");
                    return;
            }
        }
    },
    admin: {
        args: ['action:string', 'player:player', 'tellPlayer:boolean?'],
        description: "Add or remove a player's admin status.",
        level: commands_1.PermissionsLevel.admin,
        handler: function (_a) {
            var args = _a.args, outputSuccess = _a.outputSuccess, outputFail = _a.outputFail, execServer = _a.execServer;
            switch (args["add/remove"]) {
                case "add":
                case "a":
                case "give":
                case "promote":
                    if (args.player.admin == true) {
                        outputFail("".concat(args.player.name, " is already an Admin."));
                    }
                    else {
                        args.player.admin = true;
                        execServer("admin add ".concat(args.player.player.uuid()));
                        outputSuccess("".concat(args.player.name, " [#48e076] is now an Admin."));
                        args.player.sendMessage('[yellow] Your rank is now [#48e076]Admin.[yellow] Use [sky]"/help mod"[yellow] to see available commands.');
                        args.player.updateName();
                        players_1.FishPlayer.saveAll();
                    }
                    break;
                case "remove":
                case "rm":
                case "r":
                case "demote":
                    if (!args.player.admin) {
                        outputFail("".concat(args.player.name, " is not an Admin."));
                    }
                    else {
                        args.player.admin = false;
                        execServer("admin remove ".concat(args.player.player.uuid()));
                        args.player.updateName();
                        players_1.FishPlayer.saveAll();
                        if (args.tellPlayer) {
                            args.player.sendMessage('[scarlet] You are now no longer an Admin.');
                        }
                        outputSuccess("".concat(args.player.name, " [#48e076]is no longer an admin."));
                    }
                    break;
                default:
                    outputFail("Invalid argument. [yellow]Usage: \"/admin <add|remove> <player>\"");
                    return;
            }
        }
    },
    murder: {
        args: [],
        description: 'Kills all ohno units',
        level: commands_1.PermissionsLevel.mod,
        customUnauthorizedMessage: "[yellow]You're a [scarlet]monster[].",
        handler: function (_a) {
            var outputSuccess = _a.outputSuccess;
            var numOhnos = ohno.totalOhno();
            ohno.killOhno();
            outputSuccess("You massacred [#48e076] ".concat(numOhnos, " [yellow] helpless ohno crawlers."));
        }
    },
    stop_offline: {
        args: ["name:string"],
        description: "Stops an offline player.",
        level: commands_1.PermissionsLevel.mod,
        handler: function (_a) {
            var args = _a.args, sender = _a.sender, outputFail = _a.outputFail, outputSuccess = _a.outputSuccess;
            var admins = Vars.netServer.admins;
            var possiblePlayers = admins.searchNames(args.name).toSeq().items;
            if (possiblePlayers.length > 20) {
                var exactPlayers = admins.findByName(args.name).toSeq().items;
                if (exactPlayers.size > 0) {
                    possiblePlayers = exactPlayers;
                }
                else {
                    outputFail('Too many players with that name.');
                }
            }
            (0, menus_1.menu)("Stop", "Choose a player to stop", possiblePlayers, sender, function (_a) {
                var option = _a.option, sender = _a.sender;
                var fishP = players_1.FishPlayer.getFromInfo(option);
                fishP.stopped = true;
                stopped.addStopped(option.id);
                fishP.addHistoryEntry({
                    action: 'stopped',
                    by: sender.name,
                    time: Date.now(),
                });
                outputSuccess("Player ".concat(option.lastName, " was stopped."));
            }, true, function (p) { return p.lastName; });
        }
    },
    restart: {
        args: [],
        description: "Stops and restarts the server. Do not run when the player count is high.",
        level: commands_1.PermissionsLevel.admin,
        handler: function (_a) {
            var outputFail = _a.outputFail;
            var now = Date.now();
            var lastRestart = Core.settings.get("lastRestart", "");
            if (lastRestart != "") {
                var numOld = Number(lastRestart);
                if (now - numOld < 600000) {
                    outputFail("You need to wait at least 10 minutes between restarts.");
                    return;
                }
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
    },
    history: {
        args: ["player:player"],
        description: "Shows moderation history for a player.",
        level: commands_1.PermissionsLevel.mod,
        handler: function (_a) {
            var args = _a.args, output = _a.output;
            if (args.player.history && args.player.history.length > 0) {
                output("[yellow]_______________Player history_______________\n\n" +
                    args.player.history.map(function (e) {
                        return "".concat(e.by, " [yellow]").concat(e.action, " ").concat(args.player.name, " [white]").concat(utils.getTimeSinceText(e.time));
                    }).join("\n"));
            }
            else {
                output("[yellow]No history was found for player ".concat(args.player.name, "."));
            }
        }
    },
    save: {
        args: [],
        description: "Saves the game state.",
        level: commands_1.PermissionsLevel.mod,
        handler: function (_a) {
            var outputSuccess = _a.outputSuccess;
            players_1.FishPlayer.saveAll();
            var file = Vars.saveDirectory.child('1' + '.' + Vars.saveExtension);
            SaveIO.save(file);
            outputSuccess('Game saved.');
        }
    },
    wave: {
        args: ["wave:number"],
        description: "Sets the wave number.",
        level: commands_1.PermissionsLevel.admin,
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
    },
    label: {
        args: ["time:number", "message:string"],
        description: "Places a label at your position for a specified amount of time.",
        level: commands_1.PermissionsLevel.admin,
        handler: function (_a) {
            var args = _a.args, sender = _a.sender, outputSuccess = _a.outputSuccess, outputFail = _a.outputFail;
            if (args.time <= 0 || args.time > 3600) {
                outputFail("Time must be a positive number less than 3600.");
                return;
            }
            var timeRemaining = args.time;
            var labelx = args.player.player.x;
            var labely = args.player.player.y;
            Timer.schedule(function () {
                if (timeRemaining > 0) {
                    var timeseconds = timeRemaining % 60;
                    var timeminutes = (timeRemaining - timeseconds) / 60;
                    Call.label("".concat(sender.name, "\n\n[white]").concat(args.message, "\n\n[acid]").concat(timeminutes, ":").concat(timeseconds), 1, labelx, labely);
                    timeRemaining--;
                }
            }, 0, 1, args.time);
        }
    },
    member: {
        args: ["player:player", "value:boolean"],
        description: "Sets a player's member status.",
        level: commands_1.PermissionsLevel.admin,
        handler: function (_a) {
            var args = _a.args, outputSuccess = _a.outputSuccess;
            args.player.member = args.value;
            args.player.updateName();
            players_1.FishPlayer.saveAll();
            outputSuccess("Set membership status of player \"".concat(args.player.name, "\" to ").concat(args.value, "."));
        }
    },
    ipban: {
        args: [],
        description: "Bans a player's IP.",
        level: commands_1.PermissionsLevel.admin,
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
                    outputSuccess("IP-banned player ".concat(option.name, "."));
                }
            }, true, function (opt) { return opt.name; });
        }
    }
};
