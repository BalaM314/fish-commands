"use strict";
/**
 * This used to be main.js but was renamed to index.js due to rhino issue
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
var api = require("./api");
var commands = require("./commands");
var consoleCommands = require("./consoleCommands");
var globals_1 = require("./globals");
var memberCommands = require("./memberCommands");
var menus = require("./menus");
var ohno_1 = require("./ohno");
var playerCommands = require("./playerCommands");
var players_1 = require("./players");
var staffCommands = require("./staffCommands");
var timers = require("./timers");
var utils_1 = require("./utils");
Events.on(EventType.PlayerJoin, function (e) {
    players_1.FishPlayer.onPlayerJoin(e.player);
});
Events.on(EventType.ConnectPacketEvent, function (e) {
    api.getBanned({
        ip: e.connection.address,
        uuid: e.packet.uuid
    }, function (banned) {
        if (banned) {
            Log.info("&lrSynced ban of ".concat(e.packet.uuid, "/").concat(e.connection.address, "."));
            e.connection.kick(Packets.KickReason.banned);
            Vars.netServer.admins.banPlayerIP(e.connection.address);
            Vars.netServer.admins.banPlayerID(e.packet.uuid);
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
        if ((0, utils_1.matchFilter)(text) && !fishPlayer.hasPerm("bypassChatFilter")) {
            Log.info("Censored message from player ".concat(player.name, ": ").concat(text));
            text = "[#f456f]I really hope everyone is having a fun time :) <3";
        }
        if (text.startsWith("./"))
            text = text.replace("./", "/");
        if (!fishPlayer.hasPerm("chat")) {
            players_1.FishPlayer.messageMuted(player.name, text);
            Log.info("<muted>".concat(player.name, ": ").concat(text));
            return null;
        }
        if (fishPlayer.highlight) {
            return fishPlayer.highlight + text;
        }
        return text;
    });
    // Action filters
    Vars.netServer.admins.addActionFilter(function (action) {
        var _a, _b;
        var player = action.player;
        var fishP = players_1.FishPlayer.get(player);
        //prevent stopped players from doing anything other than deposit items.
        if (!fishP.hasPerm("play")) {
            action.player.sendMessage('[scarlet]⚠ [yellow]You are stopped, you cant perfom this action.');
            return false;
        }
        else {
            if (action.type === ActionType.rotate) {
                addToTileHistory({
                    pos: "".concat(action.tile.x, ",").concat(action.tile.y),
                    name: action.player.name,
                    action: "rotated",
                    type: (_b = (_a = action.tile.block()) === null || _a === void 0 ? void 0 : _a.name) !== null && _b !== void 0 ? _b : "nothing",
                });
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
function addToTileHistory(e) {
    var _a, _b, _c, _d, _e, _f, _g;
    var pos, name, action, type, time = Date.now();
    if (e instanceof EventType.BlockBuildBeginEvent) {
        pos = e.tile.x + ',' + e.tile.y;
        name = (_e = (_c = (_b = (_a = e.unit) === null || _a === void 0 ? void 0 : _a.player) === null || _b === void 0 ? void 0 : _b.name) !== null && _c !== void 0 ? _c : (_d = e.unit) === null || _d === void 0 ? void 0 : _d.type.name) !== null && _e !== void 0 ? _e : "unknown unit";
        if (e.breaking) {
            action = "broke";
            type = (e.tile.build instanceof ConstructBlock.ConstructBuild) ? e.tile.build.previous.name : "unknown";
        }
        else {
            action = "built";
            type = (e.tile.build instanceof ConstructBlock.ConstructBuild) ? e.tile.build.current.name : "unknown";
        }
    }
    else if (e instanceof EventType.ConfigEvent) {
        pos = e.tile.tile.x + ',' + e.tile.tile.y;
        name = (_g = (_f = e.player) === null || _f === void 0 ? void 0 : _f.name) !== null && _g !== void 0 ? _g : "unknown";
        action = "configured";
        type = e.tile.tile.block().name;
    }
    else if (e instanceof Object && "pos" in e && "name" in e && "action" in e && "type" in e) {
        (pos = e.pos, name = e.name, action = e.action, type = e.type);
    }
    else
        return;
    //Decode
    var existingData = globals_1.tileHistory[pos] ? utils_1.StringIO.read(globals_1.tileHistory[pos], function (str) { return str.readArray(function (d) { return ({
        action: d.readString(2),
        name: d.readString(),
        time: d.readNumber(16),
        type: d.readString(2),
    }); }, 1); }) : [];
    existingData.push({
        action: action,
        name: name,
        time: time,
        type: type
    });
    if (existingData.length >= 9) {
        existingData = existingData.splice(0, 9);
    }
    //Encode
    globals_1.tileHistory[pos] = utils_1.StringIO.write(existingData, function (str, data) { return str.writeArray(data, function (el) {
        str.writeString(el.action, 2);
        str.writeString(el.name);
        str.writeNumber(el.time, 16);
        str.writeString(el.type, 2);
    }, 1); });
}
;
Events.on(EventType.BlockBuildBeginEvent, addToTileHistory);
Events.on(EventType.ConfigEvent, addToTileHistory);
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
        if (!globals_1.tileHistory[pos]) {
            realP.sendMessage("[yellow]There is no recorded history for the selected tile (".concat(tile.x, ", ").concat(tile.y, ")."));
        }
        else {
            var history = globals_1.tileHistory[pos] ? utils_1.StringIO.read(globals_1.tileHistory[pos], function (str) { return str.readArray(function (d) { return ({
                action: d.readString(2),
                name: d.readString(),
                time: d.readNumber(16),
                type: d.readString(2),
            }); }, 1); }) : [];
            realP.sendMessage(history.map(function (e) {
                return "".concat(e.name, " [yellow]").concat(e.action, " a ").concat(e.type, " ").concat((0, utils_1.getTimeSinceText)(e.time));
            }).join('\n'));
        }
        if (fishP.tilelog === "once")
            fishP.tilelog = null;
    }
});
Events.on(EventType.GameOverEvent, function (e) {
    var e_1, _a;
    ohno_1.Ohnos.onGameOver();
    try {
        for (var _b = __values(Object.entries(globals_1.tileHistory)), _c = _b.next(); !_c.done; _c = _b.next()) {
            var _d = __read(_c.value, 2), key = _d[0], value = _d[1];
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
