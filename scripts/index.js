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
var commands_1 = require("./commands");
var config_1 = require("./config");
var consoleCommands = require("./consoleCommands");
var globals_1 = require("./globals");
var memberCommands = require("./memberCommands");
var menus = require("./menus");
var packetHandlers = require("./packetHandlers");
var playerCommands = require("./playerCommands");
var players_1 = require("./players");
var staffCommands = require("./staffCommands");
var timers = require("./timers");
var utils_1 = require("./utils");
Events.on(EventType.PlayerConnect, function (e) {
    if (players_1.FishPlayer.antiBotMode() && e.player.info.timesJoined == 1) {
        e.player.kick(Packets.KickReason.kick, 3600000);
    }
    players_1.FishPlayer.onPlayerJoin(e.player);
});
Events.on(EventType.PlayerLeave, function (e) {
    players_1.FishPlayer.onPlayerLeave(e.player);
});
Events.on(EventType.ConnectPacketEvent, function (e) {
    players_1.FishPlayer.playersJoinedLast15Seconds++;
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
        if ((0, utils_1.matchFilter)(text, fishPlayer.chatStrictness) && !fishPlayer.hasPerm("bypassChatFilter")) {
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
            action.player.sendMessage('[scarlet]\u26A0 [yellow]You are stopped, you cant perfom this action.');
            return false;
        }
        else {
            if (action.type === ActionType.pickupBlock) {
                addToTileHistory({
                    pos: "".concat(action.tile.x, ",").concat(action.tile.y),
                    uuid: action.player.uuid(),
                    action: "picked up",
                    type: (_b = (_a = action.tile.block()) === null || _a === void 0 ? void 0 : _a.name) !== null && _b !== void 0 ? _b : "nothing",
                });
            }
            return true;
        }
    });
    commands.register(staffCommands.commands, clientHandler, serverHandler);
    commands.register(playerCommands.commands, clientHandler, serverHandler);
    commands.register(memberCommands.commands, clientHandler, serverHandler);
    commands.register(packetHandlers.commands, clientHandler, serverHandler);
    commands.registerConsole(consoleCommands.commands, serverHandler);
    packetHandlers.loadPacketHandlers();
    commands.initialize();
    //const getIp = Http.get('https://api.ipify.org?format=js');
    //getIp.submit((r) => {
    //	//serverIp = r.getResultAsString();
    //});
});
/**Keeps track of any action performed on a tile for use in tilelog. */
var addToTileHistory = (0, utils_1.logErrors)("Error while saving a tilelog entry", function (e) {
    var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m, _o, _p, _q, _r, _s, _t, _u, _v, _w;
    var tile, uuid, action, type, time = Date.now();
    if (e instanceof EventType.BlockBuildBeginEvent) {
        tile = e.tile;
        uuid = (_e = (_c = (_b = (_a = e.unit) === null || _a === void 0 ? void 0 : _a.player) === null || _b === void 0 ? void 0 : _b.uuid()) !== null && _c !== void 0 ? _c : (_d = e.unit) === null || _d === void 0 ? void 0 : _d.type.name) !== null && _e !== void 0 ? _e : "unknown";
        if (e.breaking) {
            action = "broke";
            type = (e.tile.build instanceof ConstructBlock.ConstructBuild) ? e.tile.build.previous.name : "unknown";
            if ((_g = (_f = e.unit) === null || _f === void 0 ? void 0 : _f.player) === null || _g === void 0 ? void 0 : _g.uuid()) {
                players_1.FishPlayer.get(e.unit.player).tstats.blocksBroken++;
            }
        }
        else {
            action = "built";
            type = (e.tile.build instanceof ConstructBlock.ConstructBuild) ? e.tile.build.current.name : "unknown";
        }
    }
    else if (e instanceof EventType.ConfigEvent) {
        tile = e.tile.tile;
        uuid = (_j = (_h = e.player) === null || _h === void 0 ? void 0 : _h.uuid()) !== null && _j !== void 0 ? _j : "unknown";
        action = "configured";
        type = e.tile.block.name;
    }
    else if (e instanceof EventType.BuildRotateEvent) {
        tile = e.build.tile;
        uuid = (_p = (_m = (_l = (_k = e.unit) === null || _k === void 0 ? void 0 : _k.player) === null || _l === void 0 ? void 0 : _l.uuid()) !== null && _m !== void 0 ? _m : (_o = e.unit) === null || _o === void 0 ? void 0 : _o.type.name) !== null && _p !== void 0 ? _p : "unknown";
        action = "rotated";
        type = e.build.block.name;
    }
    else if (e instanceof EventType.UnitDestroyEvent) {
        tile = e.unit.tileOn();
        uuid = e.unit.isPlayer() ? e.unit.getPlayer().uuid() : (_q = e.unit.lastCommanded) !== null && _q !== void 0 ? _q : "unknown";
        action = "killed";
        type = e.unit.type.name;
    }
    else if (e instanceof EventType.BlockDestroyEvent) {
        if (config_1.Mode.attack() && ((_r = e.tile.build) === null || _r === void 0 ? void 0 : _r.team) != Vars.state.rules.defaultTeam)
            return; //Don't log destruction of enemy blocks
        tile = e.tile;
        uuid = "[[something]";
        action = "killed";
        type = (_t = (_s = e.tile.block()) === null || _s === void 0 ? void 0 : _s.name) !== null && _t !== void 0 ? _t : "air";
    }
    else if (e instanceof EventType.PayloadDropEvent) {
        action = "pay-dropped";
        var controller = e.carrier.controller();
        uuid = (_w = (_v = (_u = e.carrier.player) === null || _u === void 0 ? void 0 : _u.uuid()) !== null && _v !== void 0 ? _v : (controller instanceof LogicAI ? "".concat(e.carrier.type.name, " controlled by ").concat(controller.controller.block.name, " at ").concat(controller.controller.tileX(), ",").concat(controller.controller.tileY(), " last accessed by ").concat(e.carrier.getControllerName()) : null)) !== null && _w !== void 0 ? _w : e.carrier.type.name;
        if (e.build) {
            tile = e.build.tile;
            type = e.build.block.name;
        }
        else if (e.unit) {
            tile = e.unit.tileOn();
            if (!tile)
                return;
            type = e.unit.type.name;
        }
        else
            return;
    }
    else if (e instanceof EventType.PickupEvent) {
        action = "picked up";
        if (e.carrier.isPlayer())
            return; //This event would have been handled by actionfilter
        var controller = e.carrier.controller();
        if (!(controller instanceof LogicAI))
            return;
        uuid = "".concat(e.carrier.type.name, " controlled by ").concat(controller.controller.block.name, " at ").concat(controller.controller.tileX(), ",").concat(controller.controller.tileY(), " last accessed by ").concat(e.carrier.getControllerName());
        if (e.build) {
            tile = e.build.tile;
            type = e.build.block.name;
        }
        else if (e.unit) {
            tile = e.unit.tileOn();
            if (!tile)
                return;
            type = e.unit.type.name;
        }
        else
            return;
    }
    else if (e instanceof Object && "pos" in e && "uuid" in e && "action" in e && "type" in e) {
        var pos = void 0;
        (pos = e.pos, uuid = e.uuid, action = e.action, type = e.type);
        tile = Vars.world.tile(pos.split(",")[0], pos.split(",")[1]);
    }
    else
        return;
    if (tile == null)
        return;
    [tile, uuid, action, type, time];
    tile.getLinkedTiles(function (t) {
        var pos = "".concat(t.x, ",").concat(t.y);
        var existingData = globals_1.tileHistory[pos] ? utils_1.StringIO.read(globals_1.tileHistory[pos], function (str) { return str.readArray(function (d) { return ({
            action: d.readString(2),
            uuid: d.readString(3),
            time: d.readNumber(16),
            type: d.readString(2),
        }); }, 1); }) : [];
        existingData.push({
            action: action,
            uuid: uuid,
            time: time,
            type: type
        });
        if (existingData.length >= 9) {
            existingData = existingData.splice(0, 9);
        }
        //Write
        globals_1.tileHistory[t.x + ',' + t.y] = utils_1.StringIO.write(existingData, function (str, data) { return str.writeArray(data, function (el) {
            str.writeString(el.action, 2);
            str.writeString(el.uuid, 3);
            str.writeNumber(el.time, 16);
            str.writeString(el.type, 2);
        }, 1); });
    });
});
Events.on(EventType.BlockBuildBeginEvent, addToTileHistory);
Events.on(EventType.BuildRotateEvent, addToTileHistory);
Events.on(EventType.ConfigEvent, addToTileHistory);
Events.on(EventType.PickupEvent, addToTileHistory);
Events.on(EventType.PayloadDropEvent, addToTileHistory);
Events.on(EventType.UnitDestroyEvent, addToTileHistory);
Events.on(EventType.BlockDestroyEvent, addToTileHistory);
Events.on(EventType.TapEvent, commands_1.handleTapEvent);
Events.on(EventType.GameOverEvent, function (e) {
    var e_1, _a;
    try {
        for (var _b = __values(Object.entries(globals_1.tileHistory)), _c = _b.next(); !_c.done; _c = _b.next()) {
            var _d = __read(_c.value, 2), key = _d[0], value = _d[1];
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
    if (globals_1.fishState.restarting) {
        //restart
        Call.sendMessage("[accent]---[[[coral]+++[]]---\n[accent]Server restart imminent. [green]We'll be back after 15 seconds.[]\n[accent]---[[[coral]+++[]]---");
        (0, utils_1.serverRestartLoop)(20);
    }
    players_1.FishPlayer.onGameOver();
});
Events.on(EventType.PlayerChatEvent, function (e) {
    players_1.FishPlayer.onPlayerChat(e.player, e.message);
});
Events.on(EventType.DisposeEvent, function (e) {
    players_1.FishPlayer.saveAll();
});
