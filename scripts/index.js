"use strict";
/**
 * This used to be main.js but was renamed to index.js due to rhino issue
 */
Object.defineProperty(exports, "__esModule", { value: true });
var utils_1 = require("./utils");
var players_1 = require("./players");
var ohno_1 = require("./ohno");
var timers = require("./timers");
var config = require("./config");
var commands = require("./commands");
var menus = require("./menus");
var staffCommands = require("./staffCommands");
var playerCommands = require("./playerCommands");
var memberCommands = require("./memberCommands");
var consoleCommands = require("./consoleCommands");
var tileHistory = {};
Events.on(EventType.PlayerJoin, function (e) {
    players_1.FishPlayer.onPlayerJoin(e.player);
});
Events.on(EventType.UnitChangeEvent, function (e) {
    players_1.FishPlayer.onUnitChange(e.player, e.unit);
});
Events.on(EventType.ContentInitEvent, function () {
    //Unhide latum and renale
    UnitTypes.latum.hidden = false;
    UnitTypes.renale.hidden = false;
});
Events.on(EventType.ServerLoadEvent, function (e) {
    var ActionType = Packages.mindustry.net.Administration.ActionType;
    var clientHandler = Vars.netServer.clientCommands;
    var serverHandler = Core.app.listeners.find(function (l) { return l instanceof Packages.mindustry.server.ServerControl; }).handler;
    players_1.FishPlayer.loadAll();
    timers.initializeTimers();
    menus.registerListeners();
    // Mute muted players
    Vars.netServer.admins.addChatFilter(function (player, text) {
        var fishPlayer = players_1.FishPlayer.get(player);
        if (fishPlayer.muted) {
            player.sendMessage("[gray]<[red]muted[gray]>[white]".concat(player.name, "[green]: [cyan]").concat(text));
            players_1.FishPlayer.messageStaff("[gray]<[red]muted[gray]>[white]".concat(player.name, "[green]: [cyan]").concat(text));
            return null;
        }
        if (fishPlayer.highlight) {
            return fishPlayer.highlight + text;
        }
        return config.bannedWords.some(function (bw) { return text.includes(bw); })
            ? '[#f456f]I really hope everyone is having a fun time :) <3'
            : text;
    });
    // Action filters
    Vars.netServer.admins.addActionFilter(function (action) {
        var player = action.player;
        var fishP = players_1.FishPlayer.get(player);
        //prevent stopped players from doing anything other than deposit items.
        if (fishP.stopped) {
            action.player.sendMessage('[scarlet]⚠ [yellow]You are stopped, you cant perfom this action.');
            return false;
        }
        else {
            if (action.type === ActionType.rotate) {
                addToTileHistory({
                    unit: player.unit(),
                    tile: action.tile,
                    player: player,
                    breaking: null,
                }, 'rotate');
            }
            return true;
        }
    });
    commands.register(staffCommands.commands, clientHandler, serverHandler);
    commands.register(playerCommands.commands, clientHandler, serverHandler);
    commands.register(memberCommands.commands, clientHandler, serverHandler);
    //commands.register(packetHandlers.commands, clientHandler, serverHandler);
    commands.registerConsole(consoleCommands.commands, serverHandler);
    //packetHandlers.loadPacketHandlers();
    // stored for limiting /reset frequency
    Core.settings.remove('lastRestart');
    //const getIp = Http.get('https://api.ipify.org?format=js');
    //getIp.submit((r) => {
    //	//serverIp = r.getResultAsString();
    //});
});
/**
 * Keeps track of any action performed on a tile for use in /tilelog
 * command.
 */
function addToTileHistory(e, eventType) {
    var _a;
    var tile = e.tile;
    var realP = e.unit ? e.unit.player : e.player;
    if (!realP)
        return;
    var pos = tile.x + ',' + tile.y;
    var destroy = e.breaking;
    (_a = tileHistory[pos]) !== null && _a !== void 0 ? _a : (tileHistory[pos] = []);
    if (eventType === 'build') {
        tileHistory[pos].push({
            name: realP.name,
            action: destroy ? 'broke' : 'built',
            type: destroy ? 'tile' : tile.block(),
            time: Date.now(),
        });
    }
    else if (eventType === 'rotate') {
        tileHistory[pos].push({
            name: realP.name,
            action: 'rotated',
            type: 'block',
            time: Date.now(),
        });
    }
    else if (eventType === 'config') {
        tileHistory[pos].push({
            name: realP.name,
            action: 'configured',
            type: 'block',
            time: Date.now(),
        });
    }
    if (tileHistory[pos].length >= 9) {
        tileHistory[pos].shift();
    }
    return;
}
;
Events.on(EventType.BlockBuildBeginEvent, function (e) {
    addToTileHistory(e, 'build');
});
Events.on(EventType.ConfigEvent, function (e) {
    addToTileHistory(e, 'config');
});
Events.on(EventType.TapEvent, function (e) {
    var fishP = players_1.FishPlayer.get(e.player);
    if (fishP.tileId) {
        e.player.sendMessage(e.tile.block().id);
        fishP.tileId = false;
    }
    else if (fishP.tilelog) {
        var realP = e.player;
        var tile = e.tile;
        var pos = tile.x + ',' + tile.y;
        if (!tileHistory[pos]) {
            realP.sendMessage("[yellow]There is no recorded history for the selected tile (".concat(tile.x, ", ").concat(tile.y, ")."));
            fishP.tilelog = false;
        }
        else {
            realP.sendMessage(tileHistory[pos].map(function (e) {
                return e.name + "[yellow] " + e.action + ' a block ' + (0, utils_1.getTimeSinceText)(e.time);
            }).join('\n'));
        }
        fishP.tilelog = false;
    }
});
Events.on(EventType.GameOverEvent, function (e) {
    ohno_1.Ohnos.onGameOver();
});
Events.on(EventType.DisposeEvent, function (e) {
    players_1.FishPlayer.saveAll();
});
Events.on(EventType.PlayerConnectionConfirmed, function (e) {
    var info = e.player.getInfo();
    if (info.timesJoined == 1) {
        Log.info("&lrNew player joined: name &c".concat(e.player.name, "&lr, uuid &c").concat(e.player.uuid(), "&lr, ip &c").concat(e.player.ip(), "&lr"));
    }
});
