"use strict";
/*
Copyright © BalaM314, 2024. All Rights Reserved.
This file contains the main code, which calls other functions and initializes the plugin.
*/
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
var api = require("./api");
var commands = require("./commands");
var commands_1 = require("./commands");
var consoleCommands_1 = require("./consoleCommands");
var globals_1 = require("./globals");
var memberCommands_1 = require("./memberCommands");
var menus = require("./menus");
var packetHandlers_1 = require("./packetHandlers");
var playerCommands_1 = require("./playerCommands");
var players_1 = require("./players");
var staffCommands_1 = require("./staffCommands");
var timers = require("./timers");
var utils_1 = require("./utils");
Events.on(EventType.ConnectionEvent, function (e) {
    if (Vars.netServer.admins.isIPBanned(e.connection.address)) {
        api.getBanned({
            ip: e.connection.address,
        }, function (banned) {
            if (!banned) {
                //If they were previously banned locally, but the API says they aren't banned, then unban them and clear the kick that the outer function already did
                Vars.netServer.admins.unbanPlayerIP(e.connection.address);
                Vars.netServer.admins.kickedIPs.remove(e.connection.address);
            }
        });
    }
});
Events.on(EventType.PlayerConnect, function (e) {
    if (players_1.FishPlayer.shouldKickNewPlayers() && e.player.info.timesJoined == 1) {
        e.player.kick(Packets.KickReason.kick, 3600000);
    }
    players_1.FishPlayer.onPlayerConnect(e.player);
});
Events.on(EventType.PlayerJoin, function (e) {
    players_1.FishPlayer.onPlayerJoin(e.player);
});
Events.on(EventType.PlayerLeave, function (e) {
    players_1.FishPlayer.onPlayerLeave(e.player);
});
Events.on(EventType.ConnectPacketEvent, function (e) {
    players_1.FishPlayer.playersJoinedRecent++;
    globals_1.ipJoins.increment(e.connection.address);
    var info = Vars.netServer.admins.getInfoOptional(e.packet.uuid);
    var underAttack = players_1.FishPlayer.antiBotMode();
    var newPlayer = !info || info.timesJoined < 10;
    var longModName = e.packet.mods.contains(function (str) { return str.length > 50; });
    var veryLongModName = e.packet.mods.contains(function (str) { return str.length > 100; });
    if ((underAttack && e.packet.mods.size > 2) ||
        (underAttack && longModName) ||
        (veryLongModName && (underAttack || newPlayer))) {
        Vars.netServer.admins.blacklistDos(e.connection.address);
        e.connection.kicked = true;
        players_1.FishPlayer.onBotWhack();
        Log.info("&yAntibot killed connection ".concat(e.connection.address, " because ").concat(veryLongModName ? "very long mod name" : longModName ? "long mod name" : "it had mods while under attack"));
        return;
    }
    if (globals_1.ipJoins.get(e.connection.address) >= ((underAttack || veryLongModName) ? 3 : (newPlayer || longModName) ? 7 : 15)) {
        Vars.netServer.admins.blacklistDos(e.connection.address);
        e.connection.kicked = true;
        players_1.FishPlayer.onBotWhack();
        Log.info("&yAntibot killed connection ".concat(e.connection.address, " due to too many connections"));
        return;
    }
    /*if(e.packet.name.includes("discord.gg/GnEdS9TdV6")){
        Vars.netServer.admins.blacklistDos(e.connection.address);
        e.connection.kicked = true;
        FishPlayer.onBotWhack();
        Log.info(`&yAntibot killed connection ${e.connection.address} due to omni discord link`);
        return;
    }
    if(e.packet.name.includes("счастливого 2024 года!")){
        Vars.netServer.admins.blacklistDos(e.connection.address);
        e.connection.kicked = true;
        FishPlayer.onBotWhack();
        Log.info(`&yAntibot killed connection ${e.connection.address} due to known bad name`);
        return;
    }*/
    if (Vars.netServer.admins.isDosBlacklisted(e.connection.address)) {
        //threading moment, i think
        e.connection.kicked = true;
        return;
    }
    api.getBanned({
        ip: e.connection.address,
        uuid: e.packet.uuid
    }, function (banned) {
        if (banned) {
            Log.info("&lrSynced ban of ".concat(e.packet.uuid, "/").concat(e.connection.address, "."));
            e.connection.kick(Packets.KickReason.banned, 1);
            Vars.netServer.admins.banPlayerIP(e.connection.address);
            Vars.netServer.admins.banPlayerID(e.packet.uuid);
        }
        else {
            Vars.netServer.admins.unbanPlayerIP(e.connection.address);
            Vars.netServer.admins.unbanPlayerID(e.packet.uuid);
        }
    });
});
Events.on(EventType.UnitChangeEvent, function (e) {
    players_1.FishPlayer.onUnitChange(e.player, e.unit);
});
Events.on(EventType.ContentInitEvent, function () {
    //Unhide latum and renale
    UnitTypes.latum.hidden = false;
    UnitTypes.renale.hidden = false;
});
Events.on(EventType.PlayerChatEvent, function (e) { return (0, utils_1.processChat)(e.player, e.message, true); });
Events.on(EventType.ServerLoadEvent, function (e) {
    var clientHandler = Vars.netServer.clientCommands;
    var serverHandler = ServerControl.instance.handler;
    players_1.FishPlayer.loadAll();
    timers.initializeTimers();
    menus.registerListeners();
    //Cap delta
    Time.setDeltaProvider(function () { return Math.min(Core.graphics.getDeltaTime() * 60, 10); });
    // Mute muted players
    Vars.netServer.admins.addChatFilter(function (player, message) { return (0, utils_1.processChat)(player, message); });
    // Action filters
    Vars.netServer.admins.addActionFilter(function (action) {
        var _a, _b;
        var player = action.player;
        var fishP = players_1.FishPlayer.get(player);
        //prevent stopped players from doing anything other than deposit items.
        if (!fishP.hasPerm("play")) {
            action.player.sendMessage('[scarlet]\u26A0 [yellow]You are stopped, you cant perfom this action.');
            return false;
        }
        else {
            if (action.type === Administration.ActionType.pickupBlock) {
                (0, utils_1.addToTileHistory)({
                    pos: "".concat(action.tile.x, ",").concat(action.tile.y),
                    uuid: action.player.uuid(),
                    action: "picked up",
                    type: (_b = (_a = action.tile.block()) === null || _a === void 0 ? void 0 : _a.name) !== null && _b !== void 0 ? _b : "nothing",
                });
            }
            return true;
        }
    });
    commands.register(staffCommands_1.commands, clientHandler, serverHandler);
    commands.register(playerCommands_1.commands, clientHandler, serverHandler);
    commands.register(memberCommands_1.commands, clientHandler, serverHandler);
    commands.register(packetHandlers_1.commands, clientHandler, serverHandler);
    commands.registerConsole(consoleCommands_1.commands, serverHandler);
    (0, packetHandlers_1.loadPacketHandlers)();
    commands.initialize();
});
// Keeps track of any action performed on a tile for use in tilelog.
Events.on(EventType.BlockBuildBeginEvent, utils_1.addToTileHistory);
Events.on(EventType.BuildRotateEvent, utils_1.addToTileHistory);
Events.on(EventType.ConfigEvent, utils_1.addToTileHistory);
Events.on(EventType.PickupEvent, utils_1.addToTileHistory);
Events.on(EventType.PayloadDropEvent, utils_1.addToTileHistory);
Events.on(EventType.UnitDestroyEvent, utils_1.addToTileHistory);
Events.on(EventType.BlockDestroyEvent, utils_1.addToTileHistory);
Events.on(EventType.TapEvent, commands_1.handleTapEvent);
Events.on(EventType.GameOverEvent, function (e) {
    var e_1, _a;
    try {
        for (var _b = __values(Object.keys(globals_1.tileHistory)), _c = _b.next(); !_c.done; _c = _b.next()) {
            var key = _c.value;
            //clear tilelog
            globals_1.tileHistory[key] = null;
            delete globals_1.tileHistory[key];
        }
    }
    catch (e_1_1) { e_1 = { error: e_1_1 }; }
    finally {
        try {
            if (_c && !_c.done && (_a = _b.return)) _a.call(_b);
        }
        finally { if (e_1) throw e_1.error; }
    }
    if (globals_1.fishState.restartQueued) {
        //restart
        Call.sendMessage("[accent]---[[[coral]+++[]]---\n[accent]Server restart imminent. [green]We'll be back after 15 seconds.[]\n[accent]---[[[coral]+++[]]---");
        (0, utils_1.serverRestartLoop)(20);
    }
    players_1.FishPlayer.onGameOver(e.winner);
});
Events.on(EventType.PlayerChatEvent, function (e) {
    players_1.FishPlayer.onPlayerChat(e.player, e.message);
});
Events.on(EventType.DisposeEvent, function (e) {
    players_1.FishPlayer.saveAll();
});
