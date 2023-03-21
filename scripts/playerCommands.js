"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.commands = void 0;
var commands_1 = require("./commands");
var ohno_1 = require("./ohno");
var players_1 = require("./players");
var utils_1 = require("./utils");
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
        if (fishP.admin || fishP.mod) {
            pl.sendMessage(message);
        }
    });
}
;
var recentWhispers = {};
exports.commands = {
    unpause: {
        args: [],
        description: "Unpauses the game.",
        level: commands_1.PermissionsLevel.notGriefer,
        handler: function () {
            Core.app.post(function () { return Vars.state.set(GameState.State.playing); });
        }
    },
    tp: {
        args: ["player:player"],
        description: "Teleport to another player.",
        level: commands_1.PermissionsLevel.notGriefer,
        handler: function (_a) {
            var _b;
            var args = _a.args, sender = _a.sender, outputFail = _a.outputFail;
            if ((_b = sender.player.unit()) === null || _b === void 0 ? void 0 : _b.spawnedByCore) {
                teleportPlayer(sender, args.player);
            }
            else {
                outputFail("Can only teleport while in a core unit.");
            }
        }
    },
    clean: {
        args: [],
        description: "Removes all boulders from the map.",
        level: commands_1.PermissionsLevel.notGriefer,
        handler: function (_a) {
            var sender = _a.sender, outputSuccess = _a.outputSuccess, outputFail = _a.outputFail;
            if (Cleaner.clean(sender.player)) {
                outputSuccess("\u2714 Cleared the map of boulders.");
            }
            else {
                outputFail("This command was run recently and is on cooldown.");
            }
        }
    },
    kill: {
        args: [],
        description: "Commits die.",
        level: commands_1.PermissionsLevel.notGriefer,
        handler: function (_a) {
            var _b;
            var sender = _a.sender;
            (_b = sender.player.unit()) === null || _b === void 0 ? void 0 : _b.kill();
        }
    },
    discord: {
        args: [],
        description: "Takes you to our discord.",
        level: commands_1.PermissionsLevel.all,
        handler: function (_a) {
            var sender = _a.sender;
            Call.openURI(sender.player.con, 'https://discord.gg/VpzcYSQ33Y');
        }
    },
    tilelog: {
        args: [],
        description: "Checks the history of a tile.",
        level: commands_1.PermissionsLevel.all,
        handler: function (_a) {
            var sender = _a.sender, output = _a.output;
            sender.tilelog = true;
            output("\n \n \n===>[yellow]Click on a tile to check its recent history...\n \n \n ");
        }
    },
    afk: {
        args: [],
        description: "Toggles your afk status.",
        level: commands_1.PermissionsLevel.all,
        handler: function (_a) {
            var sender = _a.sender, outputSuccess = _a.outputSuccess;
            sender.afk = !sender.afk;
            sender.updateName();
            if (sender.afk) {
                outputSuccess("You are marked as AFK.");
            }
            else {
                outputSuccess("You are no longer marked as AFK.");
            }
        }
    },
    tileid: {
        args: [],
        description: "Checks id of a tile.",
        level: commands_1.PermissionsLevel.all,
        handler: function (_a) {
            var sender = _a.sender, outputSuccess = _a.outputSuccess;
            sender.tileId = true;
            outputSuccess("Click a tile to see its id.");
        }
    },
    attack: {
        args: [],
        description: "Switches to the attack server.",
        level: commands_1.PermissionsLevel.all,
        handler: function (_a) {
            var sender = _a.sender;
            Call.sendMessage("".concat(sender.name, "[magenta] has gone to the attack server. Use [cyan]/attack [magenta]to join them!"));
            Call.connect(sender.player.con, '162.248.100.98', '6567');
        }
    },
    survival: {
        args: [],
        description: "Switches to the survival server.",
        level: commands_1.PermissionsLevel.all,
        handler: function (_a) {
            var sender = _a.sender;
            Call.sendMessage("".concat(sender.name, "[magenta] has gone to the survival server. Use [cyan]/survival [magenta]to join them!"));
            Call.connect(sender.player.con, '170.187.144.235', '6567');
        }
    },
    s: {
        args: ["message:string"],
        description: "Sends a message to staff only.",
        level: commands_1.PermissionsLevel.all,
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
        level: commands_1.PermissionsLevel.all,
        handler: function (_a) {
            var args = _a.args, sender = _a.sender, outputSuccess = _a.outputSuccess;
            if (sender.watch) {
                outputSuccess("No longer watching a player.");
                sender.watch = false;
            }
            sender.watch = true;
            var stayX = sender.player.unit().x;
            var stayY = sender.player.unit().y;
            var target = args.player.player;
            function watch() {
                if (sender.watch) {
                    // Self.X+(172.5-Self.X)/10
                    Call.setCameraPosition(sender.player.con, target.unit().x, target.unit().y);
                    sender.player.unit().set(stayX, stayY);
                    Timer.schedule(function () { return watch(); }, 0.1, 0.1, 0);
                }
                else {
                    Call.setCameraPosition(sender.player.con, stayX, stayY);
                }
            }
            ;
            watch();
        }
    },
    help: {
        args: ["page:string?"],
        description: "Displays a list of all commands.",
        level: commands_1.PermissionsLevel.all,
        handler: function (_a) {
            var args = _a.args, output = _a.output, outputFail = _a.outputFail;
            //TODO: genericify
            var filter = {
                member: ['pet', 'highlight', 'rainbow', 'bc'],
                mod: ['warn', 'mute', 'kick', 'stop', 'free', 'murder', 'unmuteall', 'history', 'save'],
                admin: ['sus', 'admin', 'mod', 'wave', 'restart', 'forcertv', 'spawn', 'exterminate', 'label', 'member', 'ipban'],
            };
            var normalCommands = [];
            var modCommands = [];
            var adminCommands = [];
            var memberCommands = [];
            Vars.netServer.clientCommands.getCommandList().forEach(function (c) {
                var temp = "/".concat(c.text, " ").concat(c.paramText ? "[white]".concat(c.paramText, " ") : "", "[lightgrey]- ").concat(c.description);
                if (filter.member.includes(c.text))
                    memberCommands.push('[pink]' + temp);
                else if (filter.mod.includes(c.text))
                    modCommands.push('[acid]' + temp);
                else if (filter.admin.includes(c.text))
                    adminCommands.push('[cyan]' + temp);
                else
                    normalCommands.push('[sky]' + temp);
            });
            var chunkedNormalCommands = (0, utils_1.to2DArray)(normalCommands, 15);
            switch (args.page) {
                case "admin":
                    output('[cyan]--Admin commands--\n' + adminCommands.join('\n'));
                    break;
                case "mod":
                    output('[acid]--Mod commands--\n' + modCommands.join('\n'));
                    break;
                case "member":
                    output('[pink]--Member commands--\n' + memberCommands.join('\n'));
                    break;
                case null:
                    output("[sky]--Commands page [lightgrey]1/".concat(chunkedNormalCommands.length, " [sky]--\n").concat(chunkedNormalCommands[0].join('\n')));
                    break;
                default:
                    var pageNumber = Number(args.page);
                    if (chunkedNormalCommands[pageNumber - 1]) {
                        output("[sky]--Commands page [lightgrey]".concat(pageNumber, "/").concat(chunkedNormalCommands.length, "[sky]--\n").concat(chunkedNormalCommands[pageNumber - 1].join("\n")));
                    }
                    else {
                        outputFail("\"".concat(args.page, "\" is an invalid page number."));
                    }
            }
        }
    },
    msg: {
        args: ["player:namedPlayer", "message:string"],
        description: "Send a message to only one player.",
        level: commands_1.PermissionsLevel.all,
        handler: function (_a) {
            var args = _a.args, sender = _a.sender, output = _a.output;
            recentWhispers[args.player.player.uuid()] = sender.player.uuid();
            args.player.player.sendMessage("".concat(args.player.player.name, "[lightgray] whispered:[#0ffffff0] ").concat(args.message));
            output("[#0ffffff0]Message sent to ".concat(args.player.player.name, "[#0ffffff0]."));
        }
    },
    r: {
        args: ["message:string"],
        description: "Reply to the most recent message.",
        level: commands_1.PermissionsLevel.all,
        handler: function (_a) {
            var args = _a.args, sender = _a.sender, output = _a.output, outputFail = _a.outputFail;
            if (recentWhispers[sender.player.uuid()]) {
                var recipient = players_1.FishPlayer.getById(recentWhispers[sender.player.uuid()]);
                if (recipient) {
                    recipient.player.sendMessage("".concat(sender.name, "[lightgray] whispered:[#0ffffff0] ").concat(args.message));
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
    },
    trail: {
        args: ["type:string?", "color:string?"],
        description: 'Use command to see options and toggle trail on/off.',
        level: commands_1.PermissionsLevel.all,
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
    },
    ohno: {
        args: [],
        description: "Spawns an ohno.",
        level: commands_1.PermissionsLevel.notGriefer,
        handler: function (_a) {
            var sender = _a.sender, outputFail = _a.outputFail;
            var canSpawn = ohno_1.Ohnos.canSpawn(sender.player);
            if (canSpawn === true) {
                ohno_1.Ohnos.makeOhno(sender.player.team(), sender.player.x, sender.player.y);
            }
            else {
                outputFail(canSpawn);
            }
        }
    }
};
