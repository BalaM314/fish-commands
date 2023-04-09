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
var commands_1 = require("./commands");
var ohno_1 = require("./ohno");
var players_1 = require("./players");
var utils_1 = require("./utils");
var config_1 = require("./config");
function teleportPlayer(player, to) {
    player.unit().set(to.unit().x, to.unit().y);
    Call.setPosition(player.con, to.unit().x, to.unit().y);
    Call.setCameraPosition(player.con, to.unit().x, to.unit().y);
}
var Cleaner = {
    lastCleaned: 0,
    cooldown: 10000,
    clean: function (user) {
        if (Time.millis() - this.lastCleaned < this.cooldown)
            return false;
        this.lastCleaned = Time.millis();
        Timer.schedule(function () {
            Call.sound(user.con, Sounds.rockBreak, 1, 1, 0);
        }, 0, 0.05, 10);
        Vars.world.tiles.eachTile(function (t) {
            if ([
                107, 105, 109, 106, 111, 108, 112, 117, 115, 116, 110, 125, 124, 103, 113, 114, 122, 123,
            ].includes(t.block().id)) {
                t.setNet(Blocks.air, Team.sharded, 0);
            }
        });
        return true;
    },
};
function messageStaff(name, msg) {
    var message = "[gray]<[cyan]staff[gray]>[white]".concat(name, "[green]: [cyan]").concat(msg);
    Groups.player.forEach(function (pl) {
        var fishP = players_1.FishPlayer.get(pl);
        if (commands_1.Perm.mod.check(fishP)) {
            pl.sendMessage(message);
        }
    });
}
;
var recentWhispers = {};
exports.commands = __assign(__assign({ unpause: {
        args: [],
        description: "Unpauses the game.",
        perm: commands_1.Perm.notGriefer,
        handler: function () {
            Core.app.post(function () { return Vars.state.set(GameState.State.playing); });
        }
    }, tp: {
        args: ["player:player"],
        description: "Teleport to another player.",
        perm: commands_1.Perm.notGriefer,
        handler: function (_a) {
            var _b;
            var args = _a.args, sender = _a.sender, outputFail = _a.outputFail;
            if ((_b = sender.unit()) === null || _b === void 0 ? void 0 : _b.spawnedByCore) {
                teleportPlayer(sender.player, args.player.player);
            }
            else {
                outputFail("Can only teleport while in a core unit.");
            }
        }
    }, clean: {
        args: [],
        description: "Removes all boulders from the map.",
        perm: commands_1.Perm.notGriefer,
        handler: function (_a) {
            var sender = _a.sender, outputSuccess = _a.outputSuccess, outputFail = _a.outputFail;
            if (Cleaner.clean(sender)) {
                outputSuccess("Cleared the map of boulders.");
            }
            else {
                outputFail("This command was run recently and is on cooldown.");
            }
        }
    }, kill: {
        args: [],
        description: "Commits die.",
        perm: commands_1.Perm.notGriefer,
        handler: function (_a) {
            var _b;
            var sender = _a.sender;
            (_b = sender.unit()) === null || _b === void 0 ? void 0 : _b.kill();
        }
    }, discord: {
        args: [],
        description: "Takes you to our discord.",
        perm: commands_1.Perm.all,
        handler: function (_a) {
            var sender = _a.sender;
            Call.openURI(sender.con, 'https://discord.gg/VpzcYSQ33Y');
        }
    }, tilelog: {
        args: [],
        description: "Checks the history of a tile.",
        perm: commands_1.Perm.all,
        handler: function (_a) {
            var sender = _a.sender, output = _a.output;
            sender.tilelog = true;
            output("\n \n \n===>[yellow]Click on a tile to check its recent history...\n \n \n ");
        }
    }, afk: {
        args: [],
        description: "Toggles your afk status.",
        perm: commands_1.Perm.all,
        handler: function (_a) {
            var sender = _a.sender, outputSuccess = _a.outputSuccess;
            sender.afk = !sender.afk;
            sender.updateName();
            if (sender.afk) {
                outputSuccess("You are now marked as AFK.");
            }
            else {
                outputSuccess("You are no longer marked as AFK.");
            }
        }
    }, tileid: {
        args: [],
        description: "Checks id of a tile.",
        perm: commands_1.Perm.all,
        handler: function (_a) {
            var sender = _a.sender, output = _a.output;
            sender.tileId = true;
            output("Click a tile to see its id...");
        }
    } }, Object.fromEntries(Object.entries(config_1.FishServers).map(function (_a) {
    var _b = __read(_a, 2), name = _b[0], data = _b[1];
    return [name, {
            args: [],
            description: "Switches to the ".concat(name, " server."),
            perm: commands_1.Perm.all,
            handler: function (_a) {
                var sender = _a.sender;
                Call.sendMessage("".concat(sender.name, "[magenta] has gone to the ").concat(name, " server. Use [cyan]/").concat(name, " [magenta]to join them!"));
                Call.connect(sender.con, data.ip, data.port);
            }
        }];
}))), { s: {
        args: ["message:string"],
        description: "Sends a message to staff only.",
        perm: commands_1.Perm.all,
        handler: function (_a) {
            var sender = _a.sender, args = _a.args;
            messageStaff(sender.name, args.message);
        }
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
        args: ["player:player?"],
        description: "Watch/unwatch a player.",
        perm: commands_1.Perm.all,
        handler: function (_a) {
            var args = _a.args, sender = _a.sender, outputSuccess = _a.outputSuccess;
            if (sender.watch) {
                outputSuccess("No longer watching a player.");
                sender.watch = false;
            }
            else {
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
        }
    }, help: {
        args: ["name:string?"],
        description: "Displays a list of all commands.",
        perm: commands_1.Perm.all,
        handler: function (_a) {
            var args = _a.args, output = _a.output, outputFail = _a.outputFail, sender = _a.sender, allCommands = _a.allCommands;
            if (args.name && isNaN(parseInt(args.name)) && !["mod", "admin", "member"].includes(args.name)) {
                //name is not a number or a category, therefore it is probably a command name
                if (args.name in allCommands && (!allCommands[args.name].isHidden || allCommands[args.name].perm.check(sender))) {
                    output("Help for command ".concat(args.name, ":\n\t").concat(allCommands[args.name].description, "\n\tPermission required: ").concat(allCommands[args.name].perm.name));
                }
                else {
                    outputFail("Command \"".concat(args.name, "\" does not exist."));
                }
            }
            else {
                var commands_2 = {
                    player: [], mod: [], admin: [], member: []
                };
                Object.entries(allCommands).forEach(function (_a) {
                    var _b = __read(_a, 2), name = _b[0], data = _b[1];
                    return (data.perm === commands_1.Perm.admin ? commands_2.admin :
                        data.perm === commands_1.Perm.mod ? commands_2.mod :
                            data.perm === commands_1.Perm.member ? commands_2.member : commands_2.player).push(name);
                });
                var chunkedPlayerCommands = (0, utils_1.to2DArray)(commands_2.player, 15);
                var formatCommand_1 = function (name, color) { return new utils_1.StringBuilder()
                    .add("[".concat(color, "]/").concat(name))
                    .chunk("[white]".concat(allCommands[name].args.map(commands_1.formatArg).join(" ")))
                    .chunk("[lightgray]- ".concat(allCommands[name].description)); };
                var formatList = function (commandList, color) { return commandList.map(function (c) { return formatCommand_1(c, color); }).join("\n"); };
                switch (args.page) {
                    case "admin":
                        output('[cyan]-- Admin commands --\n' + formatList(commands_2.admin, "cyan"));
                        break;
                    case "mod":
                        output('[acid]-- Mod commands --\n' + formatList(commands_2.mod, "acid"));
                        break;
                    case "member":
                        output('[pink]-- Member commands --\n' + formatList(commands_2.member, "pink"));
                        break;
                    default:
                        var pageNumber = args.page ? parseInt(args.page) - 1 : 0;
                        if (pageNumber in chunkedPlayerCommands) {
                            output("[sky]-- Commands page [lightgrey]".concat(pageNumber, "/").concat(chunkedPlayerCommands.length, "[sky] --") + formatList(chunkedPlayerCommands[pageNumber], "sky"));
                        }
                        else {
                            outputFail("\"".concat(args.page, "\" is an invalid page number."));
                        }
                }
            }
        }
    }, msg: {
        args: ["player:player", "message:string"],
        description: "Send a message to only one player.",
        perm: commands_1.Perm.all,
        handler: function (_a) {
            var args = _a.args, sender = _a.sender, output = _a.output;
            recentWhispers[args.player.uuid()] = sender.uuid();
            args.player.sendMessage("".concat(args.player.player.name, "[lightgray] whispered:[#0ffffff0] ").concat(args.message));
            output("[#0ffffff0]Message sent to ".concat(args.player.player.name, "[#0ffffff0]."));
        }
    }, r: {
        args: ["message:string"],
        description: "Reply to the most recent message.",
        perm: commands_1.Perm.all,
        handler: function (_a) {
            var args = _a.args, sender = _a.sender, output = _a.output, outputFail = _a.outputFail;
            if (recentWhispers[sender.uuid()]) {
                var recipient = players_1.FishPlayer.getById(recentWhispers[sender.uuid()]);
                if (recipient === null || recipient === void 0 ? void 0 : recipient.connected()) {
                    recipient.sendMessage("".concat(sender.name, "[lightgray] whispered:[#0ffffff0] ").concat(args.message));
                    output("[#0ffffff0]Message sent to ".concat(recipient.name, "[#0ffffff0]."));
                }
                else {
                    outputFail("The person who last messaged you doesn't seem to exist anymore. Try whispering to someone with [white]\"/msg <player> <message>\"");
                }
            }
            else {
                outputFail("It doesn't look like someone has messaged you recently. Try whispering to them with [white]\"/msg <player> <message>\"");
            }
        }
    }, trail: {
        args: ["type:string?", "color:string?"],
        description: 'Use command to see options and toggle trail on/off.',
        perm: commands_1.Perm.all,
        handler: function (_a) {
            var args = _a.args, sender = _a.sender, output = _a.output, outputFail = _a.outputFail, outputSuccess = _a.outputSuccess;
            //overload 1: type not specified
            if (!args.type) {
                if (sender.trail != null) {
                    sender.trail = null;
                    outputSuccess("Trail turned off.");
                }
                else {
                    var options = [
                        '1 - fluxVapor (flowing smoke, long lasting)',
                        '2 - overclocked (diamonds)',
                        '3 - overdriven (squares)',
                        '4 - shieldBreak (smol)',
                        '5 - upgradeCoreBloom (square, long lasting, only orange)',
                        '6 - electrified (tiny spiratic diamonds, but only green)',
                        '7 - unitDust (same as above but round, and can change colors)',
                        '[white]Usage: [orange]/trail [lightgrey]<type> [color/#hex/r,g,b]',
                    ];
                    output("Available types:[yellow]\n" + options.join('\n'));
                }
                return;
            }
            //overload 2: type specified
            var trailTypes = {
                1: 'fluxVapor',
                2: 'overclocked',
                3: 'overdriven',
                4: 'shieldBreak',
                5: 'upgradeCoreBloom',
                6: 'electrified',
                7: 'unitDust',
            };
            var selectedType = trailTypes[args.type];
            if (!selectedType) {
                if (Object.values(trailTypes).includes(args.type))
                    outputFail("Please use the numeric id to refer to a trail type.");
                else
                    outputFail("\"".concat(args.type, "\" is not an available type."));
                return;
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
        }
    }, ohno: {
        args: [],
        description: "Spawns an ohno.",
        perm: commands_1.Perm.notGriefer,
        handler: function (_a) {
            var sender = _a.sender, outputFail = _a.outputFail;
            var canSpawn = ohno_1.Ohnos.canSpawn(sender);
            if (canSpawn === true) {
                ohno_1.Ohnos.makeOhno(sender.team(), sender.player.x, sender.player.y);
            }
            else {
                outputFail(canSpawn);
            }
        }
    } });
