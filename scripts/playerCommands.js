"use strict";
var __makeTemplateObject = (this && this.__makeTemplateObject) || function (cooked, raw) {
    if (Object.defineProperty) { Object.defineProperty(cooked, "raw", { value: raw }); } else { cooked.raw = raw; }
    return cooked;
};
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
var config_1 = require("./config");
var globals_1 = require("./globals");
var menus_1 = require("./menus");
var players_1 = require("./players");
var ranks_1 = require("./ranks");
var utils_1 = require("./utils");
// import { votekickmanager } from './votes';
exports.commands = (0, commands_1.commandList)(__assign(__assign({ unpause: {
        args: [],
        description: 'Unpauses the game.',
        perm: commands_1.Perm.play,
        handler: function () {
            Core.app.post(function () { return Vars.state.set(GameState.State.playing); });
        },
    }, tp: {
        args: ['player:player'],
        description: 'Teleport to another player.',
        perm: commands_1.Perm.play,
        handler: function (_a) {
            var _b, _c, _d;
            var args = _a.args, sender = _a.sender;
            if (!((_b = sender.unit()) === null || _b === void 0 ? void 0 : _b.spawnedByCore))
                (0, commands_1.fail)("Can only teleport while in a core unit.");
            if (config_1.Mode.pvp())
                (0, commands_1.fail)("The /tp command is disabled in PVP.");
            if (sender.team() !== args.player.team())
                (0, commands_1.fail)("Cannot teleport to players on another team.");
            if ((_d = (_c = sender.unit()).hasPayload) === null || _d === void 0 ? void 0 : _d.call(_c))
                (0, commands_1.fail)("Cannot teleport to players while holding a payload.");
            (0, utils_1.teleportPlayer)(sender.player, args.player.player);
        },
    }, clean: {
        args: [],
        description: 'Removes all boulders from the map.',
        perm: commands_1.Perm.play,
        handler: function (_a) {
            var sender = _a.sender, outputSuccess = _a.outputSuccess, lastUsedSuccessfully = _a.lastUsedSuccessfully;
            if (Date.now() - lastUsedSuccessfully < 100000)
                (0, commands_1.fail)("This command was run recently and is on cooldown.");
            Timer.schedule(function () { return Call.sound(sender.con, Sounds.rockBreak, 1, 1, 0); }, 0, 0.05, 10);
            Vars.world.tiles.eachTile(function (t) {
                if (t.breakable() && t.block() instanceof Prop) {
                    t.removeNet();
                }
            });
            outputSuccess("Cleared the map of boulders.");
        }
    }, die: {
        args: [],
        description: 'Commits die.',
        perm: commands_1.Perm.mod,
        handler: function (_a) {
            var _b;
            var sender = _a.sender;
            (_b = sender.unit()) === null || _b === void 0 ? void 0 : _b.kill();
        },
    }, discord: {
        args: [],
        description: 'Takes you to our discord.',
        perm: commands_1.Perm.none,
        handler: function (_a) {
            var sender = _a.sender;
            Call.openURI(sender.con, 'https://discord.gg/VpzcYSQ33Y');
        },
    }, tilelog: {
        args: ['persist:boolean?'],
        description: 'Checks the history of a tile.',
        perm: commands_1.Perm.none,
        handler: function (_a) {
            var args = _a.args, output = _a.output, outputSuccess = _a.outputSuccess, currentTapMode = _a.currentTapMode, handleTaps = _a.handleTaps;
            if (currentTapMode == "on") {
                handleTaps("off");
                outputSuccess("Tilelog disabled.");
            }
            else {
                if (args.persist) {
                    handleTaps("on");
                    outputSuccess("Tilelog mode enabled. Click tiles to check their recent history. Run /tilelog again to disable.");
                }
                else {
                    handleTaps("once");
                    output("Click on a tile to check its recent history...");
                }
            }
        },
        tapped: function (_a) {
            var tile = _a.tile, x = _a.x, y = _a.y, output = _a.output, sender = _a.sender, admins = _a.admins;
            var pos = "".concat(x, ",").concat(y);
            if (!globals_1.tileHistory[pos]) {
                output("[yellow]There is no recorded history for the selected tile (".concat(tile.x, ", ").concat(tile.y, ")."));
            }
            else {
                var history = utils_1.StringIO.read(globals_1.tileHistory[pos], function (str) { return str.readArray(function (d) { return ({
                    action: d.readString(2),
                    uuid: d.readString(3),
                    time: d.readNumber(16),
                    type: d.readString(2),
                }); }, 1); });
                output("[yellow]Tile history for tile (".concat(tile.x, ", ").concat(tile.y, "):\n") + history.map(function (e) {
                    var _a, _b;
                    return globals_1.uuidPattern.test(e.uuid)
                        ? (sender.hasPerm("viewUUIDs")
                            ? "[yellow]".concat((_a = admins.getInfoOptional(e.uuid)) === null || _a === void 0 ? void 0 : _a.plainLastName(), "[lightgray](").concat(e.uuid, ")[yellow] ").concat(e.action, " a [cyan]").concat(e.type, "[] ").concat((0, utils_1.formatTimeRelative)(e.time))
                            : "[yellow]".concat((_b = admins.getInfoOptional(e.uuid)) === null || _b === void 0 ? void 0 : _b.plainLastName(), " ").concat(e.action, " a [cyan]").concat(e.type, "[] ").concat((0, utils_1.formatTimeRelative)(e.time)))
                        : "[yellow]".concat(e.uuid, "[yellow] ").concat(e.action, " a [cyan]").concat(e.type, "[] ").concat((0, utils_1.formatTimeRelative)(e.time));
                }).join('\n'));
            }
        }
    }, afk: {
        args: [],
        description: 'Toggles your afk status.',
        perm: commands_1.Perm.none,
        handler: function (_a) {
            var sender = _a.sender, outputSuccess = _a.outputSuccess;
            sender.manualAfk = !sender.manualAfk;
            sender.updateName();
            if (sender.manualAfk)
                outputSuccess("You are now marked as AFK.");
            else
                outputSuccess("You are no longer marked as AFK.");
        },
    }, vanish: {
        args: ['target:player?'],
        description: "Toggles visibility of your rank and flags.",
        perm: commands_1.Perm.vanish,
        handler: function (_a) {
            var _b;
            var args = _a.args, sender = _a.sender, outputSuccess = _a.outputSuccess;
            if (sender.stelled())
                (0, commands_1.fail)("Marked players may not hide flags.");
            if (sender.muted)
                (0, commands_1.fail)("Muted players may not hide flags.");
            (_b = args.target) !== null && _b !== void 0 ? _b : (args.target = sender);
            if (sender != args.target && args.target.hasPerm("blockTrolling"))
                (0, commands_1.fail)("Target is insufficentlly trollable.");
            if (sender != args.target && !sender.ranksAtLeast("mod"))
                (0, commands_1.fail)("You do not have permission to vanish other players.");
            args.target.showRankPrefix = !args.target.showRankPrefix;
            outputSuccess("".concat(args.target == sender ? "Your" : "".concat(args.target.name, "'s"), " rank prefix is now ").concat(args.target.showRankPrefix ? "visible" : "hidden", "."));
        },
    }, tileid: {
        args: [],
        description: 'Checks id of a tile.',
        perm: commands_1.Perm.none,
        handler: function (_a) {
            var output = _a.output, handleTaps = _a.handleTaps;
            handleTaps("once");
            output("Click a tile to see its id...");
        },
        tapped: function (_a) {
            var output = _a.output, f = _a.f, tile = _a.tile;
            output(f(templateObject_1 || (templateObject_1 = __makeTemplateObject(["ID is ", ""], ["ID is ", ""])), tile.block().id));
        }
    } }, Object.fromEntries(config_1.FishServers.all.map(function (server) { return [
    server.name,
    {
        args: [],
        description: "Switches to the ".concat(server.name, " server."),
        perm: commands_1.Perm.none,
        handler: function (_a) {
            var sender = _a.sender;
            Call.sendMessage("".concat(sender.name, "[magenta] has gone to the ").concat(server.name, " server. Use [cyan]/").concat(server.name, " [magenta]to join them!"));
            Call.connect(sender.con, server.ip, server.port);
        },
    },
]; }))), { switch: {
        args: ["server:string", "target:player?"],
        description: "Switches to another server.",
        perm: commands_1.Perm.none,
        handler: function (_a) {
            var _b, _c;
            var args = _a.args, sender = _a.sender, f = _a.f;
            if (args.target != null && args.target != sender && (!sender.hasPerm("admin") || !sender.canModerate(args.target)))
                (0, commands_1.fail)(f(templateObject_2 || (templateObject_2 = __makeTemplateObject(["You do not have permission to switch player ", "."], ["You do not have permission to switch player ", "."])), args.target));
            var target = (_b = args.target) !== null && _b !== void 0 ? _b : sender;
            if (globals_1.ipPortPattern.test(args.server) && sender.hasPerm("admin")) {
                //direct connect
                Call.connect.apply(Call, __spreadArray([target.con], __read(args.server.split(":")), false));
            }
            else {
                var server = (_c = config_1.FishServers.byName(args.server)) !== null && _c !== void 0 ? _c : (0, commands_1.fail)("Unknown server ".concat(args.server, ". Valid options: ").concat(config_1.FishServers.all.map(function (s) { return s.name; }).join(", ")));
                if (target == sender)
                    Call.sendMessage("".concat(sender.name, "[magenta] has gone to the ").concat(server.name, " server. Use [cyan]/").concat(server.name, " [magenta]to join them!"));
                Call.connect(target.con, server.ip, server.port);
            }
        }
    }, s: {
        args: ['message:string'],
        description: "Sends a message to staff only.",
        perm: commands_1.Perm.chat,
        handler: function (_a) {
            var sender = _a.sender, args = _a.args, outputSuccess = _a.outputSuccess, outputFail = _a.outputFail, lastUsedSender = _a.lastUsedSender;
            if (!sender.hasPerm("mod")) {
                if (Date.now() - lastUsedSender < 4000)
                    (0, commands_1.fail)("This command was used recently and is on cooldown. [orange]Misuse of this command may result in a mute.");
            }
            api.sendStaffMessage(args.message, sender.name, function (sent) {
                if (!sender.hasPerm("mod")) {
                    if (sent) {
                        outputSuccess("Message sent to [orange]all online staff.");
                    }
                    else {
                        var wasReceived = players_1.FishPlayer.messageStaff(sender.player.name, args.message);
                        if (wasReceived)
                            outputSuccess("Message sent to staff.");
                        else
                            outputFail("No staff were online to receive your message.");
                    }
                }
            });
        },
    }, 
    /**
     * This command is mostly for mobile (or players without foos).
     *
     * Since the player's unit follows the camera and we are moving the
     * camera, we need to keep setting the players real position to the
     * spot the command was made. This is pretty buggy but otherwise the
     * player will be up the target player's butt
     */
    watch: {
        args: ['player:player?'],
        description: "Watch/unwatch a player.",
        perm: commands_1.Perm.none,
        handler: function (_a) {
            var args = _a.args, sender = _a.sender, outputSuccess = _a.outputSuccess, outputFail = _a.outputFail;
            if (sender.watch) {
                outputSuccess("No longer watching a player.");
                sender.watch = false;
            }
            else if (args.player) {
                sender.watch = true;
                var stayX_1 = sender.unit().x;
                var stayY_1 = sender.unit().y;
                var target_1 = args.player.player;
                var watch_1 = function () {
                    if (sender.watch) {
                        // Self.X+(172.5-Self.X)/10
                        Call.setCameraPosition(sender.con, target_1.unit().x, target_1.unit().y);
                        sender.unit().set(stayX_1, stayY_1);
                        Timer.schedule(function () { return watch_1(); }, 0.1, 0.1, 0);
                    }
                    else {
                        Call.setCameraPosition(sender.con, stayX_1, stayY_1);
                    }
                };
                watch_1();
            }
            else {
                outputFail("No player to unwatch.");
            }
        },
    }, spectate: (0, commands_1.command)(function () {
        var spectators = new Map();
        function spectate(target) {
            spectators.set(target, target.team());
            target.player.team(Team.derelict);
            target.forceRespawn();
        }
        function resume(target) {
            if (spectators.get(target) == null)
                return; // this state is possible for a person who left not in spectate
            target.player.team(spectators.get(target));
            spectators.delete(target);
            target.forceRespawn();
        }
        Events.on(EventType.GameOverEvent, function () { return spectators.clear(); });
        Events.on(EventType.PlayerLeave, function (player) { return resume(player); });
        return {
            args: ["target:player?"],
            description: "Toggles spectator mode in PVP games.",
            perm: commands_1.Perm.play,
            handler: function (_a) {
                var _b;
                var args = _a.args, sender = _a.sender, outputSuccess = _a.outputSuccess, f = _a.f;
                (_b = args.target) !== null && _b !== void 0 ? _b : (args.target = sender);
                if (!config_1.Mode.pvp() && !sender.hasPerm("mod"))
                    (0, commands_1.fail)("You do not have permission to spectate on a non-pvp server.");
                if (args.target !== sender && args.target.hasPerm("blockTrolling"))
                    (0, commands_1.fail)("Target player is insufficiently trollable.");
                if (args.target !== sender && !sender.ranksAtLeast("admin"))
                    (0, commands_1.fail)("You do not have permission to force other players to spectate.");
                if (spectators.has(args.target)) {
                    resume(args.target);
                    outputSuccess(args.target == sender
                        ? f(templateObject_3 || (templateObject_3 = __makeTemplateObject(["Rejoining game as team ", "."], ["Rejoining game as team ", "."])), args.target.team()) : f(templateObject_4 || (templateObject_4 = __makeTemplateObject(["Forced ", " out of spectator mode."], ["Forced ", " out of spectator mode."])), args.target));
                }
                else {
                    spectate(args.target);
                    outputSuccess(args.target == sender
                        ? f(templateObject_5 || (templateObject_5 = __makeTemplateObject(["Now spectating. Run /spectate again to resume gameplay."], ["Now spectating. Run /spectate again to resume gameplay."]))) : f(templateObject_6 || (templateObject_6 = __makeTemplateObject(["Forced ", " into spectator mode."], ["Forced ", " into spectator mode."])), args.target));
                }
            }
        };
    }), help: {
        args: ['name:string?'],
        description: 'Displays a list of all commands.',
        perm: commands_1.Perm.none,
        handler: function (_a) {
            var args = _a.args, output = _a.output, outputFail = _a.outputFail, sender = _a.sender, allCommands = _a.allCommands;
            var formatCommand = function (name, color) {
                return new utils_1.StringBuilder()
                    .add("".concat(color, "/").concat(name))
                    .chunk("[white]".concat(allCommands[name].args.map(commands_1.formatArg).join(' ')))
                    .chunk("[lightgray]- ".concat(allCommands[name].description)).str;
            };
            var formatList = function (commandList, color) { return commandList.map(function (c) { return formatCommand(c, color); }).join('\n'); };
            if (args.name && isNaN(parseInt(args.name)) && !['mod', 'admin', 'member'].includes(args.name)) {
                //name is not a number or a category, therefore it is probably a command name
                if (args.name in allCommands && (!allCommands[args.name].isHidden || allCommands[args.name].perm.check(sender))) {
                    output("Help for command ".concat(args.name, ":\n\t").concat(allCommands[args.name].description, "\n\tUsage: [sky]/").concat(args.name, " [white]").concat(allCommands[args.name].args.map(commands_1.formatArg).join(' '), "\n\tPermission required: ").concat(allCommands[args.name].perm.name));
                }
                else {
                    outputFail("Command \"".concat(args.name, "\" does not exist."));
                }
            }
            else {
                var commands_2 = {
                    player: [],
                    mod: [],
                    admin: [],
                    member: [],
                };
                Object.entries(allCommands).forEach(function (_a) {
                    var _b = __read(_a, 2), name = _b[0], data = _b[1];
                    return (data.perm === commands_1.Perm.admin ? commands_2.admin : data.perm === commands_1.Perm.mod ? commands_2.mod : data.perm === commands_1.Perm.member ? commands_2.member : commands_2.player).push(name);
                });
                var chunkedPlayerCommands = (0, utils_1.to2DArray)(commands_2.player, 15);
                switch (args.name) {
                    case 'admin':
                        output("".concat(commands_1.Perm.admin.color, "-- Admin commands --\n") + formatList(commands_2.admin, commands_1.Perm.admin.color));
                        break;
                    case 'mod':
                        output("".concat(commands_1.Perm.mod.color, "-- Mod commands --\n") + formatList(commands_2.mod, commands_1.Perm.mod.color));
                        break;
                    case 'member':
                        output("".concat(commands_1.Perm.member.color, "-- Member commands --\n") + formatList(commands_2.member, commands_1.Perm.member.color));
                        break;
                    default:
                        var pageNumber = args.name !== null ? parseInt(args.name) : 1;
                        if (pageNumber - 1 in chunkedPlayerCommands) {
                            output("[sky]-- Commands page [lightgrey]".concat(pageNumber, "/").concat(chunkedPlayerCommands.length, "[sky] --\n") + formatList(chunkedPlayerCommands[pageNumber - 1], '[sky]'));
                        }
                        else {
                            outputFail("\"".concat(args.name, "\" is an invalid page number."));
                        }
                }
            }
        },
    }, msg: {
        args: ['player:player', 'message:string'],
        description: 'Send a message to only one player.',
        perm: commands_1.Perm.chat,
        handler: function (_a) {
            var args = _a.args, sender = _a.sender, output = _a.output, f = _a.f;
            globals_1.recentWhispers[args.player.uuid] = sender.uuid;
            args.player.sendMessage("".concat(sender.player.name, "[lightgray] whispered:[#BBBBBB] ").concat(args.message));
            output(f(templateObject_7 || (templateObject_7 = __makeTemplateObject(["[#BBBBBB]Message sent to ", "."], ["[#BBBBBB]Message sent to ", "."])), args.player));
        },
    }, r: {
        args: ['message:string'],
        description: 'Reply to the most recent message.',
        perm: commands_1.Perm.chat,
        handler: function (_a) {
            var args = _a.args, sender = _a.sender, output = _a.output, outputFail = _a.outputFail;
            if (globals_1.recentWhispers[sender.uuid]) {
                var recipient = players_1.FishPlayer.getById(globals_1.recentWhispers[sender.uuid]);
                if (recipient === null || recipient === void 0 ? void 0 : recipient.connected()) {
                    globals_1.recentWhispers[globals_1.recentWhispers[sender.uuid]] = sender.uuid;
                    recipient.sendMessage("".concat(sender.name, "[lightgray] whispered:[#BBBBBB] ").concat(args.message));
                    output("[#BBBBBB]Message sent to ".concat(recipient.name, "[#BBBBBB]."));
                }
                else {
                    outputFail("The person who last messaged you doesn't seem to exist anymore. Try whispering to someone with [white]\"/msg <player> <message>\"");
                }
            }
            else {
                outputFail("It doesn't look like someone has messaged you recently. Try whispering to them with [white]\"/msg <player> <message>\"");
            }
        },
    }, trail: {
        args: ['type:string?', 'color:string?'],
        description: 'Use command to see options and toggle trail on/off.',
        perm: commands_1.Perm.none,
        handler: function (_a) {
            var args = _a.args, sender = _a.sender, output = _a.output, outputFail = _a.outputFail, outputSuccess = _a.outputSuccess;
            //overload 1: type not specified
            if (!args.type) {
                if (sender.trail != null) {
                    sender.trail = null;
                    outputSuccess("Trail turned off.");
                }
                else {
                    output("Available types:[yellow]\n1 - fluxVapor (flowing smoke, long lasting)\n2 - overclocked (diamonds)\n3 - overdriven (squares)\n4 - shieldBreak (smol)\n5 - upgradeCoreBloom (square, long lasting, only orange)\n6 - electrified (tiny spiratic diamonds, but only green)\n7 - unitDust (same as above but round, and can change colors)\n[white]Usage: [orange]/trail [lightgrey]<type> [color/#hex/r,g,b]");
                }
                return;
            }
            //overload 2: type specified
            var trailTypes = {
                "1": 'fluxVapor',
                "2": 'overclocked',
                "3": 'overdriven',
                "4": 'shieldBreak',
                "5": 'upgradeCoreBloom',
                "6": 'electrified',
                "7": 'unitDust',
            };
            var selectedType = trailTypes[args.type];
            if (!selectedType) {
                if (Object.values(trailTypes).includes(args.type))
                    (0, commands_1.fail)("Please use the numeric id to refer to a trail type.");
                else
                    (0, commands_1.fail)("\"".concat(args.type, "\" is not an available type."));
            }
            var color = args.color ? (0, utils_1.getColor)(args.color) : Color.white;
            if (color instanceof Color) {
                sender.trail = {
                    type: selectedType,
                    color: color,
                };
            }
            else {
                outputFail("[scarlet]Sorry, \"".concat(args.color, "\" is not a valid color.\n[yellow]Color can be in the following formats:\n[pink]pink [white]| [gray]#696969 [white]| 255,0,0."));
            }
        },
    }, ohno: (0, commands_1.command)({
        args: [],
        description: 'Spawns an ohno.',
        perm: commands_1.Perm.spawnOhnos,
        init: function () {
            var Ohnos = {
                enabled: true,
                ohnos: new Array(),
                lastSpawned: 0,
                makeOhno: function (team, x, y) {
                    var ohno = UnitTypes.atrax.create(team);
                    ohno.set(x, y);
                    ohno.type = UnitTypes.alpha;
                    ohno.apply(StatusEffects.disarmed, Number.MAX_SAFE_INTEGER);
                    ohno.resetController(); //does this work?
                    ohno.add();
                    this.ohnos.push(ohno);
                    this.lastSpawned = Date.now();
                    return ohno;
                },
                canSpawn: function (player) {
                    if (!this.enabled)
                        return "Ohnos have been temporarily disabled.";
                    if (!player.connected() || !player.unit().added || player.unit().dead)
                        return "You cannot spawn ohnos while dead.";
                    this.updateLength();
                    if (this.ohnos.length >= (Groups.player.size() + 1))
                        return "Sorry, the max number of ohno units has been reached.";
                    if ((0, utils_1.nearbyEnemyTile)(player.unit(), 6) != null)
                        return "Too close to an enemy tile!";
                    // if(Date.now() - this.lastSpawned < 3000) return `This command is currently on cooldown.`;
                    return true;
                },
                updateLength: function () {
                    this.ohnos = this.ohnos.filter(function (o) { return o && o.isAdded() && !o.dead; });
                },
                killAll: function () {
                    this.ohnos.forEach(function (ohno) { var _a; return (_a = ohno === null || ohno === void 0 ? void 0 : ohno.kill) === null || _a === void 0 ? void 0 : _a.call(ohno); });
                    this.ohnos = [];
                },
                amount: function () {
                    return this.ohnos.length;
                },
            };
            Events.on(EventType.GameOverEvent, function (e) {
                Ohnos.killAll();
            });
            return Ohnos;
        },
        handler: function (_a) {
            var sender = _a.sender, outputFail = _a.outputFail, Ohnos = _a.data;
            var canSpawn = Ohnos.canSpawn(sender);
            if (canSpawn === true) {
                Ohnos.makeOhno(sender.team(), sender.player.x, sender.player.y);
            }
            else {
                outputFail(canSpawn);
            }
        },
    }), ranks: {
        args: [],
        description: 'Displays information about all ranks.',
        perm: commands_1.Perm.none,
        handler: function (_a) {
            var output = _a.output;
            output("List of ranks:\n" +
                Object.values(ranks_1.Rank.ranks)
                    .map(function (rank) { return "".concat(rank.prefix, " ").concat(rank.color).concat((0, utils_1.capitalizeText)(rank.name), "[]: ").concat(rank.color).concat(rank.description, "[]\n"); })
                    .join("") +
                "List of flags:\n" +
                Object.values(ranks_1.RoleFlag.flags)
                    .map(function (flag) { return "".concat(flag.prefix, " ").concat(flag.color).concat((0, utils_1.capitalizeText)(flag.name), "[]: ").concat(flag.color).concat(flag.description, "[]\n"); })
                    .join(""));
        },
    }, rules: {
        args: ['player:player?'],
        description: 'Displays the server rules.',
        perm: commands_1.Perm.none,
        handler: function (_a) {
            var _b;
            var args = _a.args, sender = _a.sender, outputSuccess = _a.outputSuccess, f = _a.f;
            var target = (_b = args.player) !== null && _b !== void 0 ? _b : sender;
            if (target !== sender) {
                if (!sender.hasPerm("warn"))
                    (0, commands_1.fail)("You do not have permission to show rules to other players.");
                if (target.hasPerm("blockTrolling"))
                    (0, commands_1.fail)(f(templateObject_8 || (templateObject_8 = __makeTemplateObject(["Player ", " is insufficiently trollable."], ["Player ", " is insufficiently trollable."])), args.player));
            }
            (0, menus_1.menu)("Rules for [#0000ff]>|||> FISH [white]servers", config_1.rules.join("\n\n"), ["I agree to abide by these rules", "No"], target, function (_a) {
                var option = _a.option;
                if (option == "No")
                    target.player.kick("You must agree to the rules to play on this server. Rejoin to agree to the rules.", 1);
            }, false);
            if (target !== sender)
                outputSuccess(f(templateObject_9 || (templateObject_9 = __makeTemplateObject(["Reminded ", " of the rules."], ["Reminded ", " of the rules."])), target));
        },
    }, void: {
        args: ["player:player?"],
        description: 'Warns other players about power voids.',
        perm: commands_1.Perm.play,
        handler: function (_a) {
            var args = _a.args, sender = _a.sender, lastUsedSuccessfullySender = _a.lastUsedSuccessfullySender, outputSuccess = _a.outputSuccess, f = _a.f;
            if (args.player) {
                if (Date.now() - lastUsedSuccessfullySender < 20000)
                    (0, commands_1.fail)("This command was used recently and is on cooldown.");
                if (!sender.hasPerm("trusted"))
                    (0, commands_1.fail)("You do not have permission to show popups to other players, please run /void with no arguments to send a chat message to everyone.");
                (0, menus_1.menu)("\uf83f [scarlet]WARNING[] \uf83f", "[white]Don't break the Power Void (\uF83F), it's a trap!\nPower voids disable anything they are connected to.\nIf you break it, [scarlet]you will get attacked[] by enemy units.\nPlease stop attacking and [lime]build defenses[] first!", ["I understand"], args.player);
                (0, utils_1.logAction)("showed void warning", sender, args.player);
                outputSuccess(f(templateObject_10 || (templateObject_10 = __makeTemplateObject(["Warned ", " about power voids with a popup message."], ["Warned ", " about power voids with a popup message."])), args.player));
            }
            else {
                if (Date.now() - lastUsedSuccessfullySender < 10000)
                    (0, commands_1.fail)("This command was used recently and is on cooldown.");
                Call.sendMessage("[white]Don't break the Power Void (\uF83F), it's a trap!\nPower voids disable anything they are connected to. If you break it, [scarlet]you will get attacked[] by enemy units.\nPlease stop attacking and [lime]build defenses[] first!");
            }
        },
    }, team: {
        args: ['team:team', 'target:player?'],
        description: 'Changes the team of a player.',
        perm: commands_1.Perm.changeTeam,
        handler: function (_a) {
            var _b, _c;
            var args = _a.args, sender = _a.sender, outputSuccess = _a.outputSuccess, f = _a.f;
            (_b = args.target) !== null && _b !== void 0 ? _b : (args.target = sender);
            if (!sender.canModerate(args.target, true))
                (0, commands_1.fail)(f(templateObject_11 || (templateObject_11 = __makeTemplateObject(["You do not have permission to change the team of ", ""], ["You do not have permission to change the team of ", ""])), args.target));
            if (!sender.hasPerm("changeTeamExternal") && args.team.data().cores.size <= 0)
                (0, commands_1.fail)("You do not have permission to change to a team with no cores.");
            if (!sender.hasPerm("changeTeamExternal") && (!sender.player.dead() && !((_c = sender.unit()) === null || _c === void 0 ? void 0 : _c.spawnedByCore)))
                args.target.forceRespawn();
            args.target.player.team(args.team);
            if (args.target === sender)
                outputSuccess(f(templateObject_12 || (templateObject_12 = __makeTemplateObject(["Changed your team to ", "."], ["Changed your team to ", "."])), args.team));
            else
                outputSuccess(f(templateObject_13 || (templateObject_13 = __makeTemplateObject(["Changed team of player ", " to ", "."], ["Changed team of player ", " to ", "."])), args.target, args.team));
        },
    }, rank: {
        args: ['player:player'],
        description: 'Displays the rank of a player.',
        perm: commands_1.Perm.none,
        handler: function (_a) {
            var args = _a.args, output = _a.output, f = _a.f;
            output(f(templateObject_14 || (templateObject_14 = __makeTemplateObject(["Player ", "'s rank is ", "."], ["Player ", "'s rank is ", "."])), args.player, args.player.rank));
        },
    }, forcertv: {
        args: ["force:boolean?"],
        description: 'Force skip to the next map.',
        perm: commands_1.Perm.admin,
        handler: function (_a) {
            var args = _a.args, sender = _a.sender, allCommands = _a.allCommands;
            if (args.force === false) {
                Call.sendMessage("RTV: [red] votes cleared by admin [yellow]".concat(sender.name, "[red]."));
                allCommands.rtv.data.votes.clear();
            }
            else {
                Call.sendMessage("RTV: [green] vote was forced by admin [yellow]".concat(sender.name, "[green], changing map."));
                (0, utils_1.neutralGameover)();
            }
        }
    }, forcevnw: {
        args: ["force:boolean?"],
        description: 'Force skip to the next wave.',
        perm: commands_1.Perm.admin,
        handler: function (_a) {
            var allCommands = _a.allCommands, sender = _a.sender, args = _a.args;
            if (allCommands.vnw.data.target == 0)
                (0, commands_1.fail)("No /VNW vote is in session.");
            if (args.force === false) {
                Call.sendMessage("VNW: [red] vote canceled by admin [yellow]".concat(sender.name, "[red]."));
                allCommands.vnw.data.resetVote();
            }
            else {
                Call.sendMessage("VNW: [green] vote was forced by admin [yellow]".concat(sender.name, "[green]"));
                allCommands.vnw.data.spawnWave();
            }
        },
    }, vnw: (0, commands_1.command)(function () {
        var votes = new Map();
        var voteDuration = 1.5 * 60000;
        var goal = 5; // how many more votes "yes" than "no" are needed (same as vc) when the server is ful;
        var target = 0; // the ideal amount of waves to skip. equal to zero when no vote is going on
        var timer;
        function scoreVotes() {
            var scoredVote = 0;
            votes.forEach(function (vote) { return (scoredVote += vote); });
            return scoredVote;
        }
        function getGoal() {
            if (Groups.player.size() >= goal) {
                return (goal);
            }
            return (Groups.player.size());
        }
        function checkVotes() {
            if (target == 0)
                return;
            if (scoreVotes() >= getGoal()) {
                spawnWave();
            }
        }
        function spawnWave() {
            //my got this is a abomination, but its reliable
            var saveWaveTime = Vars.state.wavetime;
            var saveWaveEnemies = Vars.state.rules.waitEnemies;
            Core.app.post(function () {
                Vars.state.wave += target - 1;
                Vars.state.wavetime = 1;
                Vars.state.rules.waitEnemies = false;
                Core.app.post(function () {
                    Core.app.post(function () {
                        Vars.state.wavetime = saveWaveTime;
                        Vars.state.rules.waitEnemies = saveWaveEnemies;
                    });
                });
            });
            Call.sendMessage('VNW: [green] vote passed, skipping to next wave.');
            resetVote();
        }
        function resetVote() {
            votes.clear();
            timer.cancel();
            target = 0;
        }
        function startVote(waves) {
            target = waves;
            timer = Timer.schedule(endVote, voteDuration / 1000);
        }
        function addVote(player, vote) {
            if (player.ranksAtLeast('trusted'))
                vote *= 2; // double weight on trusted votes.
            votes.set(player, vote);
            if (vote > 0) {
                Call.sendMessage("[white]VNW: ".concat(player.name, "[white] has voted to skip ").concat(target, " wave(s). (").concat(scoreVotes(), "/").concat(getGoal(), ")"));
            }
            else {
                Call.sendMessage("[white]VNW: ".concat(player.name, "[white] has voted against skipping ").concat(target, " wave(s). (").concat(scoreVotes(), "/").concat(getGoal(), ")"));
            }
            checkVotes();
        }
        function endVote() {
            votes.clear();
            Call.sendMessage('VNW: [red] vote failed.');
            target = 0;
        }
        Events.on(EventType.PlayerLeave, function (_a) {
            var player = _a.player;
            if (votes.has(player)) {
                votes.delete(player);
                Call.sendMessage("VNW: [accent]".concat(player.name, "[] left, (").concat(scoreVotes(), "/").concat(getGoal(), ")"));
                checkVotes();
            }
        });
        Events.on(EventType.GameOverEvent, function () { return votes.clear(); });
        return {
            args: ["vote:boolean?"], // will cast "yes" and "no" ... thats good.
            description: "Vote to start the next wave.",
            perm: commands_1.Perm.play,
            data: { votes: votes, target: target, spawnWave: spawnWave, resetVote: resetVote },
            handler: function (_a) {
                var _b;
                var args = _a.args, sender = _a.sender, lastUsedSuccessfullySender = _a.lastUsedSuccessfullySender;
                if (!config_1.Mode.survival())
                    (0, commands_1.fail)("You can only skip waves on survival.");
                if (Vars.state.gameOver)
                    (0, commands_1.fail)("This game is already over.");
                if (Date.now() - lastUsedSuccessfullySender < 1000)
                    (0, commands_1.fail)("This command was run recently and is on cooldown.");
                if (votes.size == 0) {
                    (0, menus_1.menu)("Start a Next Wave Vote", "Select the amount of waves you would like to skip, or click \"Cancel\" to abort.", ["1 Wave", "5 Waves", "10 Waves"], sender, function (_a) {
                        var option = _a.option;
                        switch (option) {
                            case "1 Wave": {
                                startVote(1);
                                addVote(sender, 1);
                                break;
                            }
                            case "5 Waves": {
                                startVote(5);
                                addVote(sender, 1);
                                break;
                            }
                            case "10 Waves": {
                                startVote(10);
                                addVote(sender, 1);
                                break;
                            }
                        }
                    });
                }
                else {
                    (_b = args.vote) !== null && _b !== void 0 ? _b : (args.vote = true); // keep old command behavior
                    addVote(sender, (args.vote) ? (1) : (-1));
                }
            }
        };
    }), rtv: (0, commands_1.command)(function () {
        var votes = new Set();
        var ratio = 0.5;
        Events.on(EventType.PlayerLeave, function (_a) {
            var player = _a.player;
            if (votes.has(player.uuid())) {
                votes.delete(player.uuid());
                var currentVotes = votes.size;
                var requiredVotes = Math.ceil(ratio * Groups.player.size());
                Call.sendMessage("RTV: [accent]".concat(player.name, "[] left, [green]").concat(currentVotes, "[] votes, [green]").concat(requiredVotes, "[] required"));
                if (currentVotes >= requiredVotes) {
                    Call.sendMessage('RTV: [green] vote passed, changing map.');
                    (0, utils_1.neutralGameover)();
                }
            }
        });
        Events.on(EventType.GameOverEvent, function () { return votes.clear(); });
        return {
            args: [],
            description: 'Rock the vote to change map',
            perm: commands_1.Perm.play,
            data: { votes: votes },
            handler: function (_a) {
                var sender = _a.sender, lastUsedSuccessfullySender = _a.lastUsedSuccessfullySender;
                if (Vars.state.gameOver)
                    (0, commands_1.fail)("This map is already finished, cannot RTV. Wait until the next map loads.");
                if (Date.now() - lastUsedSuccessfullySender < 3000)
                    (0, commands_1.fail)("This command was run recently and is on cooldown.");
                votes.add(sender.uuid);
                var currentVotes = votes.size;
                var requiredVotes = Math.ceil(ratio * Groups.player.size());
                Call.sendMessage("RTV: [accent]".concat(sender.cleanedName, "[] wants to change the map, [green]").concat(currentVotes, "[] votes, [green]").concat(requiredVotes, "[] required"));
                if (currentVotes >= requiredVotes) {
                    Call.sendMessage('RTV: [green] vote passed, changing map.');
                    (0, utils_1.neutralGameover)();
                }
            }
        };
    }), 
    // votekick: {
    //	 args: ["target:player"],
    //	 description: "Starts a vote to kick a player.",
    //	 perm: Perm.play,
    //	 handler({args, sender}){
    // 		if(votekickmanager.currentSession) fail(`There is already a votekick in progress.`);
    // 		votekickmanager.start({
    // 			initiator: sender,
    // 			target: args.player
    // 		});
    //	 }
    // },
    // vote: {
    //	 args: ["vote:boolean"],
    //	 description: "Use /votekick instead.",
    //	 perm: Perm.play,
    //	 handler({sender, args}){
    // 		votekickmanager.handleVote(sender, args ? 1 : -1);
    //	 }
    // },
    forcenextmap: {
        args: ["map:map"],
        description: 'Override the next map in queue.',
        perm: commands_1.Perm.admin,
        handler: function (_a) {
            var allCommands = _a.allCommands, args = _a.args, sender = _a.sender;
            Vars.maps.setNextMapOverride(args.map);
            if (allCommands.nextmap.data.voteEndTime() > -1) {
                //Cancel /nextmap vote if it's ongoing
                allCommands.nextmap.data.cancelVote();
                Call.sendMessage("[red]Admin ".concat(sender.name, "[red] has cancelled the vote. The next map will be [yellow]").concat(args.map.name(), "."));
            }
        },
    }, maps: {
        args: [],
        description: 'Lists the available maps.',
        perm: commands_1.Perm.none,
        handler: function (_a) {
            var output = _a.output;
            output("[yellow]Use [white]/nextmap [lightgray]<map name> [yellow]to vote on a map.\n\n[blue]Available maps:\n_________________________\n".concat(Vars.maps.customMaps().toArray().map(function (map, i) {
                return "[white]".concat(i + 1, " - [yellow]").concat(map.name());
            }).join("\n")));
        }
    }, nextmap: (0, commands_1.command)(function () {
        var votes = new Map();
        var voteEndTime = -1;
        var voteDuration = 1.5 * 60000; // 1.5 mins
        var task = null;
        function resetVotes() {
            votes.clear();
            voteEndTime = -1;
        }
        /** Must be called only if there is an ongoing vote. */
        function cancelVote() {
            resetVotes();
            task.cancel();
        }
        function getMapData() {
            return __spreadArray([], __read(votes.values()), false).reduce(function (acc, map) { return (acc.increment(map), acc); }, new ObjectIntMap()).entries().toArray();
        }
        function showVotes() {
            Call.sendMessage("[green]Current votes:\n------------------------------\n".concat(getMapData().map(function (_a) {
                var map = _a.key, votes = _a.value;
                return "[cyan]".concat(map.name(), "[yellow]: ").concat(votes);
            }).toString("\n")));
        }
        function startVote() {
            voteEndTime = Date.now() + voteDuration;
            task = Timer.schedule(endVote, voteDuration / 1000);
        }
        function endVote() {
            if (voteEndTime == -1)
                return; //aborted somehow
            if (votes.size == 0)
                return; //no votes?
            var mapData = getMapData();
            var highestVoteCount = mapData.max(floatf(function (e) { return e.value; })).value;
            var highestVotedMaps = mapData.select(function (e) { return e.value == highestVoteCount; });
            var winner;
            if (highestVotedMaps.size > 1) {
                winner = highestVotedMaps.random().key;
                Call.sendMessage("[green]There was a tie between the following maps: \n\t\t".concat(highestVotedMaps.map(function (_a) {
                    var map = _a.key, votes = _a.value;
                    return "[cyan]".concat(map.name(), "[yellow]: ").concat(votes);
                }).toString("\n"), "\n\t\t[green]Picking random winner: [yellow]").concat(winner.name()));
            }
            else {
                winner = highestVotedMaps.get(0).key;
                Call.sendMessage("[green]Map voting complete! The next map will be [yellow]".concat(winner.name(), " [green]with [yellow]").concat(highestVoteCount, "[green] votes."));
            }
            Vars.maps.setNextMapOverride(winner);
            resetVotes();
        }
        Events.on(EventType.GameOverEvent, resetVotes);
        Events.on(EventType.ServerLoadEvent, resetVotes);
        return {
            args: ['map:map'],
            description: 'Allows you to vote for the next map. Use /maps to see all available maps.',
            perm: commands_1.Perm.play,
            data: { votes: votes, voteEndTime: function () { return voteEndTime; }, resetVotes: resetVotes, endVote: endVote, cancelVote: cancelVote },
            handler: function (_a) {
                var map = _a.args.map, sender = _a.sender, lastUsedSuccessfullySender = _a.lastUsedSuccessfullySender;
                if (config_1.Mode.hexed())
                    (0, commands_1.fail)("This command is disabled in Hexed.");
                if (votes.get(sender))
                    (0, commands_1.fail)("You have already voted.");
                if (Date.now() - lastUsedSuccessfullySender < 10000)
                    (0, commands_1.fail)("This command was run recently and is on cooldown.");
                votes.set(sender, map);
                if (voteEndTime == -1) {
                    startVote();
                    Call.sendMessage("[cyan]Next Map Vote: ".concat(sender.name, "[cyan] started a map vote, and voted for [yellow]").concat(map.name(), "[cyan]. Use /nextmap ").concat(map.plainName(), " to add your vote!"));
                }
                else {
                    Call.sendMessage("[cyan]Next Map Vote: ".concat(sender.name, "[cyan] voted for [yellow]").concat(map.name(), "[cyan]. Time left: [scarlet]").concat((0, utils_1.formatTimeRelative)(voteEndTime, true)));
                    showVotes();
                }
            }
        };
    }), stats: {
        args: ["target:player"],
        perm: commands_1.Perm.none,
        description: "Views a player's stats.",
        handler: function (_a) {
            var target = _a.args.target, output = _a.output, f = _a.f;
            output(f(templateObject_15 || (templateObject_15 = __makeTemplateObject(["[accent]Statistics for player ", ":\n(note: we started recording statistics on 22 Jan 2024)\n[white]--------------[]\nBlocks broken: ", "\nBlocks placed: ", "\nChat messages sent: ", "\nGames finished: ", "\nWin rate: ", ""], ["[accent]\\\nStatistics for player ", ":\n(note: we started recording statistics on 22 Jan 2024)\n[white]--------------[]\nBlocks broken: ", "\nBlocks placed: ", "\nChat messages sent: ", "\nGames finished: ", "\nWin rate: ", ""])), target, target.stats.blocksBroken, target.stats.blocksPlaced, target.stats.chatMessagesSent, target.stats.gamesFinished, target.stats.gamesWon / target.stats.gamesFinished));
        }
    } }));
var templateObject_1, templateObject_2, templateObject_3, templateObject_4, templateObject_5, templateObject_6, templateObject_7, templateObject_8, templateObject_9, templateObject_10, templateObject_11, templateObject_12, templateObject_13, templateObject_14, templateObject_15;
